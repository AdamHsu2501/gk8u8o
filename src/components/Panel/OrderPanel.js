import React, { useState } from 'react';
import classNames from 'classnames';
import countriesList from 'countries-list'
import { makeStyles } from '@material-ui/core/styles';
import {
    Grid, Typography, Paper, IconButton, Tooltip, Button,
    List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { Person, Email, Payment, Settings, LocalShipping, Today, Print, Close, Details, Group } from '@material-ui/icons';

import { _address } from '../../variables/Values'
import Firebase, { useFirebase, _order, _user } from '../../Firebase'
import { useDrawer } from '../../hooks/useDrawer';
import ProductTable from '../Table/ProductTable'
import { MessageCard } from '../Card/MessageCard'
import Loading from '../Loading/Loading'
import MessageForm from '../Form/MessageForm'
import { getUserRecords } from '../../utils/getUserRecords'

const useStyles = makeStyles(theme => ({
    content: {
        wordBreak: 'break-all'
    },
    title: {
        background: theme.palette.warning.main,
        borderTopLeftRadius: theme.spacing(1),
        borderTopRightRadius: theme.spacing(1)
    },
    paper: {
        padding: theme.spacing(2)
    },
    msg: {
        background: theme.palette.divider,
    },
    action: {
        display: 'inline-flex'
    }
}))

function DetailContent({ list, order, onLoading, isWritable }) {
    const classes = useStyles()
    const { handleLabel } = useFirebase()

    const handleCancel = (item) => {
        onLoading()
        var batch = Firebase.firestore().batch()

        if (order.logisticsId.length === 1) {
            var info = getUserRecords(order, {
                ...order,
                status: 'pending'
            })
            batch.update(Firebase.firestore().collection(_user).doc(order.user.id), {
                points: Firebase.firestore.FieldValue.increment(info.points),
                [`amount.${order.total.currency}`]: Firebase.firestore.FieldValue.increment(info.amount)
            })
        }

        if (order.logistics.id === 'UNIMARTC2C') {
            fetch('https://us-central1-gk8u8ogkm.cloudfunctions.net/ecpay', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cancelC2C',
                    AllPayLogisticsID: item.admin,
                    CVSPaymentNo: item.user,
                    CVSValidationNo: item.CVSValidationNo
                })
            }).then(result =>
                result.text()
            ).then(result => {
                if (result.charAt(0) === '1') {
                    var obj = {
                        logisticsId: Firebase.firestore.FieldValue.arrayRemove(item),
                        records: Firebase.firestore.FieldValue.arrayUnion(result)
                    }
                    if (order.logisticsId.length === 1) {
                        obj.status = 'pending'
                    }
                    batch.update(Firebase.firestore().collection(_order).doc(order.id), obj)
                    return batch.commit()
                        .then(() => {
                            onLoading()
                        }).catch(error => {
                            console.log(error)
                        })
                } else {
                    console.log('error', result)
                    onLoading()
                }
            })
        } else {


            var obj = {
                logisticsId: Firebase.firestore.FieldValue.arrayRemove(item)
            }
            if (order.logisticsId.length === 1) {
                obj.status = 'pending'
            }

            batch.update(Firebase.firestore().collection(_order).doc(order.id), obj)
            return batch.commit()
                .then(() => {
                    onLoading()
                }).catch(error => {
                    console.log(error)
                })
        }
    }

    return (
        <List dense>
            <Paper>
                {list.map((item, key) => (
                    <ListItem key={key} className={classNames(!!item.title && classes.title)}>
                        {item.icon && (
                            <ListItemIcon>{item.icon}</ListItemIcon>
                        )}

                        <ListItemText
                            className={classes.content}
                            primary={item.value}
                            secondary={
                                <Typography
                                    component="span"
                                    variant="caption"
                                    color="textSecondary"
                                >
                                    {item.label}
                                </Typography>
                            }
                        />

                        {isWritable && item.children && (
                            <ListItemSecondaryAction className={classes.action}>
                                {order.logistics.id === 'UNIMARTC2C' && (
                                    <form action="https://us-central1-gk8u8ogkm.cloudfunctions.net/ecpay" method="POST" target="_blink" >
                                        <input type="hidden" name="action" value="printC2C" />
                                        <input type="hidden" name="AllPayLogisticsID" value={item.children.admin} />
                                        <input type="hidden" name="CVSPaymentNo" value={item.children.user} />
                                        <input type="hidden" name="CVSValidationNo" value={item.children.CVSValidationNo} />

                                        <Tooltip placement="top" title={handleLabel('printTooltip')}>
                                            <IconButton type="submit">
                                                <Print />
                                            </IconButton>
                                        </Tooltip>
                                    </form>
                                )}

                                <Tooltip placement="top" title={handleLabel('deleteTooltip')}>
                                    <IconButton onClick={() => handleCancel(item.children)}>
                                        <Close />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        )}
                    </ListItem>
                ))}
            </Paper>
        </List>
    )
}

const OrderPanel = ({ order, messages, isAdmin, isWritable, isReplyable, templates }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()
    const { open, handleOpen, handleClose } = useDrawer()
    const [loading, setLoading] = useState(false)
    const handleLoading = () => {
        setLoading(prev => !prev)
    }

    var d = new Date(order.date)

    const { total, user, logistics, logisticsId, payment, CVS } = order

    var userDetails = [
        { title: true, value: handleLabel('userDetail') },
        { icon: <Person />, value: user.displayName, label: user.id },
        { icon: <Group />, value: !user.group ? null : handleLabel(user.group.displayName), label: handleLabel('group') },
        { icon: <Email />, value: user.email },
    ]

    var orderDetails = [
        { title: true, value: handleLabel('orderDetail') },
        { icon: <Details />, value: order.id, label: handleLabel('orderNo') },
        { icon: <Today />, value: `${d.toLocaleString()} (${handleLabel(d.getDay())})` },
        { icon: <Settings />, value: handleLabel(order.status) },
        { icon: <Payment />, value: `${handleLabel(payment.displayName)} (${user.currency})`, label: handleLabel('paymentMethod') },
        { icon: <LocalShipping />, value: handleLabel(logistics.displayName), label: handleLabel('logisticsMethod') },
    ]

    logisticsId.forEach(item => {
        var value = isAdmin ? item.admin : item.user

        if (!!value) {
            orderDetails.push({
                value: value,
                label: handleLabel('logisticsId'),
                children: item,
            })
        }

    })


    if (payment.id === 'ecpay') {
        orderDetails.splice(4, 0, {
            value: order.paymentId,
            label: handleLabel('paymentId'),
        })
    }

    var shipDetails = [
        { title: true, value: handleLabel('shippingAddress') }
    ].concat(logistics.type === 'CVS' ? [
        { value: CVS.storeName, label: handleLabel('storeName') },
        { value: CVS.storeId, label: handleLabel('storeId') },
        { value: CVS.address, label: handleLabel('address') },
    ] : _address.map(item => {
        var value = user.recipient[item.id]
        if (!value) {
            return null
        } else {
            return {
                value: item.id === 'country' ? countriesList.countries[value].native : value,
                label: handleLabel(item.id)
            }
        }
    }).filter(item => !!item))


    return (
        <Grid container spacing={2}>
            <Loading open={loading} />

            {(isAdmin && !!order.user.remark) && (
                <Grid item container>
                    <MuiAlert elevation={6} variant="filled" severity="error" style={{ width: "100%" }}>
                        {order.user.remark}
                    </MuiAlert>
                </Grid>
            )}

            {(isAdmin && !!order.remark) && (
                <Grid item xs={12} >
                    <MuiAlert elevation={6} variant="filled" severity="error" style={{ width: "100%" }}>
                        {`${handleLabel('remark')} ${order.remark}`}
                    </MuiAlert>
                </Grid>
            )}

            {order.payment.id === 'Transfer' && (
                <Grid item container>
                    <MuiAlert elevation={6} variant="filled" severity="error" style={{ width: "100%" }}>
                        {`${handleLabel('remittanceAccount')}: ${order.payment.remittanceAccount}`}
                    </MuiAlert>
                </Grid>
            )}

            <Grid item xs={12} sm={4}>
                <DetailContent list={userDetails} />
            </Grid>

            <Grid item xs={12} sm={4}>
                <DetailContent
                    list={orderDetails}
                    order={order}
                    onLoading={handleLoading}
                    isWritable={isWritable}
                />
            </Grid>

            <Grid item xs={12} sm={4}>
                <DetailContent list={shipDetails} />
            </Grid>



            <Grid item xs={12} >
                <Paper >
                    <ListItem dense className={classes.title}>
                        <ListItemText primary={handleLabel('itemDetail')} />
                    </ListItem>

                    <ProductTable
                        mode={isAdmin ? 'adminView' : 'view'}
                        list={order.items}
                        currency={total.currency}
                        fee={total.shipping}
                        user={user}
                    />

                </Paper>
            </Grid>

            {!!order.adminRemark && (
                <Grid item xs={12} >
                    <ListItem dense className={classes.title}>
                        <ListItemText primary={handleLabel('adminRemark')} />
                    </ListItem>
                    <Paper className={classes.paper}>
                        <Typography>
                            {order.adminRemark}
                        </Typography>
                    </Paper>
                </Grid>
            )}

            {!!order.userRemark && (
                <Grid item xs={12} >
                    <ListItem dense className={classes.title}>
                        <ListItemText primary={handleLabel('userRemark')} />
                    </ListItem>
                    <Paper className={classes.paper}>
                        <Typography>
                            {order.userRemark}
                        </Typography>
                    </Paper>
                </Grid>
            )}

            <Grid item xs={12}>
                <ListItem dense className={classes.title}>
                    <ListItemText primary={handleLabel('message')} />
                </ListItem>
                <Paper className={classNames(classes.paper, classes.msg)}>
                    {!messages ? (
                        handleLabel('noMessage')
                    ) : (
                            <MessageCard hit={messages} />
                        )}
                </Paper>
            </Grid>

            { (!isAdmin || (isAdmin && isReplyable)) && (
                <Grid item container justify="center">
                    <Grid item container justify="center">
                        <Button variant="contained" color="secondary" onClick={() => handleOpen(true)}>
                            {handleLabel('leaveAMessage')}
                        </Button>
                    </Grid>

                    <MessageForm
                        open={!!open}
                        isAdmin={isAdmin}
                        onClose={handleClose}
                        target={order}
                        data={messages}
                        templates={templates || []}
                    >
                        <Typography variant="h6">{handleLabel('leaveAMessage')}</Typography>
                    </MessageForm>
                </Grid>
            )}
        </Grid>
    )
}

export default OrderPanel


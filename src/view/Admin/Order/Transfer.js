import React, { useState, useMemo } from 'react';
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles';
import {
    Grid, Paper, Checkbox, Button, Chip, Typography, Avatar,
    List, ListItem, ListItemIcon, ListItemText, ListItemAvatar, ListItemSecondaryAction,
} from '@material-ui/core';


import { _orderStatus, _noImage } from '../../../variables/Values';
import Firebase, { _order, useFirebase } from '../../../Firebase'
import SelectField from '../../../components/Field/SelectField'
import { getOrderInfo } from '../../../utils/getOrderInfo'

const useStyles = makeStyles((theme) => ({
    paper: {
        borderColor: theme.palette.grey[700],
        borderStyle: 'solid',
        borderWidth: 1,
        minHeight: "50vh",
        overflow: 'auto',
        wordBreak: 'break-all'
    },
    button: {
        margin: theme.spacing(0.5, 0),
    },
    width: {
        width: "100%"
    },
    img: {
        height: 60
    },
    error: {
        filter: 'grayscale(100%)'
    }
}));

function not(a, b) {
    return a.filter(selectItem => !b.find(item => Object.entries(selectItem).toString() === Object.entries(item).toString()));
}

function intersection(a, b) {
    return a.filter(selectItem => b.find(item => Object.entries(selectItem).toString() === Object.entries(item).toString()));
}

const getDocument = (order) => {
    var info = getOrderInfo(order.items, order.logistics.fee, order.user.currency, order.user.recipient.country)
    return {
        ...order,
        total: info
    }
}

const Transfer = ({ data, onClose }) => {
    var newOrder = useMemo(() => {
        return {
            ...data,
            items: [],
            id: 'new'
        }
    }, [data])

    const classes = useStyles();
    const { handleLabel } = useFirebase()
    const [checked, setChecked] = useState([]);
    const [left, setLeft] = useState(data);
    const [right, setRight] = useState(newOrder);
    const leftChecked = intersection(checked, left.items);
    const rightChecked = intersection(checked, right.items);

    const handleClick = (e, value) => {
        setRight(value || newOrder)
        setLeft(data)
    }

    const renderOption = (option) => {
        var d = new Date(option.date)

        var alert = Object.keys(left.user.recipient).some(key => {
            return left.user.recipient[key] !== option.user.recipient[key]
        })

        return (
            <div>
                <Typography>{`${handleLabel('orderNo')} ${option.id}`}</Typography>

                {alert && (
                    <Chip color="secondary" label={handleLabel('alertAddress')} />
                )}

                <Typography color="textSecondary"  >
                    {`${d.toLocaleString()}(${handleLabel(d.getDay())}) ${handleLabel(option.status)}`}
                </Typography>

                <Grid container >
                    {option.items.map((item, key) => (
                        <img
                            key={key}
                            src={item.images.length ? item.images[0].preview : _noImage}
                            onError={(e) => e.target.src = _noImage}
                            alt={item.id}
                            className={classNames(classes.img, (!!item.error && classes.error))}
                        />
                    ))}
                </Grid>
            </div>
        )
    }

    const checkStatus = (obj) => {
        if (obj.payment.id.includes('COD')) {
            return obj.status
        } else {
            return obj.items.some(item => !item.paymentDate) ? _orderStatus[0] : obj.status
        }
    }



    const handleSubmit = () => {
        var d = Date.now()

        if (right.id === 'new') {
            right.id = `odr${d}`
            right.date = d
        }

        left.status = checkStatus(left)
        right.status = checkStatus(right)

        var batch = Firebase.firestore().batch();

        batch.set(Firebase.firestore().collection(_order).doc(left.id), getDocument(left))
        batch.set(Firebase.firestore().collection(_order).doc(right.id), getDocument(right))

        batch.commit().then(() => {
            onClose()
        }).catch(error => {
            console.log('error', error)
        })
    }

    const handleToggle = (value) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];
        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        setChecked(newChecked);
    };

    const handleAllRight = () => {
        setRight(prev => ({
            ...prev,
            items: prev.items.concat(left.items)
        }));
        setLeft(prev => ({
            ...prev,
            items: []
        }));
    };

    const handleCheckedRight = () => {
        setRight(prev => ({
            ...prev,
            items: right.items.concat(leftChecked)
        }));
        setLeft(prev => ({
            ...prev,
            items: not(left.items, leftChecked)
        }));
        setChecked(not(checked, leftChecked));
    };

    const handleCheckedLeft = () => {
        setLeft(prev => ({
            ...prev,
            items: left.items.concat(rightChecked)
        }));
        setRight(prev => ({
            ...prev,
            items: not(right.items, rightChecked)
        }));
        setChecked(not(checked, rightChecked));
    };

    const handleAllLeft = () => {
        setLeft(prev => ({
            ...prev,
            items: left.items.concat(right.items)
        }));
        setRight(prev => ({
            ...prev,
            items: []
        }));
    };

    const customList = (items) => (
        <Paper className={classes.paper}>
            <Grid item xs={12}>
                <List dense >
                    {items.map((item, key) => (
                        <ListItem key={key} button onClick={handleToggle(item)} >
                            <ListItemIcon>
                                <Checkbox
                                    checked={!!checked.find(subItem => Object.entries(subItem).toString() === Object.entries(item).toString())}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            </ListItemIcon>

                            <ListItemAvatar>
                                <Avatar
                                    variant="square"
                                    src={!!item.images.length ? item.images[0].preview : _noImage}
                                    alt={item.code}
                                    className={classNames(!!item.error && classes.error)}
                                />
                            </ListItemAvatar>

                            <ListItemText primary={handleLabel(item.displayName)} />

                            <ListItemSecondaryAction>
                                <Typography>{item.qty}</Typography>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    <ListItem />
                </List>
            </Grid>
        </Paper>
    );

    return (
        <Grid container spacing={4}>
            <Grid item xs={12}>
                <SelectField
                    dbRef={
                        Firebase.firestore().collection(_order)
                            .where('user.id', '==', data.user.id)
                            .where('total.currency', '==', data.total.currency)
                            .where('status', 'in', _orderStatus.slice(0, 2))
                    }
                    label={handleLabel('order')}
                    value={right}
                    multiple={false}
                    onChange={handleClick}
                    getOptionSelected={(option, value) => option.id === value.id || option.id === data.id}
                    getOptionLabel={opt => opt.id}
                    getValue={opt => opt}
                    renderOption={renderOption}
                />
            </Grid>

            <Grid item container justify="center" alignItems="center" >
                <Grid item xs={12} sm={5}>{customList(left.items)}</Grid>
                <Grid item xs={12} sm={2}>
                    <Grid container direction="column" alignItems="center">
                        <Button
                            variant="outlined"
                            size="small"
                            className={classes.button}
                            onClick={handleAllRight}
                            disabled={!left.items.length}
                            aria-label="move all right"
                        >
                            ≫
                    </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            className={classes.button}
                            onClick={handleCheckedRight}
                            disabled={!leftChecked.length}
                            aria-label="move selected right"
                        >
                            &gt;
                    </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            className={classes.button}
                            onClick={handleCheckedLeft}
                            disabled={!rightChecked.length}
                            aria-label="move selected left"
                        >
                            &lt;
                    </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            className={classes.button}
                            onClick={handleAllLeft}
                            disabled={!right.items.length}
                            aria-label="move all left"
                        >
                            ≪
                    </Button>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={5} >{customList(right.items)}</Grid>
            </Grid>

            <Grid item container justify="flex-end">
                <Button variant='contained' onClick={handleSubmit}>
                    {handleLabel('confirm')}
                </Button>
            </Grid>
        </Grid >

    );
}

export default Transfer
import React from 'react';
import classNames from 'classnames'
import { Switch, Route, useHistory, useLocation } from "react-router-dom";
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Typography, Badge } from '@material-ui/core';
import { AddBox, Edit, Visibility, Cached, Print, Book } from '@material-ui/icons';
import countriesList from 'countries-list'

import * as ROUTES from '../../../routes'
import { _orderStatus, _locale, _noImage } from '../../../variables/Values'
import Firebase, {
    _order, _stock, _user, _message,
    useFirebase, deleteStorage,
    useFirestoreQuery
} from '../../../Firebase';
import DataTable from '../../../components/Table/DataTable';
import SlideDialog from '../../../components/Dialog/SlideDialog'
import { getDifferent } from '../../../utils/getDifferent';
import { getCurrency } from '../../../utils/getCurrency'
import { getUserRecords } from '../../../utils/getUserRecords'

import View from './View'
import Transfer from './Transfer'
import CheckoutProcess from '../../CheckoutProcess'
import { useAdmin } from '../../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: 60,
    },
    primary: {
        border: `3px solid ${theme.palette.primary.main}`
    },
    secondary: {
        border: `3px solid ${theme.palette.secondary.main}`
    },
    failed: {
        filter: 'grayscale(100%)'
    }
}));

const useColumn = () => {
    const classes = useStyles()
    const { handleLabel, exchangeRates } = useFirebase()
    return [
        {
            title: handleLabel('id'),
            field: 'id',
            filtering: false,
            render: rowData => {
                var d = new Date(rowData.date)

                return (
                    <div>
                        <Typography>
                            {rowData.id}
                        </Typography>

                        <Typography variant="caption" color="textSecondary">
                            {`${d.toLocaleString()} (${handleLabel(d.getDay())})`}
                        </Typography>
                    </div>
                )
            }
        },
        {
            title: handleLabel('email'),
            field: 'user.email',
            filtering: false,
            render: rowData => (
                <div>
                    <Typography>
                        {rowData.user.displayName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {rowData.user.email}
                    </Typography>
                </div>
            )
        },
        {
            title: handleLabel('about'),
            field: 'query',
            filtering: false,
            render: rowData => {

                return (
                    <Grid container >
                        {rowData.items.map((item, key) => (
                            <Badge key={key} badgeContent={item.qty} color={item.reserved ? "primary" : "secondary"}>
                                <img
                                    src={!!item.images.length ? item.images[0].preview : _noImage}
                                    alt={!!item.images.length ? item.images[0].name : item.id}
                                    onError={(e) => e.target.src = _noImage}
                                    className={classNames(classes.img,
                                        (item.reserved ? classes.primary : classes.secondary),
                                        (!!item.error && classes.failed)
                                    )}
                                />
                            </Badge>
                        ))}
                    </Grid>
                )
            }

        },
        {
            title: handleLabel('totalAmount'),
            field: 'total.currency',
            lookup: Object.keys(exchangeRates).reduce((a, c) => ({ ...a, [c]: c }), {}),
            render: rowData => {
                const { currency, totalAmount } = rowData.total
                return < Typography > {`${currency} ${getCurrency(totalAmount)}`}</Typography>
            }
        },
        {
            title: handleLabel('status'),
            field: 'status',
            lookup: _orderStatus.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {})
        },
        {
            title: handleLabel('country'),
            field: 'total.locale',
            lookup: _locale.reduce((a, c) => {
                var label
                if (c === 'others') {
                    label = handleLabel(c)
                } else {
                    label = countriesList.countries[c].native
                }
                return { ...a, [c]: label }
            }, {})
        }
    ]
}

const Order = ({ path }) => {
    const theme = useTheme();
    const history = useHistory()
    const { search } = useLocation()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const orders = useFirestoreQuery({
        ref: !!search ? Firebase.firestore().collection(_order).where('user.id', '==', search.substring(1)).orderBy('date', 'desc') :
            Firebase.firestore().collection(_order).orderBy('date', 'desc')
    })
    const loading = orders.loading
    const rows = orders.data || []
    var columns = useColumn()

    const handleDelete = oldData => {
        var data = rows.find(item => item.id === oldData.id)
        var path = `${_order}/${data.id}`
        var msgPath = `${_message}/${data.id}`
        var title = `${handleLabel('delete')} ${handleLabel('orderNo')} ${data.id}`
        var change = getDifferent(null, data)

        var info = getUserRecords(oldData, null)
        var batch = Firebase.firestore().batch()

        batch.delete(Firebase.firestore().doc(msgPath))

        batch.update(Firebase.firestore().collection(_user).doc(data.user.id), {
            [`amount.${data.total.currency}`]: Firebase.firestore.FieldValue.increment(info.amount),
            points: Firebase.firestore.FieldValue.increment(info.points)
        })

        var index = _orderStatus.slice(0, 4).findIndex(item => item === data.status)


        if (index >= 0) {
            data.items.forEach(item => {
                var obj = {
                    sales: Firebase.firestore.FieldValue.increment(-item.qty),
                    totalSales: Firebase.firestore.FieldValue.increment(-item.qty),
                }

                if (item.deduction) {
                    obj.quantity = Firebase.firestore.FieldValue.increment(item.qty)
                }
                batch.update(Firebase.firestore().collection(_stock).doc(item.id), obj)
            })
        }

        return Promise.all([
            deleteFirestore(path, null, change),
            batch.commit(),
            deleteStorage(msgPath)
        ])
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handlePrint = (data) => {
        var printWindow = window.open(ROUTES.PRINT, `${data.id}`, 'left=200, top=200, width=950, height=300, toolbar=0, resizable=0');
        printWindow.order = data
    }

    return (
        <div>
            <Switch>
                <Route exact path={ROUTES.ORDER}>
                    <DataTable
                        loading={loading}
                        title={path}
                        columns={columns}
                        rows={rows}
                        isDeletable={() => isDeletable}
                        isEditable={() => isEditable}
                        onDelete={handleDelete}
                        actions={[
                            {
                                icon: AddBox,
                                tooltip: handleLabel('addTooltip'),
                                disabled: !isEditable,
                                isFreeAction: true,
                                onClick: (event) => handleAction(null, 'set', handleLabel('add'))
                            },
                            {
                                icon: Visibility,
                                tooltip: handleLabel('viewTooltip'),
                                onClick: (event, rowData) => history.push({
                                    pathname: `${ROUTES.ORDER}/${rowData.id}`,
                                    state: rowData
                                })
                            },
                            {
                                icon: Book,
                                tooltip: handleLabel('logTooltip'),
                                onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                            },
                            {
                                icon: Print,
                                tooltip: handleLabel('printTooltip'),
                                onClick: (event, rowData) => handlePrint(rowData)
                            },
                            {
                                icon: Edit,
                                disabled: !isEditable,
                                tooltip: handleLabel('editTooltip'),
                                onClick: (event, rowData) => handleAction(rowData, 'update', `${handleLabel('orderNo')} ${rowData.id}`)
                            },
                            {
                                icon: Cached,
                                disabled: !isEditable,
                                tooltip: handleLabel('transferTooltip'),
                                onClick: (event, rowData) => handleAction(rowData, 'transfer', `${handleLabel('orderNo')} ${rowData.id}`)
                            },
                        ]}
                        options={{
                            filtering: true,
                            rowStyle: rowData => {
                                const { status } = rowData
                                var color
                                if (status === 'processing') {
                                    color = theme.palette.text.primary
                                } else if (status === 'pending') {
                                    color = theme.palette.warning.main
                                } else if (status === 'shipped') {
                                    color = theme.palette.info.light
                                } else if (status === 'complete') {
                                    color = theme.palette.success.main
                                } else {
                                    color = theme.palette.error.main
                                }
                                return {
                                    color: color
                                }
                            }
                        }}
                    />
                </Route>

                <Route path={`${ROUTES.ORDER}/:topicId`}>
                    <View
                        onAction={handleAction}
                        onDelete={handleDelete}
                        onPrint={handlePrint}
                        path={path}
                    />
                </Route>
            </Switch>

            <SlideDialog
                title={action.title}
                open={!!action.type}
                onClose={handleClose}
            >
                {(action.type === 'set' || action.type === 'update') && (
                    <CheckoutProcess
                        adminMode={true}
                        oldState={action.data}
                        goBack={handleClose}
                        onSubmit={() => handleSnackbar(true, `${handleLabel('update')}`)}
                    />
                )}

                {action.type === 'transfer' && (
                    <Transfer
                        data={action.data}
                        onClose={handleClose}
                    />
                )}

            </SlideDialog>
        </div>
    )
}

export default Order;
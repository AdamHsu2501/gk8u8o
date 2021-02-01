import React, { useCallback, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Typography, Grid } from '@material-ui/core';
import countriesList from 'countries-list'

import { _address, APP_NAME, _orderStatus } from '../../variables/Values';
import Firebase, { _stock, _user, _order, useFirebase, handleEmail } from '../../Firebase'
import ProductTable from '../../components/Table/ProductTable'
import PayPalButton from '../../components/Button/PayPalButton'
import { getDifferent } from '../../utils/getDifferent';
import { getOrderInfo } from '../../utils/getOrderInfo';
import { getCurrency } from '../../utils/getCurrency';
import { getMiniSKU } from '../../utils/getMiniSKU'
import { getUserRecords } from '../../utils/getUserRecords'
import { getPaypalOrder } from '../../utils/getPaypalOrder'

import { useOrder } from './index'

const useStyles = makeStyles(theme => ({
    divider: {
        borderTop: '1px grey solid',
    },
    bold: {
        fontWeight: 700,
        paddingLeft: theme.spacing(1)
    },
}))

const ConfirmContent = () => {
    const classes = useStyles();
    const { oldState, state, setLoading, adminMode, activeStep, handleStep, handleShopCart } = useOrder()
    const { auth, handleLabel, langCode } = useFirebase()

    const itemName = state.items.reduce((a, c) => {
        a = a.concat(`#${c.code}*${c.qty}`)
        return a
    }, '')

    const info = getOrderInfo(state.items, state.logistics.fee, state.user.currency, state.user.recipient.country)

    const checkStock = useCallback(() => {
        return Promise.all(
            state.items.map(item => {
                return Firebase.firestore().collection(_stock).doc(item.id).get().then(snap => {
                    var error = null;
                    if (!snap.exists) {
                        error = 'disabled';
                    } else {
                        var data = snap.data();

                        if (data.status === 'disabled' || data.status === 'outOfStatus') {
                            error = data.status
                        } else {
                            if (item.deduction && item.reserved) {
                                var qty = data.quantity - (item.qty - item.prevD)
                                if (qty < 0) {
                                    error = data.quantity === 0 ? 'outOfStock' : 'outOfQty'
                                }
                            }
                        }
                    }

                    return {
                        id: item.id,
                        error: error,
                        quantity: data.quantity,
                        status: data.status,
                    }
                })
            })
        ).then(results => {
            var pass = results.every(item => !item.error)

            if (!pass && !adminMode) {
                handleShopCart('error', results)
                handleStep(-1)
            }

            return pass
        })
    }, [state, handleShopCart, handleStep, adminMode])

    const handleUpload = useCallback((payInfo) => {
        var { user, logistics, CVS } = state
        var { currency, recipient, email, id } = user
        var batch = Firebase.firestore().batch();
        var d = new Date()
        var language = adminMode ? user.language : langCode

        var oldStatus = !oldState ? true : _orderStatus.slice(0, 4).includes(oldState.status)
        var newStatus = _orderStatus.slice(0, 4).includes(state.status)

        // set order
        var order = {
            ...state,
            user: {
                ...user,
                language: language,
            },
            CVS: logistics.type === 'CVS' ? CVS : null,
            items: state.items.map(item => !payInfo ? getMiniSKU(item, state.id) : getMiniSKU(item, payInfo.id, payInfo.date)),
            date: state.date || d.getTime(),
            status: !payInfo ? state.status : "pending",
            paymentId: !payInfo ? state.paymentId : payInfo.id,
            paymentDate: !payInfo ? state.paymentDate : payInfo.date,
            query: newStatus ? state.items.map(item => item.id) : [],
            total: info,
        }
        // console.log('order', order)
        batch.set(Firebase.firestore().collection(_order).doc(order.id), order);

        //update user recipient
        var userInfo = getUserRecords(oldState, order)
        batch.update(Firebase.firestore().collection(_user).doc(id), {
            currency: currency,
            recipient: recipient,
            language: language,
            points: Firebase.firestore.FieldValue.increment(userInfo.points),
            [`amount.${info.currency}`]: Firebase.firestore.FieldValue.increment(userInfo.amount)
        })

        //update products stock
        if (oldStatus || newStatus) {
            state.items.forEach(item => {
                var dNum = item.deduction && item.reserved && newStatus ? item.qty - item.prevD : -item.prevD;
                var sNum = newStatus ? item.qty - item.prevS : -item.prevS

                batch.update(Firebase.firestore().collection(_stock).doc(item.id), {
                    quantity: Firebase.firestore.FieldValue.increment(-dNum),
                    sales: Firebase.firestore.FieldValue.increment(sNum),
                    totalSales: Firebase.firestore.FieldValue.increment(sNum),
                })
            })
        }

        //update delete products stock
        if (!!oldState) {
            oldState.items.filter(oi => !state.items.find(i => i.id === oi.id)).forEach(item => {
                var dNum = item.deduction && item.reserved ? item.qty : 0
                batch.update(Firebase.firestore().collection(_stock).doc(item.id), {
                    quantity: Firebase.firestore.FieldValue.increment(dNum),
                    sales: Firebase.firestore.FieldValue.increment(-item.qty),
                    totalSales: Firebase.firestore.FieldValue.increment(-item.qty),
                })
            })
        }

        var change = getDifferent(order, oldState)
        // console.log('change', change)
        if (!!change) {
            //update log
            if (adminMode) {
                batch.set(Firebase.firestore().collection(`${_order}/${order.id}/log`).doc(), {
                    date: d.getTime(),
                    user: {
                        id: auth.id,
                        email: auth.email,
                    },
                    type: 'update',
                    target: order.id,
                    change: change
                })
            }

            if (!!Object.keys(change).filter(key => key !== 'remark').length) {
                //send email
                // console.log('send email')
                var addressArray = [recipient.city, recipient.address1]
                if (!!recipient.state.length) {
                    addressArray.shift(recipient.state)
                }
                if (!!recipient.address2.length) {
                    addressArray.push(recipient.address2)
                }

                var address = recipient.country === 'TW' ? addressArray.join('') : addressArray.reverse().join(', ')

                var orderDate = new Date(order.date)
                var emailInfo = {
                    from: APP_NAME,
                    to: email,
                    subject: !!oldState ? handleLabel('emailModifiedOrder', language) : handleLabel('emailOrder', language),
                    template: _order,
                    context: {
                        systemEmail: handleLabel('systemEmail', language),
                        date: orderDate.toLocaleString(),
                        update: !oldState ? null : d.toLocaleString(),
                        orderStatus: handleLabel(order.status, language),
                        paymentMethod: handleLabel(order.payment.displayName, language),
                        logisticsMethod: handleLabel(order.logistics.displayName, language),
                        id: order.id,
                        items: order.items.map(item => ({
                            ...item,
                            price: getCurrency(item.price),
                            displayName: handleLabel(item.displayName, language),
                            subtotal: getCurrency(item.qty * item.price),
                            status: handleLabel(item.status, language)
                        })),
                        totalAmount: getCurrency(info.totalAmount),
                        subtotal: getCurrency(info.subtotal),
                        discount: getCurrency(info.discount),
                        points: info.points,
                        pointsAmount: getCurrency(info.pointsAmount),
                        shipping: getCurrency(info.shipping),
                        currency: info.currency,

                        isCVS: logistics.type === 'CVS',
                        CVS: CVS,
                        name: recipient.name,
                        phone: recipient.phone,
                        zip: recipient.zip,
                        address: address,
                        country: countriesList.countries[recipient.country].native,
                        href: window.location.origin,
                        APP_NAME: APP_NAME,
                        //label
                        orderDetail: handleLabel("orderDetail", language),
                        dateLabel: handleLabel("date", language),
                        updateLabel: handleLabel('update', language),
                        orderStatusLabel: handleLabel('orderStatus', language),
                        paymentMethodLabel: handleLabel('paymentMethod', language),
                        logisticsMethodLabel: handleLabel('logisticsMethod', language),

                        itemDetail: handleLabel("itemDetail", language),
                        orderNo: handleLabel("orderNo", language),
                        displayNameLabel: handleLabel("displayName", language),
                        unitPriceLabel: handleLabel("unitPrice", language),
                        quantityLabel: handleLabel('quantity', language),
                        amountLabel: handleLabel('amount', language),
                        subtotalLabel: handleLabel("subtotal", language),
                        discountLabel: handleLabel('discount', language),
                        pointsAmountLabel: handleLabel('pointsAmount', language),
                        shippingLabel: handleLabel("shippingFee", language),
                        totalAmountLabel: handleLabel('totalAmount', language),

                        recipientLable: handleLabel("recipient", language),
                        nameLabel: handleLabel('name', language),
                        phoneLabel: handleLabel('phone', language),
                        addressLabel: handleLabel('address', language),
                        zipLabel: handleLabel('zip', language),
                        countryLabel: handleLabel('country', language),
                        storeIdLabel: handleLabel('storeId', language),
                        storeName: handleLabel('storeName', language)
                    }
                }
                handleEmail(emailInfo, 'order', info.locale)
            }
        }
        return batch.commit()
    }, [adminMode, handleLabel, oldState, state, info, langCode, auth])

    const clearItems = useCallback(() => {
        if (!adminMode) {
            state.items.forEach(item => {
                handleShopCart('delete', item)
            })
        }

    }, [state, adminMode, handleShopCart])

    var ecpayRef = useRef()

    var nextBtn
    if (adminMode) {
        nextBtn = (
            <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                    setLoading(true)
                    return handleUpload().then(() => {
                        handleStep(activeStep + 1)
                    })
                }}
            >
                {handleLabel('confirm')}
            </Button>
        )
    } else {
        if (state.payment.id === 'ECPay') {

            nextBtn = (
                <form
                    action="https://us-central1-gk8u8ogkm.cloudfunctions.net/ecpay"
                    method="POST"
                    ref={ecpayRef}
                    onSubmit={(e) => {
                        e.preventDefault()
                        setLoading(true)

                        return checkStock().then(() => {
                            return handleUpload()
                        }).then(() => {
                            return clearItems()
                        }).then(() => {
                            ecpayRef.current.submit()
                        })
                    }}
                >
                    <input type="hidden" name="action" value='checkout' ></input>
                    <input type="hidden" name="MerchantTradeNo" value={state.id} ></input>
                    <input type="hidden" name="TotalAmount" value={info.totalAmount} ></input>
                    <input type="hidden" name="ItemName" value={itemName} ></input>
                    <Button
                        variant="contained"
                        color="secondary"
                        type="submit"
                    >
                        {handleLabel('checkout')}
                    </Button>
                </form>
            )
        } else if (state.payment.id === 'PayPal') {
            if (!state.id) {
                nextBtn = null;
            }

            var handleSubmit = (payInfo) => {
                return handleUpload(payInfo).then(() => {
                    clearItems()
                    handleStep(activeStep + 1)
                })
            }

            // nextBtn = <PayPalButton order={state} info={info} onSubmit={handleSubmit} checkStock={checkStock} />
            var paypalOrder = getPaypalOrder(handleLabel, state.id, `${APP_NAME} Goods`, info, state.items)
            nextBtn = <PayPalButton state={paypalOrder} onSubmit={handleSubmit} checkStock={checkStock} />

        } else {
            nextBtn = (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                        setLoading(true)
                        return checkStock().then(() => {
                            return handleUpload()
                        }).then(() => {
                            clearItems()
                            handleStep(activeStep + 1)
                        })
                    }}
                >
                    {handleLabel('placeOrder')}
                </Button>
            )
        }
    }



    return (
        <Grid container spacing={4}>
            <Grid item container spacing={2}>

                {_address.map((item, key) => (
                    <Grid key={key} item xs={12} sm={6}  >
                        <Typography color="textSecondary" >{handleLabel(item.id)}:</Typography>
                        <Typography className={classes.bold} >
                            {item.id === 'country' ?
                                countriesList.countries[state.user.recipient[item.id]].native
                                :
                                state.user.recipient[item.id]
                            }
                        </Typography>
                    </Grid>
                ))}

                <Grid item xs={12} sm={6} >
                    <Typography color="textSecondary" >{handleLabel('paymentMethod')}:</Typography>
                    <Typography className={classes.bold} >{handleLabel(state.payment.displayName)}</Typography>

                </Grid>

                <Grid item xs={12} sm={6} >
                    <Typography color="textSecondary">{handleLabel('logisticsMethod')}:</Typography>
                    <Typography className={classes.bold}>{handleLabel(state.logistics.displayName)}</Typography>
                </Grid>

                {state.logistics.type === 'CVS' && (
                    <Grid item xs={12} >
                        <Typography color="textSecondary">{handleLabel('storeName')}:</Typography>
                        <Typography className={classes.bold}>{`${state.CVS.storeName} - ${state.CVS.address}`}</Typography>
                    </Grid>
                )}
            </Grid>

            <Grid item container className={classes.divider}>
                <ProductTable
                    mode={adminMode ? 'adminView' : 'view'}
                    list={state.items}
                    currency={info.currency}
                    fee={info.shipping}
                    user={state.user}
                />
            </Grid>

            <Grid item container justify="space-between">
                <Grid>
                    <Button
                        variant="outlined"
                        onClick={() => handleStep(activeStep - 1)}
                    >
                        {handleLabel('return')}
                    </Button>
                </Grid>

                <Grid>
                    {nextBtn}
                </Grid>
            </Grid>
        </Grid>
    )
}


export default ConfirmContent
import React, { useState } from 'react';
import qs from 'qs'
import { useHistory, useParams } from 'react-router-dom'
import { Grid } from '@material-ui/core';
import { Edit, Cached, DeleteOutline, LocalShipping, Print } from '@material-ui/icons';
import countriesList from 'countries-list'

import { APP_NAME } from '../../../variables/Values'
import Firebase, { _order, _message, useFirebase, handleEmail, _user, _template, useFirestoreQuery } from '../../../Firebase'
import ButtonGroup from '../../../components/Button/ButtonGroup'
import DeleteAlert from '../../../components/Dialog/DeleteAlert'
import Loading from '../../../components/Loading/Loading'
import OrderPanel from '../../../components/Panel/OrderPanel'
import ReturnButton from '../../../components/Button/ReturnButton'
import Form from '../../../components/Form/UpdateForm'
import { getCurrency } from '../../../utils/getCurrency'
import { getUserRecords } from '../../../utils/getUserRecords'

const View = ({ onAction, onPrint, onDelete, path }) => {
    let history = useHistory();
    let { topicId } = useParams();
    const { auth, handleLabel } = useFirebase();
    const { admin, permission } = auth
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const order = useFirestoreQuery({
        ref: Firebase.firestore().collection(_order).doc(topicId),
        required: true
    })

    const messages = useFirestoreQuery({
        ref: Firebase.firestore().collection(_message).doc(topicId),
    })

    const templates = useFirestoreQuery({ ref: Firebase.firestore().collection(_template) })

    if (order.loading || messages.loading || templates.loading) {
        return <div>Loading...</div>
    }

    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var isReplyable = admin === 2 ? true : permission[path].reply
    var isShippable = admin === 2 ? true : permission[path].shipment
    if (!!order.data && (order.data.status === "refunded" || order.data.status === 'canceled')) {
        isShippable = false
    }

    var btnGroup = []
    if (isEditable) {
        btnGroup.push({ icon: <Edit />, label: handleLabel('editTooltip'), value: 'update' })
        btnGroup.push({ icon: <Cached />, label: handleLabel('transferTooltip'), value: 'transfer' })
    }

    if (isShippable) {
        btnGroup.push({ icon: <LocalShipping />, label: handleLabel('shippingTooltip'), value: 'shipping' })
        btnGroup.push({ icon: <Print />, label: handleLabel('printTooltip'), value: 'print' })
    }

    if (isDeletable) {
        btnGroup.push({ icon: <DeleteOutline color="secondary" />, label: handleLabel('deleteTooltip'), value: 'delete' })
    }


    const sendEmail = () => {
        var { id, payment, logistics, total, user, items, CVS } = order.data
        var { language, recipient } = user

        var addressArray = [recipient.state, recipient.city, recipient.street, recipient.street1, recipient.street2]
        var address = recipient.country === 'TW' ? addressArray.join('') : addressArray.reverse().join(', ')
        if (!!recipient.company) {
            address = `${address} - ${recipient.company}`
        }
        var email = {
            from: APP_NAME,
            to: user.email,
            subject: handleLabel('emailShipping', language),
            template: 'shipping',
            context: {
                systemEmail: handleLabel('systemEmail', language),
                id: id,
                currency: total.currency,
                paymentMethod: handleLabel(payment.displayName, language),
                logisticsMethod: handleLabel(logistics.displayName, language),
                totalAmount: getCurrency(total.totalAmount),
                rewards: total.rewards,
                items: items.map(item => ({
                    ...item,
                    displayName: handleLabel(item.displayName, language),
                })),
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
                orderNo: handleLabel("orderNo", language),
                dateLabel: handleLabel("date", language),
                totalAmountLabel: handleLabel('totalAmount', language),
                pointsRewardedLabel: handleLabel('rewardPoints', language),
                paymentMethodLabel: handleLabel('paymentMethod', language),
                logisticsMethodLabel: handleLabel('logisticsMethod', language),
                itemDetail: handleLabel("itemDetail", language),
                displayNameLabel: handleLabel("displayName", language),
                quantityLabel: handleLabel('quantity', language),
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

        return handleEmail(email, 'order', total.locale)
    }

    const handleDelete = () => {
        onDelete(order.data)
        history.goBack()
    }

    const handleClose = () => {
        setOpen(false)
    }

    const handleUpdate = (data) => {
        var { id, total, user } = order.data
        var batch = Firebase.firestore().batch()
        var info = getUserRecords(order.data, data)
        // update user
        batch.update(Firebase.firestore().collection(_user).doc(user.id), {
            points: Firebase.firestore.FieldValue.increment(info.points),
            [`amount.${total.currency}`]: Firebase.firestore.FieldValue.increment(info.amount),
        })

        //update order
        batch.update(Firebase.firestore().collection(_order).doc(id), data)

        return batch.commit()
            .then(() => {
                return sendEmail()
            }).then(() => {
                setOpen(false)
                setLoading(false)
            })
    }

    const handleShipping = (newData) => {
        setLoading(true)
        var d = Date.now()

        var newOrder = {
            ...order.data,
            status: 'shipped',
            logisticsId: order.data.logisticsId.concat(newData.logisticsId.map(item => ({
                ...item,
                date: d
            })))
        }

        return handleUpdate(newOrder)
    }

    const handleUNIMARTC2C = () => {
        setLoading(true)
        const { items, total, payment, logistics, user, CVS } = order.data
        var goodsName = items.reduce((a, c) => {
            var str = `${c.code}-${c.qty}`
            if (str.length + a.length > 50) {
                return a
            } else {
                a = a.concat(str)
                return a
            }
        }, '')

        return fetch('https://us-central1-gk8u8ogkm.cloudfunctions.net/ecpay', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'createC2C',
                MerchantTradeNo: "",
                GoodsAmount: total.totalAmount,
                IsCollection: payment.collection ? 'Y' : 'N',
                GoodsName: goodsName,
                SenderName: logistics.sender.name,
                SenderCellPhone: logistics.sender.phone,
                ReceiverName: user.recipient.name,
                ReceiverCellPhone: user.recipient.phone,
                ReceiverEmail: user.email,
                ReceiverStoreID: CVS.storeId,
            })
        })
            .then(result => result.text())
            .then(result => {

                var code = result.split('|')[0]

                if (code === '1') {
                    var { logisticsId, records } = order.data

                    var obj = qs.parse(result.slice(2))
                    var d = new Date(obj.UpdateStatusDate)
                    var newOrder = {
                        ...order.data,
                        status: 'shipped',
                        records: records.concat(result),
                        logisticsId: logisticsId.concat({
                            admin: obj.AllPayLogisticsID,
                            user: obj.CVSPaymentNo,
                            CVSValidationNo: obj.CVSValidationNo,
                            date: d.getTime()
                        })
                    }

                    return handleUpdate(newOrder)
                } else {
                    throw Error(result)
                }
            })
            .catch(error => {
                setLoading(false)
                alert(error)
            })
    }

    const handleCallback = (value) => {
        if (value === 'delete' || value === 'reply') {
            setOpen(value)
        } else if (value === 'shipping') {
            if (order.data.logistics.id === 'UNIMARTC2C') {
                handleUNIMARTC2C()
            } else {
                setOpen(value)
            }
        } else if (value === 'print') {
            onPrint(order.data)
        } else {
            onAction(order.data, value, `${handleLabel('orderNo')} ${order.data.id}`)
        }
    }

    if (order.loading || messages.loading) {
        return <div>Loading...</div>
    }

    var format = [
        {
            fieldType: 'event',
            id: 'logisticsId',
            label: handleLabel('logisticsId'),
            value: [],
            list: [
                {
                    fieldType: 'text',
                    id: 'user',
                    label: handleLabel('user'),
                    value: '',
                },
                {
                    fieldType: 'text',
                    required: true,
                    id: 'admin',
                    label: handleLabel('backend'),
                    value: '',
                }
            ],
        },
    ]


    return (
        <Grid container spacing={2}>
            <Loading open={loading} />

            <Grid item container justify="space-between">
                <ReturnButton />

                {!!btnGroup.length && (
                    <ButtonGroup
                        list={btnGroup}
                        onCallback={handleCallback}
                    />
                )}
            </Grid>

            <Grid item>
                <OrderPanel
                    order={order.data}
                    messages={messages.data}
                    isAdmin={true}
                    isWritable={isShippable}
                    isReplyable={isReplyable}
                    templates={templates.data}
                />
            </Grid>

            <DeleteAlert open={open === 'delete'} title={handleLabel('alert')} onSubmit={handleDelete} onClose={handleClose} />

            <Form
                open={open === 'shipping'}
                title={handleLabel('logisticsId')}
                format={format}
                onClose={handleClose}
                onSubmit={handleShipping}
            />
        </Grid>
    )
}

export default View
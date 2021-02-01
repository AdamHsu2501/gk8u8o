import React, { useState, useCallback, useEffect } from 'react'
import countriesList from 'countries-list'
import {
    Grid, Button, Typography,
    Container,
} from '@material-ui/core';
import { Send } from '@material-ui/icons';

import { APP_NAME, _locale } from '../../variables/Values'
import Firebase, { useFirebase, _template, _order, _user, _stock, handleEmails } from '../../Firebase'
import TextField from '../Field/TextField';
import SelectField from '../Field/SelectField';
import SlideDialog from './SlideDialog'
import { getOrderInfo } from '../../utils/getOrderInfo'
import RequestTable from '../Table/RequestTable'


const initState = {
    text: '',
    locale: _locale[0],
    type: 'arrival'
}

const handleOrders = (list) => {

    return list.reduce((a, c) => {
        const { user } = c
        var id = user.id

        if (!a[id]) {
            a[id] = {
                id: id,
                lang: user.language,
                displayName: user.displayName,
                email: user.email,
                remark: user.remark,
                checked: true,
                reserved: false,
                orders: [c]
            }
        } else {
            a[id].orders.push(c)
        }
        return a
    }, {})
}

const EmailPanel = (({ open, title, data, onClose, onSubmit }) => {
    const { auth, handleLabel } = useFirebase()
    const typeOptions = [
        { value: 'arrival', label: handleLabel('arrival') },
        { value: 'failed', label: handleLabel('failed') },
    ]

    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState(null)
    const [state, setState] = useState(initState)

    useEffect(() => {
        setState(initState)
        setUsers(null)
        setLoading(false)
    }, [open])

    useEffect(() => {
        if (!!data && !!state.locale) {
            setLoading(true)

            Firebase.firestore().collection(_order)
                .where('query', 'array-contains', data.id)
                .where('total.locale', '==', state.locale)
                .where('status', 'in', ['processing', 'pending'])
                .get()
                .then(snap => {
                    var arr = snap.docs.map(doc => doc.data())
                    setUsers(handleOrders(arr))
                    setLoading(false)
                })

        }
    }, [state.locale, data])

    const handleChange = useCallback((id, value, parentId) => {
        return setState(prev => ({
            ...prev,
            [id]: value || ""
        }))
    }, [])

    const handleToggle = (e, id, parent) => {
        var checked = e.target.checked

        if (!id) {
            setUsers(prev => {
                return Object.values(prev).reduce((a, c) => {
                    return {
                        ...a,
                        [c.id]: {
                            ...c,
                            [parent]: checked
                        }
                    }
                }, {})
            })
        } else {
            setUsers(prev => {
                return {
                    ...prev,
                    [id]: {
                        ...prev[id],
                        [parent]: checked
                    }
                }
            })
        }
    };

    const handleSubmit = () => {
        setLoading(true)
        var matchs = state.text.match(/{\w*}/g) || []
        var words = matchs.filter((item, key, self) => self.indexOf(item) === key)

        var emails = Object.values(users).filter(user => user.checked).map(user => {
            var { email, lang } = user

            var orders = user.orders.map(order => {
                var items = order.items.map(item => ({
                    displayName: item.displayName[lang],
                    code: item.code,
                    qty: item.qty,
                    imgUrl: item.images[0].preview,
                }))
                return {
                    id: order.id,
                    status: handleLabel(order.status, lang),
                    items: items
                }
            })

            var text = state.text

            words.forEach(id => {
                var str = user[id.slice(1, -1)]
                text = text.split(id).join(str)
            })

            return {
                from: APP_NAME,
                to: email,
                subject: state.type === 'arrival' ? handleLabel('emailShippingRequest', lang) : handleLabel('emailStockFailed', lang),
                template: 'request',
                bcc: 'rpggamecentermaster@gmail.com',
                context: {
                    systemEmail: handleLabel('systemEmail', lang),
                    displayName: data.displayName[lang],
                    code: data.code,
                    imgUrl: !!data.images.length ? data.images[0].preview : null,
                    text: text.replace(/(\r\n|\n|\r)/gm, '<br>'),
                    orders: orders,
                    href: window.location.origin,
                    APP_NAME: APP_NAME,
                    //label
                    orderNo: handleLabel("orderNo", lang),
                    displayNameLabel: handleLabel("displayName", lang),
                    quantityLabel: handleLabel('quantity', lang),
                }
            }
        })

        var batch = Firebase.firestore().batch()

        if (state.type === 'failed') {

            Object.values(users).forEach(user => {
                var dPoints = 0
                user.orders.forEach(order => {
                    var newItems = order.items.map(item => item.id === data.id ? ({
                        ...item,
                        error: 'failed',
                    }) : item)

                    var info = getOrderInfo(newItems, order.logistics.fee, order.user.currency, order.user.recipient.country)
                    dPoints += order.total.points - info.points
                    batch.update(Firebase.firestore().collection(_order).doc(order.id), {
                        ...order,
                        items: newItems,
                        total: info
                    })
                })

                batch.update(Firebase.firestore().collection(_user).doc(user.id), {
                    points: Firebase.firestore.FieldValue.increment(dPoints)
                })
            })

            if (data.status !== 'failed') {
                var ref = `${_stock}/${data.id}`
                batch.update(Firebase.firestore().doc(ref), { status: 'failed' })
                batch.set(Firebase.firestore().collection(`${ref}/log`).doc(), {
                    date: Date.now(),
                    user: {
                        id: auth.id,
                        email: auth.email,
                    },
                    type: 'update',
                    target: data.id,
                    change: { status: `${data.status} > failed` }
                })
            }
        } else {
            Object.values(users).filter(user => user.reserved).forEach(user => {
                user.orders.forEach(order => {
                    batch.update(Firebase.firestore().collection(_order).doc(order.id), {
                        ...order,
                        items: order.items.map(item => item.id === data.id ? ({
                            ...item,
                            error: null,
                            reserved: true,
                        }) : item)
                    })
                })
            })
        }

        return Promise.all([
            batch.commit(),
            handleEmails(emails)
        ]).then(() => {
            onSubmit(true)
        }).catch(error => {
            console.log('EmailPanel error', error)
            onSubmit(false)
        })
    }

    return (
        <SlideDialog
            open={open}
            loading={loading}
            title={title}
            onClose={onClose}
            content={!!users && <RequestTable list={users} data={data} onSubmit={handleToggle} />}
            actions={(
                <Container fixed>
                    <Grid container spacing={1} >
                        <Grid item xs={6} >
                            <TextField
                                id='locale'
                                label={handleLabel('locale')}
                                value={state.locale}
                                onChange={handleChange}
                                options={_locale.map(id => ({
                                    value: id, label: id !== 'others' ? countriesList.countries[id].native : handleLabel(id)
                                }))}
                            />
                        </Grid>

                        <Grid item xs={6} >
                            <TextField
                                id='type'
                                label={handleLabel('type')}
                                value={state.type}
                                onChange={handleChange}
                                options={typeOptions}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <SelectField
                                id="text"
                                label={handleLabel('template')}
                                onChange={handleChange}
                                multiple={false}
                                getOptionLabel={opt => opt.displayName}
                                getValue={opt => opt.text}
                                renderOption={opt => (
                                    <div>
                                        <Typography>{opt.displayName}</Typography>

                                        <Typography color="textSecondary" variant="caption" >
                                            {opt.text}
                                        </Typography>
                                    </div>
                                )}

                                dbRef={Firebase.firestore().collection(_template)}
                            />
                        </Grid>

                        <Grid item xs={12} >
                            <TextField
                                id='text'
                                label={handleLabel('message')}
                                helperText={handleLabel('textHelper')}
                                value={state.text}
                                onChange={handleChange}
                                multiline
                                rows={5}
                                rowsMax={5}
                            />
                        </Grid>

                        <Grid item container justify="flex-end">
                            <Button color="primary" onClick={handleSubmit} variant="contained" startIcon={<Send />}>
                                {handleLabel('send')}
                            </Button>
                        </Grid>
                    </Grid>
                </Container>
            )}

        />
    )
})

export default EmailPanel
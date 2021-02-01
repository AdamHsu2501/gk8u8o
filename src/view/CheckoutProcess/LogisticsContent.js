import React, { useState, useEffect, useCallback } from 'react';
import { Grid, FormControl, RadioGroup, FormControlLabel, Radio } from '@material-ui/core/';

import { _volumetricWeight } from '../../variables/Values'
import twZipCodes from '../../variables/twZipCodes'
import Firebase, { useFirebase } from '../../Firebase'
import CVSButton from '../../components/Button/CVSButton'
import NumberField from '../../components/Field/NumberField'
import { getQuote } from '../../DHL/getQuote'
import { useOrder } from './index'

const _length = _volumetricWeight.filter(item => item.label === 'cm').map(item => item.id)

const formatOption = (data, fee) => {
    return {
        displayName: data.displayName,
        id: data.id,
        sender: data.sender,
        type: data.type,
        fee: Math.ceil(fee * 100) / 100
    }
}

const getOptions = (l, list, exchangeRates, locale) => {
    var bool = list.every(item => fit(l.spec, item))
    if (!bool) {
        return null
    }

    var totalVW = list.map(item => {
        var vw = _length.reduce((a, c) => a *= item.volumetricWeight[c], 1) / l.spec.formula
        return Math.max(vw, item.volumetricWeight.weight) * item.qty
    }).reduce((a, c) => a += c, 0)

    var rate = l.rates.reverse().find(rate => rate.weight <= totalVW)

    if (!rate) {
        return null
    }

    var fee = !!locale && locale.offshore ? rate.offFee : rate.fee

    return Promise.resolve(formatOption(l, fee * exchangeRates))
}

const fit = (spec, b) => {
    var obj = {
        maxAmount: b.price,
        maxLength: Math.max(..._length.map(id => b.volumetricWeight[id])),
        sumLength: _length.reduce((a, c) => a += b.volumetricWeight[c], 0),
        maxSize: _length.reduce((a, c) => a *= b.volumetricWeight[c], 1),
        weight: b.volumetricWeight.weight,
    }

    return Object.keys(obj).every(key => {
        if (!spec[key]) {
            return true
        }

        var bool = spec.type === 'less' ? obj[key] < spec[key] : obj[key] <= spec[key]
        return bool
    })
}

const LogisticsContent = () => {
    const { exchangeRates } = useFirebase()
    const { adminMode, state, setState, setDisabled, setLoading } = useOrder()
    var { payment, items, user, logistics, CVS } = state
    const { handleLabel } = useFirebase()
    const [options, setOptions] = useState([])
    var locale = twZipCodes.find(item => user.recipient.zip.startsWith(item.id))

    const handleChange = event => {
        var value = event.target.value;
        var doc = options.find(item => item.id === value)

        setState(prev => ({
            ...prev,
            logistics: {
                ...prev.logistics,
                ...doc
            }
        }))
    };

    const handleFee = (id, value) => {
        setState(prev => ({
            ...prev,
            logistics: {
                ...prev.logistics,
                fee: value
            }
        }))
    }

    const handleCVS = useCallback((data) => {
        setState(prev => ({
            ...prev,
            CVS: data
        }))
    }, [setState])



    useEffect(() => {
        setLoading(true)

        Firebase.firestore().doc('system/logistics').get().then(snap => {
            if (!snap.exists) {
                throw Error
            }

            var docs = snap.data()

            return Promise.all(
                Object.values(docs).filter(doc => doc.enable && doc.method.includes(payment.id)).map(doc => {
                    if (doc.id === 'DHL') {
                        return getQuote(
                            doc.sender,
                            user.recipient,
                            items
                        ).then(results => {
                            if (results.error) {
                                return null
                            }
                            return formatOption(doc, results.fee * exchangeRates[user.currency])
                        })
                    } else {
                        return getOptions(doc, items, exchangeRates[user.currency], locale)
                    }
                })
            )
        }).then(results => {
            setOptions(results.filter(item => !!item))
            setLoading(false)
        }).catch((error) => {
            alert(handleLabel('errorSetLogistics'))
        })

    }, [payment, items, user, exchangeRates, handleLabel, locale, setLoading])


    var disabled

    if (!logistics.id) {
        disabled = true
    } else {
        disabled = logistics.type === 'CVS' ? !CVS : false
    }

    useEffect(() => {
        setDisabled(disabled)
    }, [disabled, setDisabled])

    return (
        <Grid container justify="center">
            <FormControl>
                <RadioGroup value={logistics.id} onChange={handleChange}>
                    {options.map((item, key) => (
                        <Grid key={key} >
                            <FormControlLabel
                                value={item.id}
                                control={<Radio />}
                                label={`${handleLabel(item.displayName)} - ${user.currency} ${item.fee}`}
                            />
                            {logistics.id === item.id && adminMode && (
                                <NumberField
                                    id="fee"
                                    label={handleLabel('shippingFee')}
                                    value={logistics.fee}
                                    thousandSeparator
                                    onChange={handleFee}
                                    prefix={`${user.currency} `}
                                />
                            )}
                            {logistics.type === 'CVS' && logistics.id === item.id && (
                                <Grid item>
                                    <CVSButton
                                        label={handleLabel('selectCVS')}
                                        data={CVS}
                                        onSubmit={handleCVS}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    ))}
                </RadioGroup>
            </FormControl>
        </Grid>
    )
}

export default LogisticsContent 
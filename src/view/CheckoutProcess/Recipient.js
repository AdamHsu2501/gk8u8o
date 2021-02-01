import React, { useState, useCallback, useEffect } from 'react';
import { Grid } from '@material-ui/core/';
import countriesList from 'countries-list'

import Search from '../../Algolia/Search'
import { useFirebase, _user } from '../../Firebase'
import { useConfigure } from '../../hooks/useConfigure'
import { _address } from '../../variables/Values';
import TextField from '../../components/Field/TextField'
import SelectField from '../../components/Field/SelectField'
import { getSKU } from '../../utils/getSKU'
import { getDiscount } from '../../utils/getDiscount'
import { useOrder } from './index'

const countries = Object.keys(countriesList.countries).map(key => {
    var obj = countriesList.countries[key]
    return {
        value: key,
        label: `${obj.native} (${obj.name})`
    }
})

const ReceiverContent = () => {
    const { discounts, exchangeRates } = useFirebase()
    const { state, setState, adminMode, setDisabled } = useOrder()
    var { user, items, userRemark } = state
    const { handleLabel } = useFirebase()
    const { rankPerPage } = useConfigure()
    const [filters, setFilters] = useState("");

    const handleHit = hit => {
        setState(prev => ({
            ...prev,
            user: {
                currency: hit.currency,
                displayName: hit.displayName,
                email: hit.email,
                group: hit.group,
                id: hit.id,
                recipient: hit.recipient,
                remark: hit.remark,
                language: hit.language,
                points: hit.points,
            }
        }))
        setFilters(`NOT id:${hit.id}`)
    }

    const handleChange = useCallback((id, value, parentId) => {
        if (id === 'userRemark') {
            setState(prev => ({
                ...prev,
                userRemark: value,
            }))
        } else {
            var obj = {}

            if (id === 'country' && !!value) {
                if (value === 'TW') {
                    user.recipient.state = ''
                }
                var country = countriesList.countries[value]
                var currency = !exchangeRates[country.currency] ? 'USD' : country.currency
                var exchangeRate = exchangeRates[currency]
                if (currency !== user.currency) {
                    user.currency = currency

                    obj = getDiscount(items.map(item => {
                        var temp = getSKU(item, exchangeRate, currency, value, user.group)
                        return {
                            ...item,
                            currency: temp.currency,
                            listPrice: temp.listPrice,
                            price: temp.price,
                            declaredValue: temp.declaredValue,
                        }
                    }), discounts, value, exchangeRate, user.points)
                }
            }

            if (parentId) {
                user[parentId][id] = value
            } else {
                user[id] = value
            }

            setState(prev => ({
                ...prev,
                user: user,
                items: obj.items || prev.items
            }))
        }

    }, [exchangeRates, items, setState, user, discounts])

    var disabled = _address.some(item => {
        var { id, required } = item
        if (required) {
            if (id.includes('address')) {
                return user.recipient[id].length > 60 || !user.recipient[id]
            } else if (id === 'phone' && user.recipient.country === 'TW') {
                return !(user.recipient.phone.startsWith('09') && user.recipient.phone.length === 10)
            } else {
                return !user.recipient[id]
            }
        } else {
            if (id.includes('address')) {
                return user.recipient[id].length > 60
            } else {
                return false
            }
        }
    })

    useEffect(() => {
        setDisabled(disabled)
    }, [disabled, setDisabled])

    return (
        <Grid container spacing={2}>
            {adminMode && (
                <Grid item xs={12}>
                    <Search
                        indexName={_user}
                        configure={{
                            filters: filters,
                            hitsPerPage: rankPerPage
                        }}
                        onClick={handleHit}
                        noDriection
                    />
                </Grid>
            )}

            {_address.map((item, key) => {
                var { id, helper } = item;

                if (id === 'country') {
                    return (
                        <Grid item xs={12} sm={6} key={key}>
                            <SelectField
                                id={id}
                                required={item.required}
                                error={!user.recipient[id]}
                                parentId='recipient'
                                label={handleLabel(id)}
                                value={user.recipient[id]}
                                onChange={handleChange}
                                multiple={false}
                                options={countries}
                                getOptionLabel={opt => opt.label}
                                getValue={opt => opt.value}
                            />
                        </Grid>
                    )
                } else if (id === 'state' && user.recipient.country === 'TW') {
                    return null
                } else if (id === 'phone') {
                    return (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                id={id}
                                required={item.required}
                                error={user.recipient.country === 'TW' ?
                                    !(user.recipient[id].length === 10 && user.recipient[id].startsWith('09'))
                                    : user.recipient[id].length === 0
                                }
                                parentId='recipient'
                                label={handleLabel(id)}
                                value={user.recipient[id]}
                                helperText={!!helper && handleLabel(helper)}
                                onChange={handleChange}
                                type='tel'
                            />
                        </Grid>
                    )
                } else {
                    return (
                        <Grid item xs={12} sm={id.includes('address') ? 12 : 6} key={key}>
                            <TextField
                                id={id}
                                required={item.required}
                                error={(item.required && user.recipient[id].length) === 0 || (id.includes('address') && user.recipient[id].length > 60)}
                                parentId='recipient'
                                label={handleLabel(id)}
                                value={user.recipient[id]}
                                helperText={!!helper && handleLabel(helper)}
                                onChange={handleChange}
                            />
                        </Grid>
                    )
                }
            })}

            <Grid item xs={12}>
                <TextField
                    id='userRemark'
                    label={handleLabel('userRemark')}
                    value={userRemark}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    rowsMax={5}
                />
            </Grid>
        </Grid>
    )
}

export default ReceiverContent
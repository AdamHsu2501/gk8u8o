import React, { useEffect } from 'react';
import { Grid, Typography } from '@material-ui/core/';

import Search from '../../Algolia/Search'
import { useFirebase, _stock } from '../../Firebase'
import ProductTable from '../../components/Table/ProductTable'
import { getSKU } from '../../utils/getSKU'
import { getDiscount } from '../../utils/getDiscount'
import { getCurrency } from '../../utils/getCurrency'

import { useOrder } from './index'

const ProductContent = () => {
    const { discounts, exchangeRates, handleLabel } = useFirebase()
    const { adminMode, state, setState, setDisabled, setLoading } = useOrder()
    var { user } = state;

    var exchangeRate = exchangeRates[user.currency]

    useEffect(() => {
        setDisabled(false)
        setLoading(false)
    }, [setDisabled, setLoading])

    const handleHit = hit => {
        setState(prev => {
            const { items } = prev
            var index = items.findIndex(item => item.id === hit.id && !item.paymentDate)
            if (index === -1) {
                var item = getSKU(hit, exchangeRate, prev.user.currency, prev.user.recipient.country, prev.user.group)

                items.push({
                    ...item,
                    qty: 1,
                    selected: true,
                })
            } else {
                items[index].qty += 1

                if (!items[index].eventDis) {
                    items[index].rewards += items[index].rewardPoints
                }
            }
            var obj = getDiscount(items, discounts, prev.user.recipient.country, exchangeRate, prev.user.points)

            return {
                ...prev,
                user: {
                    ...prev.user,
                    points: obj.points,
                },
                items: obj.items,
            }
        })
    }

    const handleChange = (id, value, index) => {

        setState(prev => {
            var { items } = prev, deletePts = 0
            if (id === 'delete') {
                deletePts = items[index].points.cost
                items.splice(index, 1);
            } else if (id === 'pLock') {
                items[index].points.locked = value
            } else if (id === 'dLock') {
                items[index].discount.locked = value
            } else if (id === 'nDiscount') {
                items[index].nDiscount = value
            } else if (id === 'percent') {
                items[index].discount.percent = value
                items[index].discount.locked = true

            } else if (id === 'points') {
                items[index].points.enable = value
            } else {
                items[index][id] = value;

                if (id === 'qty') {
                    items[index].rewards = items[index].rewardPoints * value
                }
            }

            var obj = getDiscount(items, discounts, prev.user.recipient.country, exchangeRate, prev.user.points)
            return {
                ...prev,
                user: {
                    ...prev.user,
                    points: obj.points + deletePts,
                },
                items: obj.items,
            }

        })
    }

    return (
        <Grid container justify="space-between" spacing={6}>
            {adminMode && (
                <Grid item xs={12} >
                    <Search
                        indexName={_stock}
                        configure={{
                            hitsPerPage: 4,
                            filters: 'status:preOrder OR status:purchased OR status:comingSoon OR status:inStock'
                        }}
                        onClick={handleHit}
                        noDriection
                    />
                </Grid>
            )}


            <Grid item xs={12}>
                <ProductTable
                    mode={adminMode ? 'admin' : 'checkout'}
                    list={state.items}
                    onSubmit={handleChange}
                    currency={user.currency}
                    user={user}
                />
            </Grid>


            <Grid item>
                <Typography color="secondary">{`1${handleLabel('points')} = ${user.currency} ${exchangeRate}`}</Typography>
                <Typography variant="h6">
                    {`${handleLabel('remainingPoints')}: ${getCurrency(user.points)} ${handleLabel('points')}`}
                </Typography>
                <Typography>
                    {` (${user.currency} ${getCurrency(user.points * exchangeRates[user.currency])})`}
                </Typography>
            </Grid>
        </Grid>
    )
}

export default ProductContent
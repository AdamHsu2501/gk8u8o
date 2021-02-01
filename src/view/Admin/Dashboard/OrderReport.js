import React from 'react';
import { Link } from 'react-router-dom'
import Chart from "react-google-charts";
import { Grid, Typography, Paper, Divider, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Configure, InstantSearch, connectHits } from 'react-instantsearch-dom';
import countriesList from 'countries-list'

import * as ROUTES from '../../constants/routes'
import { _orderStatus } from '../../constants/Values'
import searchClient from '../../hooks/Algolia'
import { useFirebase, _order, handleCurrencyFormat } from '../../hooks/Firebase'



const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(1, 5),
    },
    paper: {
        padding: theme.spacing(2),
        backgroundColor: 'white'
    },
    title: {
        backgroundColor: theme.palette.warning.main,
        padding: theme.spacing(1),
        borderTopLeftRadius: theme.spacing(1),
        borderTopRightRadius: theme.spacing(1),
        fontWeight: 700
    },
}));


function weekCount(year, month_number) {
    // month_number is in the range 1..12
    var firstOfMonth = new Date(year, month_number, 1);
    var lastOfMonth = new Date(year, month_number + 1, 0);

    var used = firstOfMonth.getDay() + lastOfMonth.getDate();
    return Math.ceil(used / 7);
}

const getRow = (key, hits, s, e) => {
    var arr = hits.filter(i => i.create >= s.getTime() && i.create < e.getTime())
    var pending = arr.filter(i => i.status === _orderStatus[0] || i.status === _orderStatus[1])
    var shipped = arr.filter(i => i.status === _orderStatus[2] || i.status === _orderStatus[3])
    var canceled = arr.filter(i => i.status === _orderStatus[4] || i.status === _orderStatus[5])
    return [key, shipped.length, pending.length, canceled.length]
}

const useBars = (state, hits) => {
    const { handleLabel } = useFirebase()
    const { unit } = state
    var d = new Date(state.start), start, end, i, num,
        list = [
            [handleLabel(unit), handleLabel('shipped'), handleLabel('pending'), handleLabel('canceled')]
        ]



    if (unit === 'hour') {
        for (i = 0; i < 12; i++) {
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + (i * 2))
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + ((i + 1) * 2))
            var id = `${i * 2}-${(i + 1) * 2}`
            list.push(getRow(id, hits, start, end))
        }

    } else if (unit === 'day') {
        for (i = 0; i < 7; i++) {
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i + 1)
            list.push(getRow(handleLabel(i), hits, start, end))
        }
    } else if (unit === 'week') {
        num = weekCount(d.getFullYear(), d.getMonth())

        for (i = 0; i < num; i++) {
            var first = new Date(d.getFullYear(), d.getMonth())
            var last = new Date(d.getFullYear(), d.getMonth() + 1)
            var diff = first.getDate() + (7 * i) - first.getDay()

            start = new Date(first.setDate(diff))
            start = first.getTime() > start.getTime() ? first : start

            end = new Date(first.setDate(diff + 7))
            end = last.getTime() < end.getTime() ? last : end

            list.push(getRow(handleLabel(i + 1), hits, start, end))
        }

    } else {
        num = 12
        for (i = 0; i < num; i++) {
            start = new Date(d.getFullYear(), i)
            end = new Date(d.getFullYear(), i + 1)
            list.push(getRow(handleLabel(i + 1), hits, start, end))
        }
    }

    return list
}

const groupBy = (arr, target) => {
    return arr.reduce((a, c) => {
        if (target === 'locale') {
            (a[c.total.locale] = a[c.total.locale] || []).push(c)
        } else {
            (a[c[target]] = a[c[target]] || []).push(c)
        }
        return a
    }, {})
}

const Content = ({ title, list }) => {
    const classes = useStyles()

    var arr = list.map(item => [item, null]).flat().slice(0, -1)
    return (
        <Paper>
            <Typography align="center" gutterBottom className={classes.title}>{title}</Typography>

            <Grid container justify="space-around">
                {arr.map((item, key) => !item ? (
                    <Divider key={key} orientation="vertical" flexItem />
                ) : (
                        <Grid key={key}>
                            <Typography>{item.label}</Typography>
                            <Typography variant="h5" align="center">{item.value}</Typography>
                        </Grid>
                    ))}
            </Grid>
        </Paper>
    )
}

const CountryContent = ({ id, list }) => {
    const { handleLabel } = useFirebase()
    var label = id === 'others' ? handleLabel('others') : countriesList.countries[id].native

    var num = list.filter(item => item.status === _orderStatus[0] || item.status === _orderStatus[1]).length
    var arr = [
        { label: handleLabel('pending'), value: num },
        { label: handleLabel('orders'), value: list.length },
    ]

    return (
        <Content title={label} list={arr} />
    )
}

const Hits = connectHits(({ hits, state }) => {
    console.log('hits', hits)
    const classes = useStyles()
    const { auth, handleLabel, exchangeRates } = useFirebase()

    var currencies = Object.keys(exchangeRates)

    var pending = hits.filter(item => item.status === _orderStatus[0] || item.status === _orderStatus[1])
    var shipped = hits.filter(item => item.status === _orderStatus[2] || item.status === _orderStatus[3])
    var canceled = hits.filter(item => item.status === _orderStatus[4] || item.status === _orderStatus[5])

    var OrderList = [
        { label: handleLabel('pending'), value: pending.length },
        { label: handleLabel('shipped'), value: shipped.length },
        { label: handleLabel('canceled'), value: canceled.length },
        { label: handleLabel('orders'), value: hits.length },
    ]

    var currencyList = currencies.map(id => {
        var sum = hits
            .filter(item => item.total.currency === id && (item.status !== _orderStatus[4] || item.status !== _orderStatus[5]))
            .reduce((a, c) => a += c.total.totalAmount, 0)

        return {
            label: id,
            value: handleCurrencyFormat(sum)
        }
    })

    var bars = useBars(state, hits)

    var countryOrders = groupBy(hits, 'locale')

    var permission = auth.admin === 2 || auth.permission.ORDER.delete

    return (
        <Grid container spacing={2} >
            <Grid item container justify="space-between">
                <Typography color="textSecondary" variant="h6">{handleLabel('ORDER')}</Typography>
                <Button variant="contained" color="secondary" component={Link} to={ROUTES.ORDER} >{handleLabel('viewAll')}</Button>
            </Grid>

            { permission && (
                <Grid item xs={12} sm={6}>
                    <Content title={handleLabel('totalOrders')} list={OrderList} />
                </Grid>
            )}

            {permission && (
                <Grid item xs={12} sm={6}>
                    <Content title={handleLabel('totalAmount')} list={currencyList} />
                </Grid>
            )}

            {Object.keys(countryOrders).map(id => (
                <Grid item xs={6} sm={4} md={3} key={id}>
                    <CountryContent id={id} list={countryOrders[id]} />
                </Grid>
            ))}

            {permission && (
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <Chart
                            width='100%'
                            height={'300px'}
                            chartType="Bar"
                            data={bars}
                            options={{
                                chart: {
                                    title: handleLabel('orders'),
                                },
                            }}
                        />
                    </Paper>
                </Grid>
            )}

        </Grid>
    )
});




const OrderReport = ({ state }) => {

    var filters = `create >= ${state.start.getTime()} AND create < ${state.end.getTime()}` // !state.end ? `create >= ${state.start.getTime()}` :

    return (
        <InstantSearch
            searchClient={searchClient}
            indexName={_order}
        >
            <Configure
                filters={filters}
            />

            <Hits
                state={state}
            />

        </InstantSearch >
    );
}


export default OrderReport
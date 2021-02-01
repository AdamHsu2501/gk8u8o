import React from 'react';
import { Link } from 'react-router-dom'
import { Grid, Typography, Paper, Divider, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Configure, InstantSearch, connectHits } from 'react-instantsearch-dom';

import * as ROUTES from '../../constants/routes'
import { _msgStatus } from '../../constants/Values'
import searchClient from '../../hooks/Algolia'
import { useFirebase, _message } from '../../hooks/Firebase'

const useStyles = makeStyles(theme => ({
    title: {
        backgroundColor: theme.palette.warning.main,
        padding: theme.spacing(1),
        borderTopLeftRadius: theme.spacing(1),
        borderTopRightRadius: theme.spacing(1),
        fontWeight: 700
    },
}));


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

const LangContent = ({ id, list }) => {
    const { handleLabel } = useFirebase()

    var obj = groupBy(list, 'type')

    var arr = Object.keys(obj).map(id => {
        var label = handleLabel(id)
        return { label: label, value: obj[id].length }
    })

    return (
        <Content title={id} list={arr} />
    )
}

const Hits = connectHits(({ hits }) => {
    const { handleLabel } = useFirebase()
    var langMsg = groupBy(hits, 'language')

    return (
        <Grid container spacing={2} >
            <Grid item container justify="space-between">
                <Typography color="textSecondary" variant="h6">{`${handleLabel('MESSAGE')} (${handleLabel('pending')})`}</Typography>
                <Button variant="contained" color="secondary" component={Link} to={ROUTES.MESSAGE} >{handleLabel('viewAll')}</Button>
            </Grid>

            {Object.keys(langMsg).map(id => (
                <Grid item xs={6} sm={4} key={id}>
                    <LangContent id={id} list={langMsg[id]} />
                </Grid>
            ))}
        </Grid>
    )
});




const MsgReport = ({ state }) => {

    var filters = `update >= ${state.start.getTime()} AND update < ${state.end.getTime()} AND status: ${_msgStatus[0]} OR status: ${_msgStatus[1]} `

    return (
        <InstantSearch
            searchClient={searchClient}
            indexName={_message}
        >
            <Configure
                filters={filters}
            />

            <Hits />

        </InstantSearch >
    );
}


export default MsgReport
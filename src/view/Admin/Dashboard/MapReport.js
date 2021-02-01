import React from 'react'
import { VectorMap } from 'react-jvectormap'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Paper, Grid, Typography } from '@material-ui/core'
import { orange } from '@material-ui/core/colors'
import countriesList from 'countries-list'

import Firebase, { useFirebase, useFirestoreQuery } from '../../../Firebase'
import CountryTable from '../../../components/Table/CountryTable';

const useStyles = makeStyles(theme => ({
    padding: {
        padding: theme.spacing(2)
    }
}))
const MapReport = () => {
    const theme = useTheme();
    const classes = useStyles()
    const { handleLabel } = useFirebase()

    const record = useFirestoreQuery({ ref: Firebase.firestore().doc('system/record') })
    const { data, loading } = record

    if (loading) {
        return <div>loading...</div>
    }

    var sum = Object.values(data.user).reduce((a, c) => a += c, 0)

    var list = Object.keys(data.user).map(key => {
        const country = countriesList.countries[key]
        var value = data.user[key]
        return {
            id: key,
            flag: countriesList.getEmojiFlag(key),
            native: country.native,
            value: value,
            percent: `${(value / sum * 100).toFixed(2)}%`
        }
    }).sort((a, b) => b.value - a.value)
    return (
        <Paper className={classes.padding}>
            <Typography variant="h5" gutterBottom>{handleLabel('userPopulation')}</Typography>
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <CountryTable list={list} />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <div style={{ width: '100%', height: 280 }}>
                        <VectorMap
                            map='world_mill'
                            series={
                                {
                                    regions: [{
                                        values: data.user,
                                        scale: [orange[100], orange[900]],// ['#C8EEFF', '#0071A4'],
                                        normalizeFunction: 'polynomial'
                                    }]
                                }
                            }
                            onRegionTipShow={function (e, el, code) {
                                el.html(el.html() + ` (${data.user[code]} / ${(data.user[code] / sum * 100).toFixed(2)}%)`);
                            }}
                            backgroundColor={theme.palette.background.paper}
                            containerStyle={{
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </div>
                </Grid>

            </Grid>
        </Paper>
    )
}

export default MapReport
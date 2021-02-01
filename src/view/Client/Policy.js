import React from 'react'
import { useLocation } from 'react-router-dom'
import { Typography, Grid, Container } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

import Firebase, { useFirebase, useFirestoreQuery } from '../../Firebase'
import Loading from '../../components/Loading/Loading'
import ImageDialog from '../../components/Dialog/ImageDialog'

const useStyles = makeStyles(theme => ({
    margin: {
        margin: `${theme.spacing(4)}px 0px`
    },
    border: {
        borderBottom: `1px solid ${theme.palette.divider}`
    },
    text: {
        whiteSpace: 'pre-wrap'
    }
}))

const Content = ({ data }) => {
    const classes = useStyles()

    return (
        <Grid container >
            <Grid item xs={12}>
                <Typography variant="h5" gutterBottom className={classes.border}>{data.displayName}</Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography className={classes.text}>{data.text}</Typography>
            </Grid>
            {data.images.map((item, key) => (
                <ImageDialog key={key} src={item.preview} />
            ))}
        </Grid>
    )
}

const Policy = () => {
    const { pathname } = useLocation()
    const { handleLabel, langCode } = useFirebase()
    var type = pathname.slice(1)
    var policies = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/policy'),
        type: 'array',
        order: 'order'
    })

    var list = policies.loading ? [] : policies.data.filter(item => item.type === type && item.language === langCode)

    return (
        <Container fixed >
            <Loading open={policies.loading} />
            <Grid container spacing={4}>
                <Grid item container justify="center">
                    <Typography variant="h4" gutterBottom>{handleLabel(type)}</Typography>
                </Grid>

                {list.map((item, key) => (
                    <Grid key={key} item xs={12} >
                        <Content data={item} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    )
}

export default Policy
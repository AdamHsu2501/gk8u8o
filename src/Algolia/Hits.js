import React from 'react'
import { connectHits } from 'react-instantsearch-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Grid } from '@material-ui/core';

import { useFirebase, _message, _order, _ranking, _stock } from '../Firebase'
import ProductCard from '../components/Card/ProductCard'
import { CommentCard, MessageCard } from '../components/Card/MessageCard'
import OrderCard from '../components/Card/OrderCard'

const useStyles = makeStyles(theme => ({
    border: {
        borderBottom: `1px solid ${theme.palette.divider}`
    },

}));

const Hits = connectHits(({ hits, type }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()


    if (!hits.length) {
        return <Typography>{handleLabel('notFound')}</Typography>
    }

    return (
        <Grid container spacing={2} >
            {type === _stock && hits.map((hit, key) => (
                <Grid key={hit.objectID} item xs={6} sm={3} md={2}>
                    <ProductCard hit={hit} />
                </Grid>
            ))}

            {type === _ranking && hits.map((hit, key) => (
                <Grid key={hit.objectID} item xs={6} sm={3} md={2}>
                    <ProductCard hit={hit} id={key} ranking={true} />
                </Grid>
            ))}

            {type === 'comment' && hits.map((hit, key) => (
                <Grid key={hit.objectID} item xs={12} className={classes.border}>
                    <CommentCard hit={hit} />
                </Grid>
            ))}

            {type === _message && hits.map((hit, key) => (
                <Grid key={hit.objectID} item xs={12} className={classes.border}>
                    <MessageCard hit={hit} />
                </Grid>
            ))}

            {type === _order && hits.map((hit, key) => (
                <Grid key={hit.objectID} item xs={12} className={classes.border}>
                    <OrderCard hit={hit} />
                </Grid>
            ))}

        </Grid>
    )
});

export default Hits
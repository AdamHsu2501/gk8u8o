import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { Index, Configure, SearchBox } from 'react-instantsearch-dom'

import Hits from './Hits'

const useStyles = makeStyles(theme => ({
    bold: {
        fontWeight: 700,
        margin: `${theme.spacing(2)}px 0`
    },

}));

const IndexPanel = ({ indexName, searchBox, type, button, label, filters, hitsPerPage }) => {
    const classes = useStyles()

    return (
        <Index indexName={indexName} >
            <Typography variant="h5" className={classes.bold}>
                {label}
            </Typography>
            <Configure filters={filters} hitsPerPage={hitsPerPage} />
            {button}
            {searchBox && <SearchBox className={classes.margin} />}
            <Hits type={type || indexName} />

        </Index>
    )
}

export default IndexPanel
import React from 'react'
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';

import { useFirebase } from '../../Firebase';

const useStyles = makeStyles(theme => ({
    statusContent: {
        marginTop: theme.spacing(1),
        display: 'inline-block',
        float: 'left',
        fontSize: 16,
        border: '1px solid #e5e5e5',
        padding: ' 0 4px',
        borderLeftStyle: 'solid',
        borderLeftWidth: 3,
    },
    infoTag: {
        borderLeftColor: theme.palette.info.main,
    },
    successTag: {
        borderLeftColor: theme.palette.success.main,
    },
    warningTag: {
        borderLeftColor: theme.palette.warning.main,
    },
    errorTag: {
        borderLeftColor: theme.palette.error.main,
    },
}));

const StatusTag = ({ status }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()
    return (
        <Grid container>
            <Typography
                className={classNames(classes.statusContent, {
                    [classes.infoTag]: status === 'inStock',
                    [classes.successTag]: status === 'openingSoon',
                    [classes.warningTag]: status === 'preOrder' || status === 'purchased' || status === 'comingSoon',
                    [classes.errorTag]: status === 'outOfStock' || status === 'failed'
                })}
            >
                {handleLabel(status)}
            </Typography>
        </Grid >
    )
}

export default StatusTag
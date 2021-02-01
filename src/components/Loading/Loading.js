import React from 'react';
import { makeStyles } from '@material-ui/core/styles'
import { CircularProgress, Backdrop, Button, Grid, Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    backdrop: {
        zIndex: theme.zIndex.tooltip + 1,
        color: '#fff',
    },
}))

const Loading = ({ open, label, btnLabel, onClick }) => {
    const classes = useStyles();

    return (
        <Backdrop className={classes.backdrop} open={open}>
            {label ? (
                <Grid container direction="column" alignContent="center">
                    <Typography gutterBottom>{label}</Typography>

                    <Button onClick={onClick} color="secondary" variant="contained" >{btnLabel}</Button>
                </Grid>
            ) : <CircularProgress color="inherit" />}
        </Backdrop>
    )
}

export default Loading
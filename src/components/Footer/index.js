import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { APP_NAME, _footerImg } from '../../variables/Values'

const useStyles = makeStyles(theme => ({
    root: {
        marginTop: 'auto',
    },
    logo: {
        width: 150,
        height: 'auto'
    }
}));

const Footer = () => {
    const classes = useStyles();
    return (
        <Grid container direction="column" alignItems="center" className={classes.root}>
            <img src={_footerImg} alt='logo' className={classes.logo} />
            <Typography variant="body2" color="textSecondary">
                {APP_NAME} © {new Date().getFullYear()} All Rights Reserved
            </Typography>
        </Grid>
    );
}

export default Footer
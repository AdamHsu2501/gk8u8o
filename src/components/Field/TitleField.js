import React, { memo } from 'react';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    title: {
        color: theme.palette.warning.main
    },
}));

const TitleField = memo(({ label, helperText }) => {
    const classes = useStyles()

    return (
        <Grid container direction="column" alignItems="center">
            <Typography variant="h5" className={classes.title}>{label}</Typography>

            {helperText && (
                <Typography color="secondary" >{helperText}</Typography>
            )}
        </Grid>
    )
});

export default TitleField
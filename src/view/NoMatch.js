import React from 'react';
import { useLocation } from 'react-router-dom';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useFirebase } from '../Firebase'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(8)
  },
}));

const NoMatch = () => {
  const classes = useStyles();
  let { state } = useLocation();
  const { handleLabel } = useFirebase()
  var label = state || 404
  return (
    <Grid container direction="column" alignItems="center" className={classes.root}>
      <Typography variant="h2">{label}</Typography>
      <Typography color="textSecondary">{handleLabel(label)}</Typography>
    </Grid>
  );
}

export default NoMatch
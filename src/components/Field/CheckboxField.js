import React, { memo } from 'react';
import { Grid, Typography, Button, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useFirebase } from '../../Firebase';

const useStyles = makeStyles(theme => ({
    title: {
        color: theme.palette.warning.main
    },
}));


const CheckboxField = memo(({
    disabled, item, path, onChange, value, onCheck
}) => {
    const { handleLabel } = useFirebase()
    const classes = useStyles()

    return (
        <Grid item container >
            <Grid container justify="space-between" alignItems="center">
                <Typography variant="h6" className={classes.title}>{item.label}</Typography>
                <Button
                    disabled={disabled}
                    variant="outlined"
                    onClick={(e) => onCheck(path, true)}
                >
                    {handleLabel('all')}
                </Button>
            </Grid>

            <FormGroup row >
                {Object.keys(item.value).map((id, key) => (
                    <FormControlLabel
                        key={key}
                        label={handleLabel(id)}
                        control={
                            <Checkbox
                                disabled={disabled}
                                color='secondary'
                                checked={value[id]}
                                onChange={(e) => onChange(path.concat(id), e.target.checked)}
                                name={id}
                            />
                        }
                    />
                ))}
            </FormGroup>
        </Grid>
    )
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next))

export default CheckboxField
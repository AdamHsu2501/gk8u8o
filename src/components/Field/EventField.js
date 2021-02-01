import React from 'react';
import { Grid, Button, Tooltip, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Add, Close } from '@material-ui/icons';

import { useFirebase } from '../../Firebase';
import Field from './index'
import TitleField from './TitleField'

const useStyles = makeStyles(theme => ({
    title: {
        color: theme.palette.warning.main
    },
    border: {
        borderBottom: '1px red dashed',
        marginBottom: theme.spacing(2)
    },
    divider: {
        borderBottom: '1px white solid',
        marginBottom: theme.spacing(2)
    }
}));

const EventField = ({ disabled, item, value, onChange, onDelete, path }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()

    const handleAdd = () => {
        onChange(
            path.concat(value.length),
            item.list.reduce((a, c) => {
                return {
                    ...a,
                    [c.id]: c.value
                }
            }, {})
        )
    }

    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <TitleField label={item.label} helperText={item.helperText} />
            </Grid>

            {value.map((obj, key) => (
                <Grid key={key} item container className={classes.border} >
                    <Grid item xs={11} container spacing={1} >
                        {item.list.map((subItem, subKey) => {
                            return (
                                <Field
                                    key={subKey}
                                    disabled={disabled}
                                    item={subItem}
                                    value={obj[subItem.id]}
                                    onChange={onChange}
                                    path={path.concat(key)}
                                />
                            )
                        })}
                    </Grid>
                    <Grid item xs container justify="flex-end" alignContent="flex-start" >
                        {!disabled && (
                            <Tooltip title={handleLabel('deleteTooltip')} >
                                <IconButton onClick={() => onDelete(path, key)}>
                                    <Close color="secondary" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Grid>
                </Grid>
            ))}

            {!disabled && (
                <Grid item container className={classes.divider} >
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAdd}
                    >
                        {handleLabel('addTooltip')}
                    </Button>
                </Grid>
            )}
        </Grid >
    )
}

export default EventField
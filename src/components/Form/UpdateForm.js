import React, { useState, useCallback, useEffect } from 'react';
import { Container, Grid, Button, Typography } from '@material-ui/core';
import { Backup } from '@material-ui/icons';

import { useFirebase } from '../../Firebase';
import Dialog from '../Dialog/SlideDialog'
import Field from '../Field'


function toState(format, state) {
    var obj = {};
    format.forEach(item => {
        const { children, id } = item

        if (!!id) {
            var value = !!state && state[id] ? state[id] : item.value;

            if (!!children) {
                obj[id] = toState(children, value)
            } else {
                if (id === 'group') {
                    obj[id] = !value ? null : value.id
                } else {
                    obj[id] = value
                }
            }
        }

    })

    return obj
}

const deleteItem = (state, value) => {
    state.splice(value, 1)
    return state
}

const selectAll = (state, value) => {
    var json = JSON.stringify(state)
    var temp = json.includes('false') ? json.replace(/false/g, 'true') : json.replace(/true/g, 'false')
    return JSON.parse(temp)
}

const getValue = (state, value) => {
    return value
}

const recurse = (state, list, value, func) => {
    if (!list.length) {
        return func(state, value);
    }

    var id = list[0]
    state[id] = recurse(state[id], list.slice(1), value, func)
    return state;
}

const copyState = (state) => {
    var newState = JSON.parse(JSON.stringify(state))
    if (!!state.images) {
        newState.images = state.images
    }
    return newState
}

const Form = ({ open, title, format, onClose, onSubmit, oldState, disabled }) => {
    const { handleLabel } = useFirebase();
    const [state, setState] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setState(toState(format, oldState))
        setLoading(false)
    }, [open, format, oldState])

    const handleSubmit = () => {
        setLoading(true)
        onSubmit(state)
    }

    const handleInput = useCallback((path, value) => {
        setState(prev => recurse(copyState(prev), path, value, getValue))
    }, [])

    const handleCheck = useCallback((path, value) => {
        setState(prev => recurse(copyState(prev), path, value, selectAll))
    }, [])

    const handleDelete = useCallback((path, value) => {
        setState(prev => recurse(copyState(prev), path, value, deleteItem))
    }, [])

    return (
        <Dialog
            open={open}
            loading={loading}
            title={<Typography variant="h6">{title}</Typography>}
            onClose={onClose}
            actions={
                <Button disabled={disabled} color="primary" onClick={handleSubmit} variant="contained" startIcon={<Backup />}>
                    {handleLabel('submit')}
                </Button>
            }
        >
            <Container fixed>
                <Grid container spacing={1}>
                    {!!state && format.map((item, key) => (
                        <Field
                            key={key}
                            state={state}
                            disabled={disabled}
                            item={item}
                            value={state[item.id]}
                            onChange={handleInput}
                            onCheck={handleCheck}
                            onDelete={handleDelete}
                        />
                    ))}
                </Grid>
            </Container>
        </Dialog>
    )
}


export default Form
import React, { useEffect } from 'react';
import { Grid } from '@material-ui/core/';

import { _orderStatus } from '../../variables/Values'
import { useFirebase } from '../../Firebase'
import TextField from '../../components/Field/TextField'
import { useOrder } from './index'

const StatusContent = () => {
    const { oldState, state, setState, setDisabled } = useOrder()
    const { handleLabel } = useFirebase()

    var statusOptions = _orderStatus.filter(item => !oldState ? !(item === 'refunded' || item === 'canceled') : true).map(item => ({
        value: item, label: handleLabel(item)
    }))

    useEffect(() => {
        setDisabled(false)
    }, [setDisabled])

    const handleChange = (id, value, parentId) => {
        setState(prev => ({
            ...prev,
            [id]: value
        }))
    };

    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <TextField
                    id="status"
                    label={handleLabel('status')}
                    value={state.status}
                    onChange={handleChange}
                    options={statusOptions}
                />
            </Grid>


            <Grid item xs={12}>
                <TextField
                    id="remark"
                    label={handleLabel('remark')}
                    value={state.remark}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    rowsMax={5}
                />
            </Grid>

            <Grid item xs={12}>
                <TextField
                    id="adminRemark"
                    label={handleLabel('adminRemark')}
                    helperText={handleLabel('displayToUser')}
                    value={state.adminRemark}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    rowsMax={5}
                />
            </Grid>
        </Grid>
    )
}

export default StatusContent 
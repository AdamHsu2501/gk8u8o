import React, { useEffect } from 'react';
import { Button, Typography, Grid } from '@material-ui/core';

import { useFirebase } from '../../Firebase'
import { useOrder } from './index'

const CompleteContent = () => {
    const { state, setLoading, activeStep, handleStep } = useOrder()
    const { handleLabel } = useFirebase()

    useEffect(() => {
        setLoading(false)
    }, [setLoading])
    const handleChange = () => {
        setLoading(true)

        setTimeout(() => {
            handleStep(activeStep + 1)
        }, 3000)
    }
    return (
        <Grid container spacing={8}>
            <Grid item container justify="center">
                <Typography variant="h6" gutterBottom >{handleLabel('CompleteOrderTitle')}</Typography>
            </Grid>

            {state.payment.id === 'Transfer' && (
                <Grid item container justify="center">
                    <Typography>{`${handleLabel('remittanceAccount')} ${state.payment.remittanceAccount}`}</Typography>
                </Grid>
            )}

            <Grid item container justify="center">
                <Typography>{handleLabel('CompleteOrderContent')}</Typography>
            </Grid>

            <Grid item container justify="center">
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleChange}
                >
                    {handleLabel('myOrder')}
                </Button>
            </Grid>
        </Grid >
    )
}

export default CompleteContent 

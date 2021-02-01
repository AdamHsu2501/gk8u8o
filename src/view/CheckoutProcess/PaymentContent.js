import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles'
import { Typography, Grid, FormControl, RadioGroup, FormControlLabel, Radio } from '@material-ui/core';

import Firebase, { useFirebase } from '../../Firebase'
import { useOrder } from './index'

const useStyles = makeStyles(theme => ({
    margin: {
        marginBottom: theme.spacing(4)
    },
}))

const PaymentContent = () => {
    const classes = useStyles()
    const { state, setState, setLoading, setDisabled } = useOrder()
    var { payment, user } = state
    const { handleLabel } = useFirebase()
    const [options, setOptions] = useState([])

    const handleChange = event => {
        var value = event.target.value;
        var doc = options.find(item => item.id === value)

        setState(prev => ({
            ...prev,
            payment: doc,
            status: doc.collection ? 'pending' : 'processing'
        }))
    };

    useEffect(() => {
        setLoading(true)
        Firebase.firestore().doc('system/payment').get().then(sanp => {
            if (!sanp.exists) {
                throw Error
            }

            var payments = Object.values(sanp.data()).filter(item =>
                !!item.enable && item.currency.includes(user.currency)
            ).map(item => ({
                displayName: item.displayName,
                id: item.id,
                collection: item.collection,
                remittanceAccount: item.remittanceAccount
            }))

            setOptions(payments)
            setLoading(false)
        }).catch(() => {
            alert(handleLabel('errorSetPayment'))
        })
    }, [handleLabel, setLoading, user])

    var disabled = !options.find(item => item.id === payment.id)

    useEffect(() => {
        setDisabled(disabled)
    }, [disabled, setDisabled])


    return (
        <Grid container direction="column" alignContent="center">
            <FormControl className={classes.margin} >
                <RadioGroup value={payment.id} onChange={handleChange}>
                    {options.map((item, key) => (
                        <FormControlLabel
                            key={key}
                            value={item.id}
                            control={<Radio />}
                            label={<Typography>{handleLabel(item.displayName)}</Typography>}
                        />
                    ))}
                </RadioGroup>
            </FormControl>
        </Grid>
    )
}

export default PaymentContent
import React, { useState, useEffect, useRef } from 'react'

import { useFirebase } from '../../Firebase'
import Loading from '../Loading/Loading'

const PayPalButton = ({ state, onSubmit, checkStock }) => {
    const { handleLabel } = useFirebase()
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const paypalRef = useRef();

    useEffect(() => {
        checkStock().then(() => {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create(state);
                },
                onApprove: async (data, actions) => {
                    setLoading(true)
                    const result = await actions.order.capture();

                    var purchase_units = result.purchase_units
                    var unit = purchase_units.find(item => item.reference_id === state.purchase_units[0].reference_id)
                    var final = unit.payments.captures.find(item => item.final_capture)
                    var d = new Date(final.update_time)

                    onSubmit({
                        id: final.id,
                        date: d.getTime()
                    })
                },
                onError: err => {
                    setError(err);
                    console.error('err', err);
                },
            }).render(paypalRef.current);
        })
    }, [state, onSubmit, checkStock, handleLabel]);

    return (
        <div>
            <Loading open={loading} />
            {error && handleLabel('error')}
            <div ref={paypalRef} />
        </div>
    )
}

export default PayPalButton
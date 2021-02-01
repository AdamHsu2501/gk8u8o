import React, { createContext, useContext, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Stepper, Step, StepLabel, StepButton, Grid, Button } from '@material-ui/core';


import { _address, _orderStatus } from '../../variables/Values';
import Firebase, { useFirebase, _stock, _user } from '../../Firebase'
import Loading from '../../components/Loading/Loading'
import { getSKU } from '../../utils/getSKU'

import StatusContent from './StatusContent'
import Recipient from './Recipient'
import ProductContent from './ProductContent'
import PaymentContent from './PaymentContent'
import LogisticsContent from './LogisticsContent'
import ConfirmContent from './ConfirmContent'
import CompleteContent from './CompleteContent'

const useStyles = makeStyles(theme => ({
    root: {
        minHeight: '75vh',
        padding: theme.spacing(2)
    },
    margin: {
        marginBottom: theme.spacing(2)
    }
}))

const OrderContext = createContext();

export const useOrder = () => {
    return useContext(OrderContext);
};

const getUUID = () => {
    var d = Date.now();

    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    var id = 'xxxxxx4xxxyxxxxxxxxx' //bool ? 'xxxxxxxx4xxxyxxxxxxxxxxxxxxx' : 

    return id.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        var a = c === 'x' ? r : (r & 0x3) | 0x8
        return a.toString(16);
    });
}

const CheckoutProcess = ({ adminMode, items, oldState, goBack, onSubmit, handleShopCart }) => {
    const classes = useStyles();

    const { handleLabel, auth, exchangeRates, country } = useFirebase()
    const [init, setInit] = useState(true)
    const [state, setState] = useState(null)
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const [activeStep, setActiveStep] = useState(0)

    const steps = [
        { component: <Recipient />, id: 'recipient' },
        { component: <ProductContent />, id: 'viewProduct' },
        { component: <PaymentContent />, id: 'paymentMethod' },
        { component: <LogisticsContent />, id: 'logisticsMethod' },
        { component: <ConfirmContent />, id: 'confirmOrder' },
    ]

    if (adminMode) {
        steps.unshift(
            { component: <StatusContent />, id: 'status' }
        )
    } else {
        steps.push(
            { component: <CompleteContent />, id: 'complete' }
        )
    }

    const handleStep = (step) => {
        if (step < 0) {
            goBack()
        } else if (step >= steps.length) {
            onSubmit()
        } else {
            setActiveStep(step);
        }
    };

    useEffect(() => {
        if (!!oldState) {

            var promises = [
                Firebase.firestore().collection(_user).doc(oldState.user.id).get(),
            ]

            if (!!oldState.items.length) {
                var arr = oldState.items.map(item => {
                    return Firebase.firestore().collection(_stock).doc(item.id).get()
                })

                promises.push(
                    Promise.all(arr)
                )
            }

            var status = _orderStatus.slice(0, 4).includes(oldState.status)

            Promise.all(promises).then(results => {

                var list = results[1].map((doc, key) => {
                    var obj = oldState.items[key];

                    if (!doc.exists) {
                        return {
                            ...obj,
                            error: 'notExists'
                        }
                    }
                    var data = getSKU(
                        doc.data(),
                        exchangeRates[oldState.user.currency],
                        oldState.user.currency,
                        oldState.user.recipient.country,
                        oldState.user.group
                    )

                    var prevD = obj.deduction && status ? obj.qty : 0
                    return {
                        ...data,
                        ...obj,
                        code: data.code,
                        images: data.images,
                        declaredValue: data.declaredValue,
                        prevD: prevD,
                        prevS: status ? obj.qty : 0,
                        quantity: data.quantity + prevD,
                        selected: true,
                    }
                })

                setState({
                    ...oldState,
                    user: {
                        ...oldState.user,
                        points: results[0].exists ? results[0].data().points : oldState.user.points,
                    },
                    items: list,
                })

                setInit(false)
            })
        } else {
            if (init) {
                var id = getUUID()

                setState({
                    user: {
                        currency: adminMode ? "" : auth.currency,
                        displayName: adminMode ? "" : auth.displayName,
                        email: adminMode ? "" : auth.email,
                        group: adminMode ? {} : auth.group,
                        id: adminMode ? "" : auth.id,
                        recipient: adminMode ? _address.reduce((a, c) => ({ ...a, [c.id]: c.id === 'country' ? null : '' }), {})
                            : JSON.parse(JSON.stringify(auth.recipient)),
                        remark: adminMode ? {} : auth.remark,
                        language: adminMode ? null : auth.language,
                        points: adminMode ? 0 : auth.points,
                    },
                    items: items.map(i => {

                        var item = getSKU(
                            i,
                            exchangeRates[auth.currency],
                            auth.currency,
                            auth.recipient.country,
                            auth.group
                        )

                        return {
                            ...item,
                            qty: i.qty,
                        }
                    }) || [],
                    payment: {
                        id: null,
                    },
                    logistics: {
                        id: null,
                    },
                    CVS: null,
                    date: null,
                    id: id,
                    status: _orderStatus[0],
                    paymentId: id,
                    paymentDate: null,
                    logisticsId: [],
                    records: [],
                    remark: '',
                    adminRemark: '',
                    userRemark: '',
                })
            }
            setInit(false)
        }
    }, [init, oldState, items, adminMode, auth, exchangeRates, country])

    return (
        <OrderContext.Provider
            value={{
                oldState: oldState,
                state: state,
                setState: setState,
                setLoading: setLoading,
                adminMode: adminMode,
                setDisabled: setDisabled,
                activeStep: activeStep,
                handleStep: handleStep,
                handleShopCart: handleShopCart,
            }}
            className={classes.root}
        >
            <Loading open={loading} />

            <Grid item container justify="center" spacing={2} className={classes.margin}>
                <Stepper nonLinear={adminMode} activeStep={activeStep} alternativeLabel>
                    {steps.map((step, key) => (
                        <Step key={key}>
                            {adminMode && !!oldState ? (
                                <StepButton onClick={() => handleStep(key)} >
                                    {handleLabel(step.id)}
                                </StepButton>
                            ) : (
                                    <StepLabel>{handleLabel(step.id)}</StepLabel>
                                )}
                        </Step>
                    ))}
                </Stepper>
                {!init && (
                    <Grid item xs={12}>
                        {steps[activeStep].component}
                    </Grid>
                )}
            </Grid>

            {(steps[activeStep].id !== 'confirmOrder' && steps[activeStep].id !== 'complete') && (
                <Grid item container justify="space-between">
                    <Button
                        variant="outlined"
                        onClick={() => handleStep(activeStep - 1)}
                    >
                        {handleLabel('return')}
                    </Button>

                    <Button
                        disabled={disabled}
                        variant="contained"
                        color="primary"
                        onClick={() => handleStep(activeStep + 1)}
                    >
                        {handleLabel('next')}
                    </Button>
                </Grid>
            )}
        </OrderContext.Provider>
    );
}

export default CheckoutProcess
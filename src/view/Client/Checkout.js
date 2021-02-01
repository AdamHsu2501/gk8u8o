import React, { useEffect, useState } from 'react';
import { useHistory, Prompt, useLocation } from "react-router-dom";
import { Container } from '@material-ui/core';

import * as ROUTES from '../../routes';
import { useFirebase, useInfo } from '../../Firebase'
import CheckoutProcess from '../CheckoutProcess'

export default function Checkout() {
    let history = useHistory();
    const { state } = useLocation();
    const { handleLabel } = useFirebase()
    const { handleShopCart } = useInfo()
    const [alert, setAlert] = useState(true)

    useEffect(() => {
        const handleBeforeUnload = event => event.preventDefault();
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [])

    if (!state) {
        history.push(ROUTES.HOME)
    }

    const handleBack = () => {
        setAlert(false)
        history.goBack()
    }

    const handleSubmit = () => {
        setAlert(false)
        history.push(ROUTES.MYORDER)
    }

    return (
        <Container fixed>
            <Prompt
                when={alert}
                message={handleLabel('leavePageMsg')}
            />
            <CheckoutProcess
                adminMode={false}
                items={state}
                goBack={handleBack}
                onSubmit={handleSubmit}
                handleShopCart={handleShopCart}
            />
        </Container>
    );
}

import React from 'react';
import { Link, useHistory } from "react-router-dom";
import { Grid, Container, Typography, Button } from '@material-ui/core';
import { ArrowBack, ArrowForward } from '@material-ui/icons';

import * as ROUTES from '../../routes';
import { useFirebase, useInfo } from '../../Firebase';
import ProductTable from '../../components/Table/ProductTable'

const Cart = () => {
    const { auth, currency, handleLabel } = useFirebase();
    const { shopCart, handleShopCart, handleSelect } = useInfo()
    var history = useHistory()
    var { state } = history.location

    const handleChange = (id, value, index) => {
        var obj = shopCart.list[index]
        if (id === 'delete') {
            handleShopCart('delete', obj)
        } else {
            obj.qty = value
            handleShopCart('set', obj)
        }
    }

    const handleBack = () => {
        if (state === ROUTES.CHECKOUT || state === ROUTES.CART) {
            history.replace(ROUTES.HOME)
        } else {
            history.goBack()
        }
    }

    return (
        <Container fixed>
            <Grid container spacing={8}>
                <Grid item container justify="center">
                    <Typography variant="h4" gutterBottom>{handleLabel('cart')}</Typography>
                </Grid>

                {!!shopCart.list.length ? (
                    <Grid item xs={12}>
                        <ProductTable
                            mode='cart'
                            list={shopCart.list}
                            currency={currency}
                            onSubmit={handleChange}
                            select
                            user={auth}
                            onSelect={handleSelect}
                        />
                    </Grid>
                ) : (
                        <Grid item container justify="center" >
                            <Typography>{handleLabel('shopCartEmpty')}</Typography>
                        </Grid>
                    )}

                <Grid item container justify="space-between">
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBack}
                    >
                        <Typography>{handleLabel('return')}</Typography>
                    </Button>

                    <Button
                        disabled={
                            shopCart.list.filter(item => item.selected).length === 0
                            || shopCart.list.filter(item => item.selected).some(item => !!item.error)
                        }
                        variant="contained"
                        color="secondary"
                        endIcon={<ArrowForward />}
                        component={Link}
                        to={{
                            pathname: ROUTES.CHECKOUT,
                            state: shopCart.list.filter(item => item.selected)
                        }}
                    >
                        <Typography>{handleLabel('checkout')}</Typography>
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Cart;
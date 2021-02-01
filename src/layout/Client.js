import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Toolbar } from '@material-ui/core'

import * as ROUTES from '../routes'
import { useFirebase, useInfo } from '../Firebase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NoMatch from '../view/NoMatch'

const useStyles = makeStyles(theme => ({
    root: {
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    content: {
        padding: theme.spacing(1)
    }
}));

const AuthRoute = ({ ...rest }) => {
    const { auth } = useFirebase();
    return (
        <Route
            exact={rest.exact}
            path={rest.path}
            render={(props) => (
                rest.permission && !auth ? <Redirect to="/login" /> : <rest.component {...props} />
            )}
        />
    )

}

const Client = () => {
    const classes = useStyles();
    const { shopCart } = useInfo()

    return (
        <div className={classes.root}>
            <Header isAdmin={false} shopCart={shopCart} />
            <Toolbar />
            <div className={classes.content}>
                <Switch>
                    {ROUTES.clientRoutes.map((item, key) => (
                        <AuthRoute key={key} {...item} />
                    ))}

                    <Route path="*" component={NoMatch} />
                </Switch>
            </div>
            <Footer />
        </div>
    )
}

export default Client
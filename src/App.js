import React, { useEffect, lazy, Suspense } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

import * as ROUTES from './routes';
import { useFirebase, ProvideInfo } from './Firebase'
// import Admin from './layout/Admin'
// import Client from './layout/Client'
// import Login from './layout/Login'

const Admin = lazy(() => import('./layout/Admin'));
const Client = lazy(() => import('./layout/Client'));
const Login = lazy(() => import('./layout/Login'));


const App = (props) => {
    const { auth, country, currency, exchangeRate, discounts } = useFirebase()

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [props.location])

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Switch>
                <Route path={ROUTES.ADMIN} component={Admin} />
                <Route path={ROUTES.LOGIN} component={Login} />
                <Route path={ROUTES.HOME}>
                    <ProvideInfo auth={auth} country={country} currency={currency} exchangeRate={exchangeRate} discounts={discounts}>
                        <Client />
                    </ProvideInfo>
                </Route>
            </Switch>
        </Suspense>
    )
}

export default withRouter(App);
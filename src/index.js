import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import * as ROUTES from './routes'
import { ProvideFirebase } from './Firebase'
import { ProvideTheme } from './hooks/useTheme'
import App from './App'
import Listener from './layout/Listener'
import Print from './layout/Print'


ReactDOM.render(
    <Router>
        <Switch>
            <Route path={ROUTES.LISTENER} component={Listener} />
            <Route path={ROUTES.PRINT} component={Print} />
            <Route path={ROUTES.HOME}>
                <ProvideTheme>
                    <ProvideFirebase>
                        <App />
                    </ProvideFirebase>
                </ProvideTheme>
            </Route>
        </Switch>
    </Router>,
    document.getElementById('root')
);
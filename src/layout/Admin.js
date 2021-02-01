import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Toolbar } from '@material-ui/core'
import { useSnackbar } from 'notistack';

import * as ROUTES from '../routes'
import { useFirebase } from '../Firebase'
import Header from '../components/Header'
import Body from '../components/Body'
import Footer from '../components/Footer'
import Catalog from '../components/Menu/Catalog'
import Log from '../view/Log'
import NoMatch from '../view/NoMatch'

const useStyles = makeStyles(theme => ({
    root: {
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
    },
    padding: {
        padding: theme.spacing(2)
    },
}));

const initAction = {
    data: null,
    type: null,
    title: null,
}

const getRoutes = (routes, auth) => {
    const { admin, permission } = auth

    return routes.map((route, key) => {
        if (route.children) {
            return getRoutes(route.children, auth);
        }

        var pass = admin === 2 || (admin === 1 && !!permission[route.id] && permission[route.id].read)

        if (pass) {
            return (
                <Route
                    key={key}
                    // exact
                    path={route.path}
                    render={props => (
                        <route.component {...props} path={route.id} />
                    )}
                />
            )
        }

        return <Redirect to={{
            pathname: ROUTES.NOMATCH,
            state: 401
        }} />
    });
};


const AdminContent = createContext();

export const useAdmin = () => {
    return useContext(AdminContent);
}

const Admin = () => {
    const classes = useStyles();
    const { auth } = useFirebase();
    const { key } = useLocation()

    const { enqueueSnackbar } = useSnackbar();
    const [action, setAction] = useState(initAction);

    useEffect(() => {
        setAction(initAction)
    }, [key])

    const handleAction = useCallback((data, type, titel) => {
        setAction({
            data: data,
            type: type,
            title: titel,
        })
    }, [])

    const handleClose = useCallback(() => {
        setAction(initAction)
    }, [])

    const handleSnackbar = (bool, label) => {
        if (bool) {
            handleClose()
        }

        setTimeout(() => {
            enqueueSnackbar(label, {
                variant: bool ? 'success' : 'error'
            });
        }, 500)
    }

    if (!auth || auth.admin < 1) {
        return <Redirect to={{
            pathname: ROUTES.NOMATCH,
            state: 401
        }} />
    }

    return (
        <AdminContent.Provider value={{
            action: action,
            handleAction: handleAction,
            setAction: setAction,
            handleClose: handleClose,
            handleSnackbar: handleSnackbar,
        }}>
            <div className={classes.root}>

                <Header isAdmin={true} />
                <Toolbar />
                <Body
                    left={<Catalog list={ROUTES.adminRoutes} />}
                >
                    <div className={classes.padding}>
                        <Switch>
                            {getRoutes(ROUTES.adminRoutes, auth)}
                            <Route path="*" component={NoMatch} />
                        </Switch>
                    </div>

                </Body>
                <Footer />

                <Log
                    open={action.type === 'log'}
                    id={action.type === 'log' ? action.data : null}
                    onClose={handleClose}
                />
            </div>
        </AdminContent.Provider>
    )
}

export default Admin
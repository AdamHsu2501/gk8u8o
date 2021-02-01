import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@material-ui/core';
import { ExitToApp } from '@material-ui/icons';

import * as ROUTES from '../../routes';
import { useFirebase } from '../../Firebase';

const useStyles = makeStyles(theme => ({
    right: {
        textAlign: 'right'
    }
}));

const Auth = ({ isAdmin, onSubmit }) => {
    const classes = useStyles();
    const { auth, signOut, handleLabel } = useFirebase();

    const handleSignOut = () => {
        signOut()
        onSubmit()
    }

    return (
        <List>
            {auth.admin > 0 && (
                <ListItem button component={Link} to={isAdmin ? ROUTES.HOME : ROUTES.DASHBOARD}>
                    <ListItemIcon>
                        <ExitToApp />
                    </ListItemIcon>
                    <ListItemText primary={handleLabel(isAdmin ? 'frontend' : 'backend')} />
                </ListItem>
            )}

            <Divider />
            {!isAdmin && (
                <List>
                    <ListItem className={classes.right}>
                        <ListItemText primary={`${auth.points} ${handleLabel('points')}`} />
                    </ListItem>
                    <Divider />

                    {ROUTES.clientRoutes.filter(item => item.state === 'auth').map((item, key) => (
                        <ListItem
                            key={key}
                            button
                            component={Link}
                            to={item.path}
                            onClick={onSubmit}
                        >
                            <ListItemText primary={handleLabel(item.id)} />
                        </ListItem>
                    ))}
                    <Divider />
                </List>
            )}

            <ListItem component={Link} to={ROUTES.LOGIN} button onClick={handleSignOut}>
                <ListItemText primary={handleLabel('signOut')} />
            </ListItem>
        </List>
    )
}

export default Auth
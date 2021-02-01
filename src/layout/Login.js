import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

import * as ROUTES from '../routes'
import { _loginImg, _footerImg, _address } from '../variables/Values'
import Firebase, { useFirebase, _user } from '../Firebase';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${_loginImg})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        [theme.breakpoints.down('xs')]: {
            backgroundSize: 'auto 100%',
        }
    },
    paper: {
        background: 'rgba(0,0,0,0.5)',
        boxShadow: '0 0 3px 3px rgba(0,150,200,1)',
        padding: theme.spacing(2)
    },
    footer: {
        width: '70%'
    },

}));

const CreateUser = (user, langCode, country, currency, exchangeRates) => {
    var d = Date.now();
    var recipient = _address.reduce((a, c) => {
        a[c.id] = c.id === 'country' ? null : ''
        return a
    }, {})

    return {
        admin: 0,
        create: d,
        last: d,
        id: user.uid,
        displayName: user.displayName,
        email: user.email,
        phone: user.phoneNumber,
        photoURL: user.photoURL,
        country: country,
        currency: currency,
        language: langCode,
        recipient: recipient,
        remark: '',
        permission: null,
        group: null,
        news: true,
        messages: [],
        points: 0,
        amount: Object.keys(exchangeRates).reduce((a, c) => {
            a[c] = 0
            return a
        }, {})
    }
}

const Login = () => {
    const classes = useStyles()
    const history = useHistory();
    let location = useLocation();
    const { auth, langCode, country, currency, exchangeRates } = useFirebase();

    let { from } = location.state || { from: { pathname: ROUTES.HOME } };

    if (auth) {
        history.push(from)
    }

    const uiConfig = {
        signInFlow: 'popup',
        signInOptions: [
            Firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            Firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            Firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            Firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ],
        tosUrl: `${window.location.origin}${ROUTES.TERMS}`,
        privacyPolicyUrl: function () {
            window.location.assign(`${window.location.origin}${ROUTES.PRIVACY}`);
        },
        callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
                var { additionalUserInfo, user } = authResult
                var d = Date.now();

                var obj = additionalUserInfo.isNewUser ? CreateUser(user, langCode, country, currency, exchangeRates) : {
                    last: d,
                    photoURL: user.photoURL || "",
                    displayName: user.displayName,
                }

                var batch = Firebase.firestore().batch()
                batch.set(Firebase.firestore().collection(_user).doc(user.uid), obj, { merge: true })

                if (additionalUserInfo.isNewUser) {
                    batch.update(Firebase.firestore().collection('system').doc('record'), {
                        [`user.${obj.country}`]: Firebase.firestore.FieldValue.increment(1)
                    })
                }

                batch.commit().then(() => {
                    return history.push(from)
                })

                return false
            },

            // uiShown: function () {
            //     // The widget is rendered.
            //     // Hide the loader.
            //     document.getElementById('loader').style.display = 'none';
            // }
        },
        // signInSuccessUrl: from,
    };

    return (
        <Grid container className={classes.root}>
            <Paper className={classes.paper}>
                <Grid container justify="center">
                    <img src={_footerImg} alt="logo" className={classes.footer} />
                </Grid>

                <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={Firebase.auth()} />
            </Paper>
        </Grid>
    );
}

export default Login
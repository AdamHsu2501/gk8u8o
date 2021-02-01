import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'inline-flex',
        width: '100%'
    },
    nav: {
        width: '20%',
        maxWidth: 220,
        flexShrink: 0,
        padding: theme.spacing(1),
        [theme.breakpoints.down('sm')]: {
            display: 'none'
        }
    },
    main: {
        flexGrow: 1,
        flexShrink: 1,
        padding: `${theme.spacing(1)}px ${theme.spacing(3)}px`,
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1),
        }
    },
}))

const Body = ({ left, right, children }) => {
    const classes = useStyles()
    return (
        <div className={classes.root} >
            {!!left && (
                <nav className={classes.nav}>
                    {left}
                </nav>
            )}

            <div className={classes.main}>
                {children}
            </div>

            {!!right && (
                <nav className={classes.nav}>
                    {right}
                </nav>
            )}
        </div>
    )
}

export default Body
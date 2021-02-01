import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Drawer, Toolbar, useMediaQuery } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    toolbar: {
        minHeight: 128,
    },
    root: {
        maxWidth: 220,
        width: '100%'
    },
    hidden: {
        width: 0
    },
    mobilePaper: {
        width: 320,
    },
}));

function useWidth() {
    const theme = useTheme();
    const keys = [...theme.breakpoints.keys].reverse();
    return (
        keys.reduce((output, key) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const matches = useMediaQuery(theme.breakpoints.up(key));
            return !output && matches ? key : output;
        }, null) || 'xs'
    );
}

const SideDrawer = ({ children, anchor, variant, open, onClose }) => {
    const classes = useStyles();
    const width = useWidth();

    var mobilMode = width === 'xs';

    if (!mobilMode && variant === 'permanent') {
        return (
            <div className={mobilMode ? classes.hidden : classes.root}>
                {children}
            </div>
        )
    }

    return (
        <Drawer
            variant={mobilMode ? 'temporary' : variant}
            open={open}
            anchor={anchor}
            onClose={onClose}
            ModalProps={{
                keepMounted: true, // Better open performance on paper.
            }}
            classes={{
                paper: mobilMode ? classes.mobilePaper : classes.root,
            }}
            className={mobilMode ? classes.hidden : classes.root}
        >
            {!mobilMode && variant === 'permanent' && (
                <Toolbar className={classes.toolbar} />
            )}

            {children}
        </Drawer>
    )
}

export default SideDrawer
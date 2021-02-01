import React from 'react'
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import {
    Grid, IconButton, Slide,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import Loading from '../Loading/Loading'

const useStyles = makeStyles(theme => ({
    content: {
        minHeight: '70%'
    },
}))

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SlideDialog = ({ open, loading, title, content, onClose, actions, children }) => {
    const classes = useStyles()

    return (
        <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition} scroll='paper'>
            <Loading open={!!loading} />
            <DialogTitle>
                <Grid container justify="space-between" alignItems="center">
                    {title}

                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <Close />
                    </IconButton>
                </Grid>
            </DialogTitle>

            {(!!content || !!children) && (
                <DialogContent dividers className={classNames(!!content && classes.content)} >
                    {content}
                    {children}
                </DialogContent>
            )}

            <DialogActions>
                {actions}
            </DialogActions>
        </Dialog >
    )
}

export default SlideDialog
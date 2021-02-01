import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles'
import { Dialog } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    icon: {
        width: 120,
        cursor: 'pointer'
    },
    img: {
        width: '100%',
        cursor: 'pointer'
    },
}))


const ImageDialog = ({ src }) => {
    const classes = useStyles()
    const [open, setOpen] = useState(false)


    return (
        <div>
            <img onClick={() => setOpen(true)} src={src} alt="avatar" className={classes.icon} />
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
            >
                <img src={src} alt="avatar" className={classes.img} />
            </Dialog>
        </div>
    )
}


export default ImageDialog
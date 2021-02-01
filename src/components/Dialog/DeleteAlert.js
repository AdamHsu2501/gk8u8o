import React from 'react'
import { Grid, Button, Typography } from '@material-ui/core';

import { useFirebase } from '../../Firebase'
import Dialog from './SlideDialog'

const DeleteAlert = ({ open, title, onSubmit, onClose }) => {
    const { handleLabel } = useFirebase()

    const handleSubmit = () => {
        onSubmit()
    }

    return (
        <Dialog
            open={open}
            title={<Typography variant='h6'>{title}</Typography>}
            onClose={onClose}
            actions={(
                <Grid item container justify="space-between">
                    <Button variant="contained" color="secondary" onClick={handleSubmit}>
                        {handleLabel('confirm')}
                    </Button>
                    <Button variant="outlined" onClick={onClose}>
                        {handleLabel('cancel')}
                    </Button>
                </Grid>
            )}
        >
            {handleLabel('deleteArrayText')}
        </Dialog>
    )
}

export default DeleteAlert
import React, { useState } from 'react';
import { Grid, Button } from '@material-ui/core'

import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, _message } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'
import MessageForm from '../../components/Form/MessageForm'



const Comment = ({ location }) => {
    const { handleLabel } = useFirebase()
    const { commentFilters, commentPerPage, refresh, setRefresh } = useConfigure()
    const [open, setOpen] = useState(false)

    const handleClose = () => {
        setOpen(false)
        setRefresh(true)

        setTimeout(() => {
            setRefresh(true)
        }, 2000)
    }

    return (
        <Algolia indexName={_message} refresh={refresh} pagination={true}>

            <IndexPanel
                indexName={_message}
                type='comment'
                label={handleLabel('comment')}
                filters={commentFilters}
                hitsPerPage={commentPerPage}
                searchBox={true}
                button={(
                    <Grid container justify="flex-end">
                        <Button
                            variant="contained"
                            onClick={() => setOpen(true)}
                            color="secondary"
                        >
                            {handleLabel('leaveAMessage')}
                        </Button>
                    </Grid>
                )}
            />

            <MessageForm
                open={open}
                isAdmin={false}
                onClose={handleClose}
            />
        </Algolia>
    );
}

export default Comment


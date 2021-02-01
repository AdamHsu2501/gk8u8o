import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Button } from '@material-ui/core'
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import { useFirebase } from '../../Firebase'

const ReturnButton = () => {
    const { pathname } = useLocation()
    const history = useHistory()
    const { handleLabel } = useFirebase()

    const handleClick = () => {
        var path = pathname.split('/').slice(0, -1).join('/')
        history.push(path)
    }
    return (
        <Button startIcon={<ArrowBackIcon />} onClick={handleClick}>
            {handleLabel('return')}
        </Button>
    )
}

export default ReturnButton
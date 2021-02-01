import { useState } from 'react'

export const useDrawer = () => {
    const [state, setState] = useState({
        open: null,
        anchor: 'left',
    })
    const handleOpen = (id, anchor) => {
        setState({
            open: id,
            anchor: anchor
        })
    }
    const handleClose = () => setState(prev => ({
        ...prev,
        open: null,
    }))

    return {
        open: state.open,
        anchor: state.anchor,
        handleOpen: handleOpen,
        handleClose: handleClose
    }
};
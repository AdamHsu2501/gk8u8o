import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography } from '@material-ui/core';

import { useFirebase } from '../../Firebase'
import Loading from '../Loading/Loading'

const CVSButton = ({ label, data, onSubmit }) => {
    const { handleLabel } = useFirebase()
    const [open, setOpen] = useState(false)
    const [CVS, setCVS] = useState(data)

    useEffect(() => {
        setOpen(false)
        onSubmit(CVS)
    }, [CVS, onSubmit])

    useEventListener('storage', () => {
        var value = window.localStorage.getItem('CVS')
        var newCVS = JSON.parse(value)
        setCVS(newCVS)
    })

    var mapWindow = useRef(null)

    const handleClick = () => {
        mapWindow.current = window.open('', 'map', 'width=1024,height=680')

        var popupTick = setInterval(() => {
            if (mapWindow.current.closed) {
                clearInterval(popupTick);
                handleClose()
            }
        }, 500);

        setOpen(true)
    }

    const handleClose = () => {
        mapWindow.current.close()
        setOpen(false)
    }

    return (
        <div>
            <Loading
                open={open}
                label={handleLabel('selectCVS')}
                btnLabel={handleLabel('close')}
                onClick={handleClose}
            />

            <form action="https://us-central1-gk8u8ogkm.cloudfunctions.net/ecpay" method="POST" target="map" >
                <input type="hidden" name="action" value="map" />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={handleClick}
                >
                    {label}
                </Button>
            </form>

            {(CVS && !open) && (
                <Typography>{`${CVS.storeName} - ${CVS.address}`}</Typography>
            )}
        </div>
    )
}

export default CVSButton


function useEventListener(eventName, handler, element = window) {
    // Create a ref that stores handler
    const savedHandler = useRef();

    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        // Make sure element supports addEventListener
        // On 
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;

        // Create event listener that calls handler function stored in ref
        const eventListener = event => savedHandler.current(event);

        // Add event listener
        element.addEventListener(eventName, eventListener);

        // Remove event listener on cleanup
        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]) // Re-run if eventName or element changes
};
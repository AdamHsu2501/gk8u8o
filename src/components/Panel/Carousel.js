import React, { useState } from 'react'
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles'
import { Dialog } from '@material-ui/core';
import Slider from 'infinite-react-carousel';

import { _noImage } from '../../variables/Values'

const useStyles = makeStyles(theme => ({
    content: {
        position: 'relative',
        content: "",
        display: 'block',
        paddingBottom: '100%',
    },
    img: {
        position: 'absolute',
        width: '100%',
        height: ' 100%',
        objectFit: 'contain',
        cursor: 'pointer'
    },
    outFrame: {
        border: `6px solid ${theme.palette.warning.main}`,
    },
}))

const Carousel = ({ list, border }) => {
    const classes = useStyles()
    const [imgUrl, setImgUrl] = useState(null)
    const [open, setOpen] = useState(false)

    const handleImg = (e) => {
        setImgUrl(e.target.src)
        setOpen(true)
    }

    return (
        <div>
            <Slider
                dots
                initialSlide={1}
            >
                {!list.length ? (
                    <div className={classes.content}>
                        <img
                            src={_noImage}
                            alt='_noImage'
                            className={
                                classNames(classes.img, border && classes.outFrame)
                            }
                        />
                    </div>
                ) : list.map((item, key) => (
                    <div key={key} className={classes.content}>
                        <img
                            src={item.preview}
                            alt={item.name}
                            onClick={handleImg}
                            onError={(e) => e.target.src = _noImage}
                            className={
                                classNames(classes.img, border && classes.outFrame)
                            }
                        />
                    </div>
                ))}
            </Slider>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
            >
                <img src={imgUrl} alt="avatar" style={{ width: "100%" }} />
            </Dialog>
        </div>
    )
}

export default Carousel
import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Fade } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
const useStyles = makeStyles(theme => ({
    img: {
        width: '100%',
        height: 'auto',
        opacity: 1,
        '&:hover': {
            opacity: 0.6,
        }
    },
}));

const ImgCard = ({ src, alt, path }) => {
    const classes = useStyles()
    const [loaded, setLoaded] = useState(false)

    return (
        <div>
            {!loaded && (
                <Skeleton />
            )}
            <Fade in={loaded}>
                <Link to={path}>
                    <img
                        onLoad={() => setLoaded(true)}
                        src={src}
                        alt={alt}
                        className={classes.img}
                    />
                </Link>
            </Fade>
        </div>

    )
}

export default ImgCard
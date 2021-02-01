import React, { useState } from 'react'
import { Link } from "react-router-dom";
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import { Badge, Grid, Typography, Fade } from '@material-ui/core';
import { amber, deepOrange, grey, cyan } from '@material-ui/core/colors';
import { LooksOne, LooksTwo, Looks3, Looks4, Looks5 } from '@material-ui/icons';

import * as ROUTES from '../../routes';
import { _noImage } from '../../variables/Values'
import { useFirebase } from '../../Firebase';
import StatusTag from '../Tag/StatusTag'
import { getCurrency } from '../../utils/getCurrency'
import { getSKU } from '../../utils/getSKU'

const useStyles = makeStyles(theme => ({
    root: {
        wordBreak: 'break-all',
        opacity: 1,
        '&:hover': {
            opacity: 0.6,
        },
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.text.primary,
    },
    img: {
        display: 'block',
        width: '100%',
        height: 'auto',
        borderRadius: theme.spacing(1)
    },
    price: {
        color: theme.palette.warning.main,
        fontWeight: 700,
    },
    outFrame: {
        border: `5px solid ${theme.palette.warning.main}`,
        backgroundColor: theme.palette.warning.main
    },
    one: {
        color: amber[500]
    },
    two: {
        color: grey[600]
    },
    three: {
        color: deepOrange[900]
    },
    other: {
        color: cyan[700]
    },
}));


const ProductCard = ({ hit, id, ranking }) => {
    const classes = useStyles();
    const { auth, exchangeRate, currency, country, handleLabel } = useFirebase()

    const [loaded, setLoaded] = useState(false)
    const group = !!auth ? auth.group : null
    const data = getSKU(hit, exchangeRate, currency, country, group)
    const { status } = data

    if (!data) {
        return null
    }

    var badgeContent
    if (status === 'preOrder' || status === 'purchased') {
        if (data.sales >= data.MOQ) {
            badgeContent = (<div>{handleLabel('achieved')}</div>)
        } else {
            badgeContent = data.sales
        }
    }

    var rank
    switch (id) {
        case 0:
            rank = <LooksOne fontSize="large" className={classes.one} />
            break;
        case 1:
            rank = <LooksTwo fontSize="large" className={classes.two} />
            break;
        case 2:
            rank = <Looks3 fontSize="large" className={classes.three} />
            break;
        case 3:
            rank = <Looks4 fontSize="large" className={classes.other} />
            break;
        default:
            rank = <Looks5 fontSize="large" className={classes.other} />
    }

    return (
        <Grid container className={classes.root}>
            {ranking && rank}
            <Fade in={loaded}>
                <Link
                    to={{
                        pathname: `${ROUTES.LIST}/${data.id}`,
                        // search: search,
                        state: data
                    }}
                    className={classes.link}
                >
                    <Badge
                        badgeContent={badgeContent}
                        color="primary"
                    >
                        <img
                            onLoad={() => setLoaded(true)}
                            src={data.images.length ? data.images[0].preview : _noImage}
                            alt={data.id}
                            className={
                                classNames(classes.img, data.nDiscount && classes.outFrame)
                            }
                        />
                    </Badge>

                    <StatusTag status={data.status} />

                    <Typography variant="caption" color="textSecondary" >{data.code}</Typography>

                    <Typography color="textPrimary">{handleLabel(data.displayName)}</Typography>

                    <Typography className={classes.price}>
                        {`${currency} ${getCurrency(data.price)}`}
                    </Typography>

                    {!!data.percent && (
                        <Typography variant="caption" className={classes.price}>
                            {`${handleLabel('save')} ${data.percent}%`}
                        </Typography>
                    )}
                </Link>
            </Fade>
        </Grid>
    )
}

export default ProductCard
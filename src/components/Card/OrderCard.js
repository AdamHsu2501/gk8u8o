import React from 'react';
import classNames from 'classnames'
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import {
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Badge, Chip, Typography
} from '@material-ui/core';

import * as ROUTES from '../../routes'
import { _orderStatus, _noImage } from '../../variables/Values'
import { useFirebase } from '../../Firebase';

const useStyles = makeStyles(theme => ({
    root: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        opacity: 1,
        '&:hover': {
            opacity: 0.5,
        },
    },
    img: {
        width: 80
    },
    error: {
        filter: 'grayscale(100%)'
    },
    link: {
        textDecoration: 'none',
    },
}));

const OrderCard = ({ hit }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()

    var d = new Date(hit.date)

    var color, index = _orderStatus.findIndex(id => id === hit.status);
    if (index === 0) {
        color = "secondary"
    } else if (index >= 1 && index <= 3) {
        color = "primary"
    } else {
        color = "default"
    }

    return (
        <Link
            to={{
                pathname: `${ROUTES.MYORDER}/${hit.id}`,
                state: hit
            }}
            className={classes.link}
        >
            <List dense
                className={classes.root}
            >
                <ListItem>
                    <ListItemText
                        primary={
                            <Typography color="textPrimary" variant="subtitle1">
                                {`${handleLabel('orderNo')} ${hit.id}`}
                            </Typography>
                        }
                        secondary={d.toLocaleString()}
                    />
                    <ListItemSecondaryAction>
                        <Chip
                            variant={index === 1 ? 'outlined' : 'default'}
                            color={color}
                            label={handleLabel(hit.status)}
                        />
                    </ListItemSecondaryAction>

                </ListItem>
                <ListItem>
                    <ListItemText
                        primary={hit.items.map((item, key) => (
                            <Badge key={key} badgeContent={item.qty} color={!!item.error ? 'error' : 'primary'}>
                                <img
                                    src={item.images.length ? item.images[0].preview : _noImage}
                                    alt={item.images.length ? item.images[0].name : item.id}
                                    onError={(e) => e.target.src = _noImage}
                                    className={classNames(classes.img, (!!item.error && classes.error))}
                                />
                            </Badge>
                        ))}
                    />
                </ListItem>
            </List>
        </Link>
    )
}

export default OrderCard

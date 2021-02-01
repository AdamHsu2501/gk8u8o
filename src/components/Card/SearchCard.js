import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    List, ListItem, ListItemAvatar, ListItemText, Avatar
} from '@material-ui/core';

import { _noImage } from '../../variables/Values'

const useStyles = makeStyles(theme => ({
    img: {
        width: theme.spacing(7),
        height: theme.spacing(7),
    },
    margin: {
        marginRight: theme.spacing(2),
    },
}));

const SearchCard = ({ onSubmit, avatar, primary, secondary }) => {
    const classes = useStyles();
    return (
        <List>
            <ListItem button onClick={onSubmit} >
                <ListItemAvatar className={classes.margin}>
                    <Avatar variant="square" src={avatar || _noImage} className={classes.img} />
                </ListItemAvatar>
                <ListItemText
                    primary={primary}
                    secondary={secondary}
                />
            </ListItem>
        </List>
    );
}

export default SearchCard
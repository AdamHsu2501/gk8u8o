import React from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles'
import { List, ListItem, ListItemText } from '@material-ui/core';

import { useFirebase } from '../../Firebase';

const useStyles = makeStyles(theme => ({
    selected: {
        color: theme.palette.warning.main
    }
}))

const Langeuage = ({ onSubmit }) => {
    const classes = useStyles()
    const { langCode, languages, handleLanguage } = useFirebase()

    const handleClick = (id) => () => {
        handleLanguage(id)
        onSubmit()
    }

    return (
        <List>
            {languages.map((item, key) => (
                <ListItem
                    key={key}
                    button
                    onClick={handleClick(item.id)}
                    className={classNames(langCode === item.id && classes.selected)}
                >
                    <ListItemText primary={item.native} />
                </ListItem>
            ))}
        </List>
    )
}

export default Langeuage
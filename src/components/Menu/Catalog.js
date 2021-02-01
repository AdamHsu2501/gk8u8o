import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemIcon, ListItemText, Collapse } from '@material-ui/core'
import { ExpandLess, ExpandMore } from '@material-ui/icons'

import { useFirebase } from '../../Firebase'

const useStyles = makeStyles(theme => ({
    nested: {
        paddingLeft: theme.spacing(3),
    },
}));

const Item = ({ data, state, onSelect, onSubmit }) => {
    const classes = useStyles();
    const { auth, handleLabel } = useFirebase()
    const { admin, permission } = auth

    var setting = data.children ? {
        button: true,
        onClick: () => onSelect(data.id),
    } : {
            button: true,
            onClick: onSubmit || null,
            component: Link,
            to: data.path
        }

    return (
        <List>
            <ListItem {...setting} >
                {data.icon && (
                    <ListItemIcon>
                        <data.icon />
                    </ListItemIcon>
                )}
                <ListItemText primary={handleLabel(data.id)} />
                {data.children && (state === data.id ? <ExpandLess /> : <ExpandMore />)}
            </ListItem>

            {data.children && (
                <Collapse in={state === data.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding className={classes.nested}>
                        {data.children.map(subItem => (
                            admin === 2 || (!!permission[subItem.id] && permission[subItem.id].read) ? (
                                <Item key={subItem.id} data={subItem} onSelect={onSelect} onSubmit={onSubmit} />
                            ) : null
                        ))}
                    </List>
                </Collapse>
            )}
        </List>
    )
}

const Catalog = ({ list, onSubmit }) => {
    const [state, setState] = useState(null)

    const handleSelect = v => {
        setState(prev => prev === v ? null : v)
    }

    return (
        <List>
            {list.map((item, key) => (
                <Item key={key} data={item} state={state} onSelect={handleSelect} onSubmit={onSubmit} />
            ))}
        </List>
    )
}

export default Catalog
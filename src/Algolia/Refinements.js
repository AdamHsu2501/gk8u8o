import React, { useState, memo } from 'react'
import { useLocation } from 'react-router-dom'
import classNames from 'classnames'
import { connectRefinementList, connectCurrentRefinements, connectMenu } from 'react-instantsearch-dom';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import {
    List, ListItem, ListItemIcon, ListItemText, ListSubheader,
    Chip, Checkbox, Grid, Button, Typography, Collapse
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

import { _status } from '../variables/Values'
import { useFirebase } from '../Firebase'
import { useConfigure } from '../hooks/useConfigure'
import TextField from '../components/Field/TextField'

const useStyles = makeStyles(theme => ({
    link: {
        textDecoration: 'none',
        color: theme.palette.grey[800],
        opacity: 1,
        '&:hover': {
            opacity: 0.8,
        }
    },
    paper: {
        backgroundColor: 'white'
    },
    divider: {
        borderBottom: `1px solid ${theme.palette.divider}`
    },
    highlight: {
        color: theme.palette.warning.main
    }
}))

const CustomCheckbox = withStyles(theme => ({
    root: {
        color: theme.palette.warning.light,
        '&$checked': {
            color: theme.palette.warning.main,
        },
    },
    checked: {},
}))((props) => <Checkbox color="default" {...props} />);

const Item = ({ item, refine, checkbox }) => {
    const classes = useStyles();

    const handleClick = (e) => {
        e.preventDefault();
        refine(item.value);
    }

    return (
        <ListItem button onClick={handleClick}>
            {!!checkbox && (
                <ListItemIcon>
                    <CustomCheckbox checked={item.isRefined} />
                </ListItemIcon>
            )}
            <ListItemText
                primary={(
                    <Typography className={classNames(item.isRefined && classes.highlight)}>
                        {item.label}
                    </Typography>
                )}
            />
            <Chip size="small" label={item.count} />
        </ListItem>
    )
}

const isNativeItem = (item) => {
    return (item.includes(':') && item.includes('{') && item.includes('}') && item.includes('"') && item.includes(','))
}

const transformItems = (items, attribute, search, handleLabel) => {
    switch (attribute) {
        case 'status':
            return items.sort((a, b) => _status.indexOf(a.label) - _status.indexOf(b.label)).map(item => ({
                ...item,
                label: handleLabel(item.label)
            }))
        case 'size':
            return items.map(item => ({
                ...item,
                label: `${item.label} mm`
            }))
        case 'scale':
            return items
        default:
            return items.filter(item => isNativeItem(item.label)).map(item => {
                var tag = JSON.parse(item.label)
                var isSearch = search.includes(tag.id)
                return {
                    ...item,
                    isRefined: isSearch,
                    label: handleLabel(tag.displayName),
                    value: isSearch ? '' : tag.id
                }
            })
    }
}

const Content = memo(({ items, attribute, refine, searchable, searchForItems, showMore, limit, checkbox }) => {
    const classes = useStyles()
    const { search } = useLocation()
    const { handleLabel } = useFirebase()
    const [isLimit, setIsLimit] = useState(showMore)
    var list = transformItems(items, attribute, search, handleLabel)

    return (
        <List dense>
            <ListSubheader className={classes.paper}>
                {searchable ? (
                    <TextField
                        variant="standard"
                        margin="dense"
                        label={handleLabel(attribute)}
                        endAdornment={<SearchIcon />}
                        onChange={(id, value) => searchForItems(value)}
                    />
                ) : (
                        <Typography color="textPrimary" variant="h6" className={classes.divider} >
                            {handleLabel(attribute)}
                        </Typography>
                    )}
            </ListSubheader>

            {list.slice(0, limit).map((item, key) => (
                <Item
                    key={key}
                    item={item}
                    refine={refine}
                    checkbox={checkbox}
                />
            ))}

            <Collapse in={!isLimit} >
                {list.slice(limit).map((item, key) => (
                    <Item
                        key={key}
                        item={item}
                        refine={refine}
                        checkbox={checkbox}
                    />
                ))}
            </Collapse >

            {(showMore && list.length > limit) && (
                <Grid container justify="center">
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setIsLimit(prev => !prev)}
                        endIcon={isLimit ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    >
                        {isLimit ? handleLabel('showMore') : handleLabel('showLess')}
                    </Button>
                </Grid>
            )}
        </List>
    )
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next))

const CustomMenu = connectMenu((props) => <Content {...props} />)
const CustomRefinementList = connectRefinementList((props) => <Content {...props} checkbox={true} />)

export const Refinements = ({ list, menu }) => {
    const { limit, showMoreLimit } = useConfigure()
    return (
        <div>
            {!!list && list.map(id => (
                <CustomRefinementList
                    key={id}
                    attribute={id}
                />
            ))}
            {!!menu && menu.map(id => (
                <CustomMenu
                    key={id}
                    attribute={id}
                    searchable
                    showMore
                    showMoreLimit={showMoreLimit}
                    limit={limit}
                />
            ))}
        </div>
    )
}


export const ClearRefinements = connectCurrentRefinements(({ items, refine, onClick, label }) => {

    const handleClick = () => {
        refine(items)
        onClick()
    }
    return (
        <Button onClick={handleClick} >
            <Typography variant="subtitle1" >
                {label}
            </Typography>
        </Button>
    )
});
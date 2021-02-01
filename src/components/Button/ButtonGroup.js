import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles'
import {
    Grid, Button, ButtonGroup, Grow,
    Paper, Popper, ClickAwayListener,
    MenuItem, MenuList, ListItemIcon
} from '@material-ui/core';
import { ArrowDropDown } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
    popper: {
        zIndex: theme.zIndex.modal + 1,
    },
    paper: {
        background: theme.palette.grey[700],

    },
    delete: {
        borderTop: `1px solid ${theme.palette.divider}`,
        color: theme.palette.secondary.main,
    }
}))

const DefaultButtonGroup = ({ list, onCallback }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    const handleClick = (value) => {
        onCallback(value)
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    return (
        <Grid >
            <ButtonGroup variant="contained" color="primary" ref={anchorRef} >
                <Button
                    onClick={() => handleClick(list[0].value)}
                    startIcon={list[0].icon}
                >
                    {list[0].label}
                </Button>
                
                {list.length > 1 && (
                    <Button
                        color="primary"
                        size="small"
                        onClick={handleToggle}
                    >
                        <ArrowDropDown />
                    </Button>
                )}
            </ButtonGroup>

            <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal className={classes.popper}>
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper className={classes.paper}>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList dense color="primary" >
                                    {list.slice(1).map((item, key) => (
                                        <MenuItem
                                            key={key}
                                            onClick={(event) => handleClick(item.value)}
                                            className={item.value === 'delete' ? classes.delete : null}
                                        >
                                            <ListItemIcon>
                                                {item.icon}
                                            </ListItemIcon>

                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </Grid>
    );
}

export default DefaultButtonGroup
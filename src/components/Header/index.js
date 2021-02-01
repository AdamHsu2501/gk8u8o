import React from 'react';
import { Link, useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Grid, Hidden, IconButton, Button, Typography, Badge } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu'
import PersonIcon from '@material-ui/icons/Person'
import LanguageIcon from '@material-ui/icons/Language'
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart'

import * as ROUTES from '../../routes';
import { _headerImg } from '../../variables/Values'
import Search from '../../Algolia/Search'
import { useFirebase, _stock } from '../../Firebase'
import { useDrawer } from '../../hooks/useDrawer'
import { useConfigure } from '../../hooks/useConfigure'
import HideOnScroll from '../Drawer/HideOnScroll'
import SideDrawer from '../Drawer/SideDrawer'
import LanguageMenu from '../Menu/Langeuage'
import AuthMenu from '../Menu/Auth'
import Catalog from '../Menu/Catalog'


const useStyles = makeStyles(theme => ({
    root: {
        boxShadow: "none",
        borderBottom: "1px solid #e5e5e5",
    },
    logo: {
        height: 28,
        width: 'auto',
        cursor: 'pointer',
        [theme.breakpoints.up('sm')]: {
            height: 64,
        },
    },
    icon: {
        fontSize: 24,
        [theme.breakpoints.up('sm')]: {
            fontSize: 36,
        },
    },
}))

const Header = ({ isAdmin, shopCart }) => {
    let history = useHistory()
    const { auth, handleLabel } = useFirebase()
    const { open, anchor, handleOpen, handleClose } = useDrawer()
    const { filters, searchPerPage } = useConfigure()
    const classes = useStyles()

    var list = isAdmin ? ROUTES.adminRoutes : ROUTES.clientRoutes.filter(item => item.state === 'menu')

    const handleHit = hit => {
        history.push(`${ROUTES.LIST}/${hit.id}`, hit)
    }

    const searchSetting = {
        indexName: _stock,
        configure: {
            hitsPerPage: searchPerPage,
            filters: filters
        },
        onClick: handleHit
    }

    return (
        <HideOnScroll direction="down">
            <AppBar color="inherit" className={classes.root} >
                <Toolbar>
                    <Grid container direction="column">
                        <Grid item container justify="space-between" alignItems="center">
                            <Hidden mdUp>
                                <IconButton onClick={() => handleOpen('menu', 'left')}>
                                    <MenuIcon className={classes.icon} />
                                </IconButton>
                            </Hidden>

                            <Grid item xs>
                                <Link to={isAdmin ? ROUTES.ADMIN : ROUTES.HOME}>
                                    <img src={_headerImg} alt="Home" className={classes.logo} />
                                </Link>
                            </Grid>

                            {!isAdmin && (
                                <Hidden smDown>
                                    <Grid item sm={4}>
                                        <Search {...searchSetting} />
                                    </Grid>
                                </Hidden>
                            )}


                            <Grid item xs>
                                <Grid container justify="flex-end">

                                    <IconButton onClick={() => handleOpen('lang', 'right')}>
                                        <LanguageIcon className={classes.icon} />
                                    </IconButton>

                                    {!auth ? (
                                        <Button onClick={() => history.push(ROUTES.LOGIN)}>{handleLabel('login')}</Button>
                                    ) : (
                                            <IconButton onClick={() => handleOpen('auth', 'right')}>
                                                <PersonIcon className={classes.icon} />
                                            </IconButton>
                                        )}

                                    {!isAdmin && (
                                        <IconButton component={Link} to={ROUTES.CART}>
                                            <Badge badgeContent={shopCart.qty} color="secondary" >
                                                <ShoppingCartIcon className={classes.icon} />
                                            </Badge>
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                        {!isAdmin && (
                            <Grid>
                                <Hidden smDown>
                                    {!isAdmin && list.map((item, key) => (
                                        <Button key={key} component={Link} to={item.path}>
                                            <Typography variant="subtitle1" >
                                                {handleLabel(item.id)}
                                            </Typography>
                                        </Button>
                                    ))}
                                </Hidden>
                                <Hidden mdUp>
                                    <Grid item xs={12} >
                                        <Search {...searchSetting} />
                                    </Grid>
                                </Hidden>
                            </Grid>
                        )}
                    </Grid>
                </Toolbar>

                <SideDrawer
                    open={!!open}
                    anchor={anchor}
                    onClose={handleClose}
                >
                    {open === 'menu' && (
                        <Catalog list={list} onSubmit={handleClose} />
                    )}

                    {open === 'lang' && (
                        <LanguageMenu onSubmit={handleClose} />
                    )}

                    {open === 'auth' && (
                        <AuthMenu isAdmin={isAdmin} onSubmit={handleClose} />
                    )}
                </SideDrawer>
            </AppBar>
        </HideOnScroll>
    );
}

export default Header
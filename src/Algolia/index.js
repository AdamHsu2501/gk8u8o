import React, { useState, useEffect } from 'react'
import qs from 'qs'
import { useHistory, useLocation } from 'react-router-dom'
import { InstantSearch, Configure, SearchBox, Pagination } from 'react-instantsearch-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Button, AppBar } from '@material-ui/core'
import TuneIcon from '@material-ui/icons/Tune';

import * as ROUTES from '../routes';
import { _tag } from '../variables/Values'
import { useFirebase, useInfo } from '../Firebase'
import { useDrawer } from '../hooks/useDrawer'
import HideOnScroll from '../components/Drawer/HideOnScroll'
import Body from '../components/Body'
import ImgCard from '../components/Card/ImgCard'
import SideDrawer from '../components/Drawer/SideDrawer'
import { searchClient } from './config';
import { Refinements } from './Refinements'

const useStyles = makeStyles(theme => ({
    hidden: {
        display: 'none'
    },
    appBar: {
        top: 'auto',
        bottom: 0,
        [theme.breakpoints.up('md')]: {
            display: 'none',
        }
    },
    margin: {
        margin: `${theme.spacing(4)}px 0px`
    },
}))

const createURL = state => {

    const isDefaultRoute = Object.keys(state).every(key => {
        if (key === 'configure') {
            return true
        } else if (key === 'page') {
            return state[key] === 1
        } else if (key === 'query') {
            return !state[key]
        } else {
            var obj = state[key]
            return Object.values(obj).every(value => !value)
        }
    })

    if (isDefaultRoute) {
        return null
    }

    const { query, page, menu, refinementList } = state
    const queryParameters = {};
    if (page !== 1) {
        queryParameters.page = page;
    }

    if (!!query) {
        queryParameters.query = query
    }

    if (!!menu) {
        Object.keys(menu).forEach(key => {
            var value = menu[key]
            if (!!value) {
                queryParameters[key] = value
            }
        })
    }

    if (!!refinementList) {
        Object.keys(refinementList).forEach(key => {
            var value = refinementList[key]
            if (!!value) {
                queryParameters[key] = value
            }
        })
    }

    const queryString = qs.stringify(queryParameters, {
        addQueryPrefix: true,
        arrayFormat: 'repeat',
    });

    return queryString;
};

const searchStateToUrl = searchState => searchState ? createURL(searchState) : '';

const urlToSearchState = (location) => {
    const paras = qs.parse(location.search.slice(1));

    var query, page, menu = {}, refinementList = {}
    var mList = _tag.concat('size', 'scale')
    var rList = ['status']

    Object.keys(paras).forEach(key => {
        var value = paras[key]
        if (!!value) {
            if (key === 'page') {
                page = value
            }
            if (mList.includes(key)) {
                menu[key] = value
            }
            if (rList.includes(key)) {
                refinementList[key] = value
            }
            if (key === 'query') {
                query = decodeURIComponent(value)
            }
        }

    })

    return {
        query: query,
        page: page || 1,
        menu: menu,
        refinementList: refinementList,
    };
};



const Algolia = ({ indexName, configure, refresh, list, menu, seo, pagination, noList, filterButton, children }) => {
    const classes = useStyles()
    let history = useHistory()
    let location = useLocation()
    const { handleLabel, brands, events } = useFirebase()
    // const { brands, events } = useInfo()
    const { open, anchor, handleOpen, handleClose } = useDrawer()
    const [searchState, setSearchState] = useState({});



    useEffect(() => {
        setSearchState(urlToSearchState(location))
    }, [location])

    const onSearchStateChange = newState => {
        var redirect = Object.keys(newState).filter(key => ['refinementList', 'menu', 'query', 'page'].includes(key))
            .some(key => JSON.stringify(newState[key]) !== JSON.stringify(searchState[key]))

        if (redirect) {
            const { pathname } = location
            const arr = pathname.split('/')
            var newURL = searchStateToUrl(newState) || pathname

            if (arr.length > 2) {
                history.push({
                    pathname: arr.slice(0, -1).join('/'),
                    search: newURL
                })
            } else {
                history.push(newURL)
            }

            setSearchState(newState);
        }
    }

    const settings = !seo ? null : {
        searchState: searchState,
        onSearchStateChange: onSearchStateChange,
        createURL: createURL,
    }
    var left = null, right = null
    if (!noList) {
        left = !!list ? <Refinements list={list} menu={menu} /> : (
            <Grid container spacing={1}>
                {brands.map((item, key) => (
                    <Grid key={key} item xs={12} >
                        <ImgCard
                            src={item.images[0].preview}
                            alt={handleLabel(item.displayName)}
                            path={{
                                pathname: ROUTES.LIST,
                                search: `?brand=${item.displayName['en-us']}`
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
        )
        right = (
            <Grid container spacing={1}>
                {events.map((item, key) => (
                    <Grid key={key} item xs={6} sm={12} >
                        <ImgCard
                            src={item.images[0].preview}
                            alt={item.images[0].name}
                            path={item.pathname}
                        />
                    </Grid>
                ))}
            </Grid>
        )
    }

    return (
        <InstantSearch
            searchClient={searchClient}
            indexName={indexName}
            refresh={refresh}
            {...settings}
        >
            <Configure {...configure} />
            <SearchBox className={classes.hidden} />
            <Body
                left={left}
                right={right}
            >
                {children}

                {filterButton && (
                    <HideOnScroll direction="up">
                        <AppBar position="fixed" color="transparent" className={classes.appBar}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<TuneIcon />}
                                onClick={() => handleOpen(true, 'left')}
                            >
                                {handleLabel('filters')}
                            </Button>
                        </AppBar>
                    </HideOnScroll>
                )}
            </Body>

            <SideDrawer open={!!open} anchor={anchor} onClose={handleClose}>
                {left}
            </SideDrawer>

            {pagination && <Pagination className={classes.margin} />}
        </InstantSearch>
    );
}

export default Algolia
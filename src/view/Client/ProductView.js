import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx'
import { useParams, useLocation, useHistory } from "react-router-dom";
import { Button, Grid, Typography, Chip, TextField, MenuItem, Snackbar, Divider } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { AddShoppingCart, Star, Check } from '@material-ui/icons';

import * as ROUTES from '../../routes';
import { _tag } from '../../variables/Values'
import IndexPanel from '../../Algolia/IndexPanel'
import Firebase, { _stock, _message, _ranking, useFirebase, useInfo, useFirestoreQuery } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'
import MessageForm from '../../components/Form/MessageForm';
import { MessageCard } from '../../components/Card/MessageCard'
import Carousel from '../../components/Panel/Carousel'
import StatusTag from '../../components/Tag/StatusTag'
import ReturnButton from '../../components/Button/ReturnButton'
import TabPanel from '../../components/Panel/TabPanel'
import { getCurrency } from '../../utils/getCurrency'
import { getSKU } from '../../utils/getSKU'
import { useDrawer } from '../../hooks/useDrawer';


const useStyles = makeStyles(theme => ({
    root: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
    },
    table: {
        display: 'table',
    },
    tableCell: {
        borderBottom: `1px solid ${theme.palette.grey[400]}`,
        display: 'table-cell',
        boxSizing: 'border-box',
        fontSize: 16,
        padding: '14px 0',
    },
    title: {
        width: theme.spacing(15)
    },
    text: {
        color: theme.palette.grey[800],
        minWidth: 200,
        height: 60
    },
    currency: {
        color: theme.palette.warning.main,
    },
    bold: {
        fontWeight: 700
    },
    through: {
        textDecoration: 'line-through',
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.grey[600],
        opacity: 1,
        '&:hover': {
            textDecoration: 'underline',
            opacity: 0.8,
        }
    },
    note: {
        whiteSpace: 'pre-wrap'
    },
    margin: {
        marginBottom: theme.spacing(4)
    },
    divider: {
        borderBottom: `1px solid ${theme.palette.divider}`
    }
}));

function InfoItem({ sm, label, value }) {
    const classes = useStyles()
    let history = useHistory()
    const { handleLabel } = useFirebase()

    return (
        <Grid item xs={12} sm={sm} className={classes.table}>
            <div className={clsx(classes.tableCell, classes.title, classes.bold)}>
                {handleLabel(label)}
            </div>

            {Array.isArray(value) ? (
                <div className={clsx(classes.tableCell, classes.text)}>
                    {value.map((item, key) => {
                        return (
                            <Chip
                                key={key}
                                clickable
                                variant="outlined"
                                color="primary"
                                label={handleLabel(item.displayName)}
                                onClick={() => history.push({
                                    pathname: `${ROUTES.LIST}`,
                                    search: `?${label}=${item.id}`,
                                })}
                            />
                        )
                    })}
                </div>
            ) : (
                    <div className={clsx(classes.tableCell, classes.text)}>{value}</div>
                )}
        </Grid>
    )
}

const ProductView = () => {
    const classes = useStyles();
    const { state } = useLocation();
    let history = useHistory();

    const { topicId } = useParams();
    const { auth, currency, exchangeRate, handleLabel, country } = useFirebase()
    const { shopCart, handleShopCart } = useInfo()
    const { filters, rankPerPage, rankFilters } = useConfigure()


    const [doc, setDoc] = useState(null)
    const data = doc ? getSKU(doc, exchangeRate, currency, country, auth.group) : null;
    const messages = useFirestoreQuery({
        ref: Firebase.firestore().collection(_message).where('target.id', '==', topicId).orderBy('update', 'desc')
    })
    const [open, setOpen] = useState(null)
    const [qty, setOrderQty] = useState(1);
    const [tabNum, setTabNum] = useState(0)

    const handleTab = (event, value) => {
        setTabNum(value);
    };

    var tabList = [
        { id: 'recommend', label: handleLabel('recommend') },
        { id: 'comment', label: handleLabel('comment') }
    ]

    const handleChange = useCallback(event => {
        setOrderQty(event.target.value);
    }, []);

    const [following, setFollowing] = useState(false)
    const handleFollow = () => {
        Firebase.firestore().collection(_stock).doc(data.id).update({
            followers: following ? Firebase.firestore.FieldValue.arrayRemove(auth.id) : Firebase.firestore.FieldValue.arrayUnion(auth.id)
        })

        setFollowing(preState => !preState)
    }

    useEffect(() => {
        if (!!state) {
            setDoc(state)
            setFollowing(state.followers.includes(auth.id))
        } else {
            var id = topicId.split('?')[0]

            Firebase.firestore().collection(_stock).doc(id).get().then(doc => {
                if (doc.exists) {
                    var data = doc.data();
                    setDoc(data)
                    setFollowing(data.followers.includes(auth.id))
                } else {
                    history.push({
                        pathname: ROUTES.NOMATCH,
                        state: 404,
                    })
                }
            })
        }
    }, [state, auth, topicId, history])

    const [snackPack, setSnackPack] = useState([]);
    const [messageInfo, setMessageInfo] = useState(undefined);


    useEffect(() => {
        if (snackPack.length && !messageInfo) {
            // Set a new snack when we don't have an active one
            setMessageInfo({ ...snackPack[0] });
            setSnackPack((prev) => prev.slice(1));
            setOpen('alert');
        } else if (snackPack.length && messageInfo && open) {
            // Close an active snack when a new one is added
            setOpen(null);
        }
    }, [snackPack, messageInfo, open]);


    if (!data || messages.loading) {
        return <div>loading...</div>
    }



    var recommendFileters = null
    if (!!data.recommend.tag) {
        if (!!data.recommend.attribute) {
            recommendFileters = filters.concat(` AND tag.brand:${data.recommend.tag}`)
        } else {
            recommendFileters = filters.concat(` AND tagQuery:${data.recommend.tag}`)
        }
    }

    var cartItem = shopCart.list.find(item => item.id === data.id)
    var num = 20
    if (data.deduction) {
        if (!!cartItem) {
            var temp = data.quantity - cartItem.qty
            num = temp < 0 ? 0 : temp
        } else {
            num = data.quantity
        }
    }

    var qtyOptions = [...new Array(num + 1)].map((item, key) => key);

    var d = new Date(data.date)
    var infoList = [
        { sm: 6, label: 'releaseDate', value: d.toLocaleDateString() },
        { sm: 6, label: 'price', value: `${currency} ${getCurrency(data.price)}` },
        { sm: 6, label: 'code', value: data.code },
        { sm: 6, label: 'status', value: handleLabel(data.status) },
        { sm: 6, label: 'scale', value: data.scale },
        { sm: 6, label: 'size', value: `${data.size} mm` }
    ].concat(_tag.map(key => ({
        sm: key === 'contents' || key === 'others' ? 12 : 6,
        label: key,
        value: data.tag[key].map(id => ({ id: id, displayName: data.tags[id] })),
    })))

    const AddToCart = () => {
        var obj = Object.assign({}, data);
        obj.qty = qty

        handleShopCart('add', obj)
        setSnackPack((prev) => [...prev, new Date().getTime()]);
    }

    const handleExited = () => {
        setMessageInfo(undefined);
    };

    var btnLabel
    if (data.status === 'inStock') {
        btnLabel = handleLabel('addToCart')
    } else if (data.status === 'openingSoon' || data.status === 'outOfStock' || data.status === 'failed') {
        btnLabel = handleLabel(data.status)
    } else {
        btnLabel = handleLabel('preOrder')
    }

    return (
        <Grid container spacing={6} className={classes.root}>
            <Grid item xs={12}>
                <ReturnButton />
            </Grid>
            <Grid item xs={12} sm={6} >
                <Carousel list={data.images} border={data.nDiscount} />
            </Grid>

            <Grid container direction="column" item xs={12} sm={6}>
                <Grid item className={classes.margin}>
                    <StatusTag status={data.status} />
                </Grid>

                <Grid item container className={classes.margin}>
                    <Grid item xs={12}>
                        <Typography variant='h5' gutterBottom >{handleLabel(data.displayName)}</Typography>
                    </Grid>

                    {data.tag.brand.map((id, key) => (
                        <Grid item xs={12} key={key}>
                            <Typography color="textSecondary" gutterBottom>
                                {handleLabel(data.tags[id])}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                <Grid item container spacing={1} alignItems="baseline" className={classes.margin}>
                    {!!data.type && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary" className={classes.through}>
                                {`${currency} ${getCurrency(data.listPrice)}`}
                            </Typography>
                        </Grid>
                    )}

                    <Grid item>
                        <Typography variant="h5" className={clsx(classes.currency, classes.bold)}>
                            {`${currency} ${getCurrency(data.price)}`}
                        </Typography>
                        {data.type === 'group' && (
                            <Typography className={clsx(classes.currency, classes.bold)}>
                                ({handleLabel(auth.group.displayName)})
                            </Typography>
                        )}
                        {data.type === 'event' && (
                            <Typography className={clsx(classes.currency, classes.bold)}>
                                ({handleLabel('eventSpecials')})
                            </Typography>
                        )}
                    </Grid>

                    {!!data.percent && (
                        <Grid item>
                            <Typography className={clsx(classes.currency, classes.bold)}                                >
                                {`${handleLabel('save')} ${data.percent}%`}
                            </Typography>
                        </Grid>
                    )}


                    {!!data.rewards && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="secondary">
                                {`${getCurrency(data.rewards)} ${handleLabel('rewardPoints')}`}
                            </Typography>
                        </Grid>
                    )}

                </Grid>

                <Grid item container spacing={1} className={classes.margin}>
                    <Grid item xs={4} >
                        <TextField
                            fullWidth
                            disabled={
                                qtyOptions.length <= 1
                                || data.status === 'outOfStock'
                                || data.status === 'openingSoon'
                                || data.status === 'failed'
                            }
                            select
                            variant="outlined"
                            label={handleLabel('quantity')}
                            value={qtyOptions.length > qty ? qty : 0}
                            onChange={handleChange}
                        >
                            {qtyOptions.map((item, key) => (
                                <MenuItem key={key} value={key}>
                                    {key}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid container item xs={8} >
                        <Button
                            fullWidth
                            disabled={
                                qtyOptions.length <= 1
                                || qty >= qtyOptions.length
                                || !qty
                                || data.status === 'outOfStock'
                                || data.status === 'openingSoon'
                                || data.status === 'failed'
                            }
                            startIcon={<AddShoppingCart />}
                            variant="contained"
                            color="primary"
                            onClick={AddToCart}
                        >
                            {btnLabel}
                        </Button>
                    </Grid>
                </Grid>

                <Grid item container >
                    <Button
                        fullWidth
                        startIcon={<Star />}
                        variant={following ? "contained" : "outlined"}
                        color={following ? "default" : "primary"}
                        onClick={handleFollow}
                    >
                        {following ? handleLabel('followed') : handleLabel('addToFollowList')}
                    </Button>
                </Grid>
            </Grid>

            <Grid item>
                <Typography variant="h6" className={classes.bold} gutterBottom>{handleLabel('note')}</Typography>
                <Typography className={classes.note}>{handleLabel(data.note)}</Typography>
            </Grid>

            <Grid item container >
                <Grid item xs={12}>
                    <Typography variant="h6" className={classes.bold} gutterBottom>
                        {handleLabel('about')}
                    </Typography>
                </Grid>
                {infoList.map((item, key) => (
                    <InfoItem key={key} sm={item.sm} label={item.label} value={item.value} />
                ))}
            </Grid>

            <Grid item xs={12}>
                <TabPanel list={tabList} value={tabNum} onSubmit={handleTab} />
            </Grid>

            {tabNum === 0 && (
                <Grid item xs={12} >
                    <IndexPanel
                        indexName={_ranking}
                        label={handleLabel('recommend')}
                        filters={recommendFileters || rankFilters}
                        hitsPerPage={rankPerPage}
                    />

                    <Divider style={{ margin: '10% 0' }} />

                    <IndexPanel
                        indexName={_stock}
                        label={handleLabel('new')}
                        filters={filters}
                        hitsPerPage={rankPerPage}
                    />
                </Grid>
            )}

            {tabNum === 1 && (
                <MessageContent target={doc} messages={messages} />
            )}



            <Snackbar
                key={messageInfo ? messageInfo : undefined}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                open={open === 'alert'}
                onClose={() => setOpen(null)}
                onExited={handleExited}
            >
                <Alert icon={<Check fontSize="inherit" />} variant="filled" severity="success">
                    {handleLabel('addedToCart')}
                </Alert>
            </Snackbar>
        </Grid>

    );
}

const MessageContent = ({ target, messages }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()
    const { open, handleOpen, handleClose } = useDrawer()

    return (
        <Grid item container >
            <Grid container justify="flex-end">
                <Button
                    variant="contained"
                    onClick={() => handleOpen('msg')}
                    color="secondary"
                >
                    {handleLabel('leaveAMessage')}
                </Button>
            </Grid>

            <Grid container spacing={2} >
                {messages.data.map((hit, key) => (
                    <Grid key={hit.objectID} item xs={12} className={classes.divider}>
                        <MessageCard hit={hit} />
                    </Grid>
                ))}
            </Grid>

            <MessageForm
                open={open === 'msg'}
                isAdmin={false}
                onClose={handleClose}
                target={target}
            />

        </Grid>
    )
}

export default ProductView;
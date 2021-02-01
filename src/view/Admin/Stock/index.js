import React from 'react';
import countriesList from 'countries-list'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import {
    AddBox, DeleteOutline, Edit, Event, Visibility,
    VerticalAlignTop, Email, ContactSupport, Book
} from '@material-ui/icons';


import * as ROUTES from '../../../routes'
import { _tag, _status, _volumetricWeight, _boolean, _level, APP_NAME, _noImage } from '../../../variables/Values';
import Firebase, {
    _stock, _user, useFirebase, handleEmails,
    useFirestoreQuery, updateStorage, deleteStorage
} from '../../../Firebase';
import DataTable from '../../../components/Table/DataTable';
import DeleteAlert from '../../../components/Dialog/DeleteAlert'
import Form from '../../../components/Form/UpdateForm';
import { getDifferent } from '../../../utils/getDifferent'
import { getCurrency } from '../../../utils/getCurrency'
import { getFixed } from '../../../utils/getFixed'
import EmailDialog from '../../../components/Dialog/EmailDialog'
import { useAdmin } from '../../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: '100%',
        cursor: 'point',
        "&:hover": {
            opacity: '0.6'
        }
    }
}));

function useColumn() {
    const classes = useStyles();
    const { exchangeRates, handleLabel, langCode } = useFirebase()

    return [
        {
            title: handleLabel('avatar'),
            field: 'images',
            filtering: false,
            render: rowData => {
                return (
                    <a target='_blank' href={`${ROUTES.LIST}/${rowData.id}`} rel="noreferrer noopener">
                        <img
                            src={rowData.images.length ? rowData.images[0].preview : _noImage}
                            onError={(e) => e.target.src = _noImage}
                            alt={rowData.id}
                            className={classes.img}
                        />
                    </a>
                )
            }
        },
        { title: handleLabel('displayName'), field: `displayName.${langCode}`, filtering: false, },
        { title: handleLabel('code'), field: 'code', filtering: false, },
        { title: handleLabel('sku'), field: 'sku', filtering: false, },
        {
            title: handleLabel('price'),
            field: 'prices.price',
            filtering: false,
            render: rowData => {
                var d = Date.now()
                var obj = rowData.events.find(item => item.start <= d && item.end > d)
                var price = obj ? rowData.prices.price * (100 - obj.percent) / 100 : rowData.prices.price;
                return (
                    <Grid>
                        {Object.keys(exchangeRates).map((id, key) => (
                            <Typography key={key}>
                                {`${id} ${getCurrency(getFixed(price * exchangeRates[id], id))}`}
                            </Typography>
                        ))}
                    </Grid>
                )
            }
        },
        { title: handleLabel('quantity'), field: 'quantity', filtering: false, },
        {
            title: handleLabel('status'),
            field: 'status',
            lookup: _status.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {}),
        },
    ];
}

function getFormat(handleLabel, action, languages, brands, hashtags, exchangeRates) {
    var d = Date.now();
    if (action === 'set' || action === 'update' || action === 'view') {
        var bool = _boolean.map(item => ({ value: item, label: handleLabel(item) }))

        var levelOptions = _level.map(item => (
            { value: item, label: item }
        ))

        var countryOptions = Object.keys(countriesList.countries).map(key => {
            var obj = countriesList.countries[key]
            return {
                value: key,
                label: `${obj.native} (${obj.name})`
            }
        })

        var tagField = _tag.map(item => ({
            fieldType: 'select',
            id: item,
            label: handleLabel(item),
            value: [],
            multiple: true,
            options: item === 'brand'
                ? brands
                : hashtags.filter(subItem => !subItem.attribute.length || subItem.attribute.includes(item)),
            getOptionLabel: opt => handleLabel(opt.displayName),
            getValue: opt => opt.id,
        }))

        var pricesField = ['price', 'wholesalePrice'].map(id => (
            {
                fieldType: 'number',
                id: id,
                label: handleLabel(id),
                value: 99999,
                currency: exchangeRates,
                allowEmptyFormatting: false,
                thousandSeparator: true,
            }
        ))
        return [
            { hidden: true, fieldType: 'text', id: 'id', label: handleLabel('id'), value: `sku${d}` },
            { hidden: true, fieldType: 'date', id: 'create', label: handleLabel('create'), value: d },
            { hidden: true, fieldType: 'date', id: 'date', label: handleLabel('date'), value: null },
            { hidden: true, fieldType: 'text', id: 'sales', label: handleLabel('sales'), value: 0 },
            { hidden: true, fieldType: 'text', id: 'totalSales', label: handleLabel('totalSales'), value: 0 },
            { hidden: true, fieldType: 'text', id: 'followers', label: handleLabel('followers'), value: [] },
            { hidden: true, fieldType: 'text', id: 'cart', label: handleLabel('addedToCart'), value: {} },
            {
                fieldType: 'text',
                id: 'remark',
                label: handleLabel('remark'),
                helperText: handleLabel('onlyStaff'),
                value: '',
                multiline: true,
                rows: 3,
                rowsMax: 20,
                sm: 12
            },
            { fieldType: 'file', id: 'images', label: handleLabel('image'), value: [], multiple: true, helperText: handleLabel('dropzoneHelper') },
            {
                fieldType: 'title',
                id: 'displayName',
                label: handleLabel('displayName'),
                children: languages.map(item => ({
                    required: item.default,
                    fieldType: 'text',
                    id: item.id,
                    label: item.native,
                    value: '',
                    multiline: true,
                    rowsMax: 5
                }))
            },
            {
                fieldType: 'title',
                id: 'note',
                label: handleLabel('note'),
                children: languages.map(item => ({
                    fieldType: 'text',
                    id: item.id,
                    label: item.native,
                    value: '',
                    multiline: true,
                    rows: 3,
                    rowsMax: 5
                }))
            },
            { fieldType: 'title', label: handleLabel('settingTooltip') },
            {
                fieldType: 'text',
                id: 'status',
                label: handleLabel('stockStatus'),
                value: _status[0],
                options: _status.map(item => (
                    { value: item, label: handleLabel(item) }
                )),
                sm: 12
            },
            { required: true, fieldType: 'text', id: 'code', label: handleLabel('code'), value: '' },
            { required: true, fieldType: 'text', id: 'sku', label: handleLabel('sku'), value: '' },
            { fieldType: 'number', id: 'MOQ', label: handleLabel('MOQ'), value: 0, },
            { fieldType: 'number', id: 'quantity', label: handleLabel('quantity'), value: 0, },
            { fieldType: 'text', id: 'deduction', label: handleLabel('deduction'), value: _boolean[0], options: bool },
            { fieldType: 'text', id: 'lv', label: handleLabel('lv'), value: _level[0], options: levelOptions },
            { fieldType: 'text', id: 'gDiscount', label: handleLabel('groupDiscount'), helperText: handleLabel('groupDiscountHelper'), value: _boolean[0], options: bool },
            { fieldType: 'text', id: 'nDiscount', label: handleLabel('nDiscount'), helperText: handleLabel('qtyDiscountHelper'), value: _boolean[0], options: bool },
            { fieldType: 'text', id: 'onlyTW', label: handleLabel('onlyTW'), value: _boolean[0], options: bool },
            {
                fieldType: 'select',
                id: 'ban',
                label: handleLabel('ban'),
                value: [],
                multiple: true,
                options: countryOptions,
                getOptionLabel: opt => opt.label,
                getValue: opt => opt.value,
                filter: {
                    id: 'onlyTW',
                    operator: '===',
                    value: false
                }
            },
            { fieldType: 'title', id: 'tag', label: handleLabel('hashtag'), children: tagField },
            { fieldType: 'text', id: 'scale', label: handleLabel('scale'), value: '', },
            { fieldType: 'text', id: 'size', label: handleLabel('size'), value: '', endAdornment: 'mm' },
            {
                fieldType: 'title',
                id: 'recommend',
                label: handleLabel('recommend'),
                children: [
                    {
                        fieldType: 'select',
                        id: 'tag',
                        label: handleLabel('tag'),
                        value: null,
                        multiple: false,
                        options: brands.concat(hashtags),
                        getOptionLabel: opt => handleLabel(opt.displayName),
                        getValue: opt => opt.id,
                    },
                    {
                        fieldType: 'select',
                        id: 'attribute',
                        label: handleLabel('attribute'),
                        helperText: handleLabel('permitHelper'),
                        value: null,
                        multiple: false,
                        options: _tag,
                        getOptionLabel: opt => handleLabel(opt),
                        getValue: opt => opt,
                    },
                ]
            },
            { fieldType: 'title', id: 'prices', label: handleLabel('productPrice'), children: pricesField },
            { fieldType: 'title', label: handleLabel('points') },
            { fieldType: 'number', id: 'rewardPoints', label: handleLabel('rewardPoints'), value: 0, allowEmptyFormatting: false, thousandSeparator: true },
            {
                fieldType: 'select',
                id: 'banPoints',
                label: handleLabel('banPoints'),
                value: [],
                multiple: true,
                options: countryOptions,
                getOptionLabel: opt => opt.label,
                getValue: opt => opt.value,
            },
            {
                fieldType: 'event',
                id: 'events',
                label: handleLabel('events'),
                value: [],
                list: [
                    { fieldType: 'number', id: 'percent', label: handleLabel('percent'), value: 0, endAdornment: '%', sm: 4, },
                    { fieldType: 'date', id: 'start', label: handleLabel('start'), value: d, sm: 4, },
                    { fieldType: 'date', id: 'end', label: handleLabel('end'), value: d, sm: 4, },
                ]
            },
            {
                fieldType: 'title',
                id: 'volumetricWeight',
                label: handleLabel('volumetricWeight'),
                children: _volumetricWeight.map(item => ({
                    fieldType: 'number',
                    id: item.id,
                    label: handleLabel(item.id),
                    value: 0,
                    endAdornment: item.label,
                }))
            },
        ]
    } else if (action === 'event') {
        return [
            {
                fieldType: 'event',
                id: 'events',
                label: handleLabel('events'),
                value: [],
                list: [
                    { fieldType: 'number', id: 'percent', label: handleLabel('percent'), value: 0, endAdornment: '%', sm: 4, },
                    { fieldType: 'date', id: 'start', label: handleLabel('start'), value: d, sm: 4, },
                    { fieldType: 'date', id: 'end', label: handleLabel('end'), value: d, sm: 4, },
                ]
            },
        ]
    } else if (action === 'email') {
        return [
            {
                fieldType: 'text',
                id: 'target',
                label: handleLabel('target'),
                value: 'all',
                options: [
                    { value: 'all', label: handleLabel('all') },
                    { value: 'follower', label: handleLabel('follower') }
                ],
                sm: 12
            },
        ]
    } else {
        return []
    }

}

const Stock = ({ path }) => {
    const classes = useStyles();
    const theme = useTheme();
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, exchangeRates, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const products = useFirestoreQuery({ ref: Firebase.firestore().collection(_stock).orderBy('date', 'desc') })
    const hashtags = useFirestoreQuery({ ref: Firebase.firestore().collection('tag') });
    const brands = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/brand'),
        type: 'array',
        sort: 'order'
    });

    var loading = products.loading || brands.loading || hashtags.loading
    const rows = products.data || []
    var columns = useColumn()
    var format = loading ? [] : getFormat(handleLabel, action.type, languages, brands.data, hashtags.data, exchangeRates)

    const handleTop = rows => {
        var title = `${handleLabel('update')} ${rows.length} ${handleLabel('product')}`
        var batch = Firebase.firestore().batch()
        var d = Date.now()
        var obj = {
            date: d,
        }

        rows.forEach(item => {
            var ref = Firebase.firestore().collection(_stock).doc(item.id)
            batch.update(ref, obj)
        })

        batch.commit().then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            handleSnackbar(false, title)
        })
    }

    const handleEvent = newData => {
        var title = `${handleLabel('update')} ${action.data.length} ${handleLabel('product')}`
        var batch = Firebase.firestore().batch()

        action.data.forEach(item => {
            batch.update(Firebase.firestore().collection(_stock).doc(item.id), {
                events: item.events.concat(newData.events),
            })
        })

        batch.commit().then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            handleSnackbar(false, title)
        })
    }


    // function getRandomInt(max) {
    //     max = Math.floor(max);
    //     return Math.floor(Math.random() * (max + 1));
    // }

    // function getState(index, format, state) {
    //     var obj = {};
    //     format.forEach(item => {
    //         const { children, id } = item
    //         if (!!id) {
    //             var value = !!state && state[id] ? state[id] : item.value;

    //             if (!!children) {
    //                 obj[id] = getState(index, children, value)
    //             } else {
    //                 if (_tag.includes(id)) {
    //                     if (item.multiple) {
    //                         obj[id] = [item.getValue(item.options[getRandomInt(item.options.length - 1)])]
    //                     } else {
    //                         obj[id] = item.getValue(item.options[getRandomInt(item.options.length - 1)])
    //                     }
    //                 } else if (id === 'id' || id === 'code') {
    //                     obj[id] = index
    //                 } else if (id === 'date') {
    //                     obj[id] = Date.now()
    //                 } else if (id === 'status') {
    //                     obj[id] = item.options[getRandomInt(item.options.length - 1)].value
    //                 } else {
    //                     obj[id] = value
    //                 }
    //             }
    //         }

    //     })
    //     console.log(index, obj)
    //     return obj
    // }

    // const handleUpdateFuck = async (newData) => {
    //     for (let i = 0; i < 6; i++) {
    //         var batch = Firebase.firestore().batch()
    //         for (var j = 0; j < 10; j++) {

    //             var obj = getState(`${i}-${j}`, format, newData)
    //             obj.permit = ["TW"]
    //             var tagQuery = [], tags = {}
    //             _tag.forEach(key => {
    //                 obj[key] = []
    //                 obj.tag[key].forEach(id => {
    //                     var tag = key === 'brand' ? brands.data.find(i => i.id === id) : hashtags.data.find(i => i.id === id)
    //                     obj[key].push(id)
    //                     obj[key].push(JSON.stringify({
    //                         id: id,
    //                         displayName: tag.displayName
    //                     }))

    //                     tags[id] = tag.displayName

    //                     if (!tagQuery.includes(id)) {
    //                         tagQuery.push(id)
    //                     }
    //                 })
    //             })
    //             batch.set(Firebase.firestore().collection(_stock).doc(`${i}-${j}`), {
    //                 ...obj,
    //                 tagQuery: tagQuery,
    //                 tags: tags
    //             })
    //         }

    //         await batch.commit()
    //     }
    // }

    // invalid '~', '*', '/', '[', or ']'
    const handleUpdate = (newData) => {
        var path = `${_stock}/${newData.id}`
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`
        Promise.all(
            newData.images.filter(item => item.path).map(item => {
                return updateStorage(`${path}`, item.name, item)
            })
        ).then(results => {
            var d = Date.now(), tagQuery = [], tags = {}
            _tag.forEach(key => {
                newData[key] = []
                newData.tag[key].forEach(id => {
                    var tag = key === 'brand' ? brands.data.find(i => i.id === id) : hashtags.data.find(i => i.id === id)
                    newData[key].push(id)
                    newData[key].push(JSON.stringify({
                        id: id,
                        displayName: tag.displayName
                    }))

                    tags[id] = tag.displayName

                    if (!tagQuery.includes(id)) {
                        tagQuery.push(id)
                    }
                })
            })

            var obj = {
                ...newData,
                images: newData.images.map(item => results.find(res => res.name === item.name) || item),
                tagQuery: tagQuery,
                tags: tags,
                permit: newData.onlyTW ? ["TW"] : Object.keys(countriesList.countries).filter(item => !newData.ban.includes(item))
            }

            var index = _status.indexOf(newData.status)

            if (index !== 0 && newData.deduction && newData.quantity < 1) {
                obj.status = 'outOfStock';
            }

            if (newData.status !== _status[0]) {
                if (action.data) {
                    if (action.data.status === _status[0]) {
                        obj.sales = 0
                    }
                }
                obj.date = d
            }
            var change = getDifferent(obj, action.data)
            return updateFirestore(path, obj, false, change)
        })
            .then(() => {
                handleSnackbar(true, title)
            }).catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handleDelete = data => {
        var path = `${_stock}/${data.id}`
        var title = `${handleLabel('delete')} ${handleLabel(data.displayName)}`
        var change = getDifferent(null, data)
        Promise.all([
            deleteStorage(path),
            deleteFirestore(path, null, change)
        ]).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    const handleArrayDelete = () => {
        var title = `${handleLabel('delete')} ${action.data.length} ${handleLabel('product')}`

        Promise.all([
            action.data.map(item => {
                var path = `${_stock}/${item.id}`
                var change = getDifferent(null, item);
                return Promise.all([
                    deleteStorage(path),
                    deleteFirestore(path, null, change)
                ])
            })
        ]).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            handleSnackbar(false, title)
        })
    }

    const checkEmails = (snap, list) => {
        var users = snap.docs.map(doc => doc.data())
        var emails = users.map(user => {
            var lv = !!user.group && !!user.group.lv ? user.group.lv : 0

            var items = list.filter(item =>
                item.permit.includes(user.country) && item.lv <= lv
            ).map(item => ({
                code: item.code,
                displayName: handleLabel(item.displayName, user.language),
                status: handleLabel(item.status),
                imgUrl: !!item.images.length ? item.images[0].preview : null,
                url: `${window.location.origin}${ROUTES.LIST}/${item.id}`,
                button: handleLabel('buyNow', user.language)
            }))

            if (!items.length) {
                return null
            }
            return {
                from: APP_NAME,
                to: user.email,
                subject: handleLabel('emailStock', user.language),
                template: _stock,
                context: {
                    systemEmail: handleLabel('systemEmail', user.language),
                    items: items,
                    href: window.location.origin,
                    APP_NAME: APP_NAME,
                }
            }
        }).filter(email => !!email)

        if (!emails.length) {
            return handleSnackbar(true, handleLabel('emailSuccess'))
        } else {
            return handleEmails(emails).then(() => {
                handleSnackbar(true, handleLabel('emailSuccess'))
            })
        }
    }

    const handleNews = newData => {
        var ref = Firebase.firestore().collection(_user)
        var productList = action.data.filter(item => item.status !== 'disabled' && item.status !== 'outOfStock')

        if (newData.action === 'all') {
            ref = ref.where('news', '==', true)
        } else {
            var list = productList.reduce((a, c) => {
                a = a.concat(c.followers)
                return a
            }, []).filter((i, k, self) => self.indexOf(i) === k)

            ref = ref.where('id', 'in', list)
        }

        return ref.get().then(snap => {
            return checkEmails(snap, productList)
        })
    }

    const handleOrders = (bool) => {
        handleSnackbar(bool, handleLabel(bool ? 'emailSuccess' : 'error'))
    }

    return (
        <div className={classes.root}>
            <DataTable
                loading={loading}
                title={path}
                columns={columns}
                rows={rows}
                isDeletable={() => isDeletable}
                onDelete={handleDelete}
                actions={[
                    {
                        icon: AddBox,
                        disabled: !isEditable,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('product')}`)
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        position: 'row',
                        onClick: (event, rowData) => handleAction(rowData, 'update', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('watchTooltip'),
                        position: 'row',
                        onClick: (event, rowData) => handleAction(rowData, 'view', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Book,
                        tooltip: handleLabel('logTooltip'),
                        position: 'row',
                        onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                    },
                    {
                        icon: ContactSupport,
                        disabled: !isEditable,
                        tooltip: handleLabel('requestTooltip'),
                        position: 'row',
                        onClick: (event, rowData) => handleAction(rowData, 'request', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Email,
                        disabled: !isEditable,
                        tooltip: handleLabel('emailTooltip'),
                        onClick: (event, rowDatas) => handleAction(rowDatas, 'email', handleLabel('emailStock'))
                    },
                    {
                        icon: VerticalAlignTop,
                        disabled: !isEditable,
                        tooltip: handleLabel('topTooltip'),
                        onClick: (event, rowDatas) => handleTop(rowDatas)
                    },
                    {
                        icon: Event,
                        disabled: !isEditable,
                        tooltip: handleLabel('eventTooltip'),
                        onClick: (event, rowDatas) => handleAction(rowDatas, 'event', `${handleLabel('add')}${handleLabel('event')}`)
                    },
                    {
                        icon: DeleteOutline,
                        disabled: !isDeletable,
                        tooltip: handleLabel('deleteTooltip'),
                        onClick: (event, rowDatas) => handleAction(rowDatas, 'delete', handleLabel('alert'))
                    },
                ]}
                options={{
                    filtering: true,
                    selection: true,
                    selectionProps: rowData => ({
                        color: rowData.status === 'disabled' || rowData.status === 'outOfStock' || rowData.status === 'failed' ?
                            'secondary' : 'default'
                    }),
                    rowStyle: rowData => {
                        const { status } = rowData
                        var color

                        if (status === 'disabled') {
                            color = theme.palette.text.secondary
                        } else if (status === 'failed') {
                            color = theme.palette.error.dark
                        } else if (status === 'outOfStock') {
                            color = theme.palette.error.light
                        } else if (status === 'inStock') {
                            color = theme.palette.info.light
                        } else if (status === 'openingSoon') {
                            color = theme.palette.success.light
                        } else {
                            color = theme.palette.warning.main
                        }
                        return {
                            color: color
                        }
                    }
                }}
            />


            <Form
                open={
                    action.type === 'set' || action.type === 'update' || action.type === 'view'
                    || action.type === 'event' || action.type === 'email'
                }
                title={action.title}
                disabled={action.type === 'view'}
                format={format}
                oldState={action.data}
                onClose={handleClose}
                onSubmit={action.type === 'event' ? handleEvent : action.type === 'email' ? handleNews : handleUpdate}
            />

            <EmailDialog
                open={action.type === 'request'}
                title={action.title}
                data={action.type === 'request' && action.data}
                onClose={handleClose}
                onSubmit={handleOrders}
            />

            <DeleteAlert
                open={action.type === 'delete'}
                title={action.title}
                onSubmit={handleArrayDelete}
                onClose={handleClose}
            />
        </div>
    )
}

export default Stock;



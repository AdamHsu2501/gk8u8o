import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Chip } from '@material-ui/core'
import { Edit, Visibility, Book } from '@material-ui/icons';
import countriesList from 'countries-list'

import { _boolean, _address, _noImage } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery, updateStorage } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: "100%"
    }
}));

const useColumn = () => {
    const classes = useStyles()
    const { handleLabel, languages } = useFirebase()

    var lang = languages.map(item => ({
        title: item.native,
        field: `displayName.${item.id}`
    }))

    return [
        ...lang,
        {
            title: handleLabel('avatar'),
            field: 'images',
            render: rowData => (
                <img
                    src={rowData.images.length ? rowData.images[0].preview : _noImage}
                    onError={(e) => e.target.src = _noImage}
                    alt={rowData.id}
                    className={classes.img}
                />
            )
        },
        {
            title: handleLabel('paymentMethod'),
            field: 'method',
            render: rowData => rowData.method.map(id => (
                <Chip label={id} key={id} />
            ))
        },
        {
            title: handleLabel('enable'),
            field: 'enable',
            render: rowData => handleLabel(rowData.enable)
        }
    ];
}

function getFormat(handleLabel, exchangeRates, languages, payments) {

    return [
        {
            fieldType: 'file',
            id: 'images',
            label: handleLabel('images'),
            value: [],
            multiple: false,
            helper: handleLabel('dropzoneHelper')
        },
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `log${Date.now()}`,
        },
        {
            fieldType: 'text',
            id: 'type',
            label: handleLabel('type'),
            value: 'Home',
            options: [
                { value: 'CVS', label: handleLabel('CVS') },
                { value: 'Home', label: handleLabel('Home') }
            ]
        },
        {
            fieldType: 'text',
            id: 'international',
            label: handleLabel('international'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
        {
            fieldType: 'select',
            id: 'method',
            label: handleLabel('paymentMethod'),
            value: [],
            multiple: true,
            options: payments,
            getOptionLabel: opt => handleLabel(opt.displayName),
            getValue: opt => opt.id,
            sm: 12
        },
        {
            fieldType: 'title',
            id: 'displayName',
            label: handleLabel('displayName'),
            children: languages.map(item => ({
                fieldType: 'text',
                required: item.default,
                id: item.id,
                label: item.native,
                value: ''
            }))
        },
        {
            fieldType: 'title',
            id: 'sender',
            label: handleLabel('sender'),
            children: _address.map(item => {
                if (item.id === 'country') {
                    return ({
                        fieldType: 'select',
                        id: item.id,
                        label: handleLabel(item.id),
                        required: item.required,
                        value: null,
                        multiple: false,
                        options: Object.keys(countriesList.countries).map(key => {
                            var obj = countriesList.countries[key]
                            return {
                                value: key,
                                label: `${obj.native} (${obj.name})`
                            }
                        }),
                        getOptionLabel: opt => opt.label,
                        getValue: opt => opt.value,
                    })
                } else if (item.id === 'phone') {
                    return ({
                        fieldType: 'text',
                        id: item.id,
                        label: handleLabel(item.id),
                        helperText: handleLabel('senderPhoneHelper'),
                        required: item.required,
                        value: '',
                        type: 'tel'
                    })
                } else {
                    return ({
                        fieldType: 'text',
                        id: item.id,
                        label: handleLabel(item.id),
                        helperText: !!item.helper && handleLabel(item.helper),
                        required: item.required,
                        value: '',
                    })
                }
            })
        },
        {
            fieldType: 'title',
            id: 'spec',
            label: handleLabel('specification'),
            children: [
                {
                    fieldType: 'text',
                    id: 'type',
                    label: handleLabel('type'),
                    value: 'less',
                    options: [
                        { value: 'less', label: handleLabel('less') },
                        { value: 'lessOrEqual', label: handleLabel('lessOrEqual') }
                    ],
                },
                {
                    fieldType: 'number',
                    id: 'formula',
                    label: handleLabel('volumetricWeightformula'),
                    value: 5000,
                    startAdornment: handleLabel('volumetricWeightformulaHelper'),
                },
                {
                    fieldType: 'number',
                    id: 'weight',
                    label: handleLabel('weight'),
                    value: 0.0,
                    endAdornment: 'kg',
                },
                {
                    fieldType: 'number',
                    id: 'sumLength',
                    label: handleLabel('sumLength'),
                    value: 0,
                    endAdornment: 'cm',
                },
                {
                    fieldType: 'number',
                    id: 'maxLength',
                    label: handleLabel('maxLength'),
                    value: 0,
                    endAdornment: 'cm',
                },
                {
                    fieldType: 'number',
                    id: 'maxSize',
                    label: handleLabel('maxSize'),
                    value: 0,
                    endAdornment: 'cm³',
                },
                {
                    fieldType: 'number',
                    id: 'maxAmount',
                    label: handleLabel('maxAmount'),
                    value: 0,
                    currency: exchangeRates,
                    allowEmptyFormatting: false,
                    thousandSeparator: true,
                }
            ]
        },
        {
            fieldType: 'event',
            id: 'rates',
            label: handleLabel('postageRates'),
            value: [],
            list: [
                {
                    fieldType: 'number',
                    id: 'weight',
                    label: handleLabel('volumetricWeight'),
                    value: 0.0,
                    startAdornment: handleLabel('volumetricWeightLimit'),
                    endAdornment: 'kg',
                    sm: 4,
                },
                {
                    fieldType: 'number',
                    id: 'fee',
                    label: handleLabel('shippingFee'),
                    value: 0,
                    currency: exchangeRates,
                    allowEmptyFormatting: false,
                    thousandSeparator: true,
                    sm: 4,
                },
                {
                    fieldType: 'number',
                    id: 'offFee',
                    label: handleLabel('offshoreIslandsFee'),
                    value: 0,
                    currency: exchangeRates,
                    allowEmptyFormatting: false,
                    thousandSeparator: true,
                    sm: 4,
                },
            ]
        },
        {
            fieldType: 'text',
            id: 'enable',
            label: handleLabel('enable'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
    ]
}
const Shipping = ({ path }) => {
    const theme = useTheme();
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, exchangeRates, languages, handleLabel, updateFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const logistics = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/logistics'),
        type: 'array',
        sort: 'international'
    })
    const payments = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/payment'),
        type: 'array'
    })
    const loading = logistics.loading || payments.loading
    const rows = logistics.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, exchangeRates, languages, payments.data)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`

        Promise.all(
            newData.images.filter(item => item.path).map(item => {
                return updateStorage(`${ref}/${newData.id}`, newData.id, item)
            })
        ).then(results => {
            var obj = {
                ...newData,
                images: !results.length ? newData.images : results,
            }

            var change = getDifferent(obj, action.data)

            return updateFirestore(ref, { [newData.id]: obj }, true, change)
        }).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    return (
        <Grid container>
            <DataTable
                loading={loading}
                title={path}
                columns={columns}
                rows={rows}
                isDeletable={() => isDeletable}
                actions={[
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'update', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'view', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Book,
                        tooltip: handleLabel('logTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                    },
                ]}

                options={{
                    rowStyle: rowData => ({ color: rowData.enable ? theme.palette.text.primary : theme.palette.error.main })
                }}
            />

            <Form
                open={!!action.type}
                title={action.title}
                disabled={action.type === 'view'}
                format={format}
                oldState={action.data}
                onClose={handleClose}
                onSubmit={handleUpdate}
            />
        </Grid>
    )
}

export default Shipping;
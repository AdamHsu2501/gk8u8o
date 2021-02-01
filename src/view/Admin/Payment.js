import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Chip } from '@material-ui/core'
import { Edit, Visibility, Book } from '@material-ui/icons';

import { _boolean, _noImage } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery, updateStorage } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: '100%'
    }
}));

const useColumn = () => {
    const classes = useStyles();
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
            title: handleLabel('currency'),
            field: 'currecny',
            render: rowData => rowData.currency.map((id, key) => (
                <Chip key={key} label={id} />
            ))
        },
        {
            title: handleLabel('enable'),
            field: 'enable',
            render: rowData => handleLabel(rowData.enable)
        }
    ];
}

function getFormat(handleLabel, exchangeRates, languages) {

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
            value: `pay${Date.now()}`,
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
            fieldType: 'text',
            id: 'collection',
            label: handleLabel('collection'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
        {
            fieldType: 'select',
            id: 'currency',
            label: handleLabel('currency'),
            value: [],
            multiple: true,
            options: Object.keys(exchangeRates).map(key => ({ value: key, label: key })),
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
        },
        {
            fieldType: 'text',
            id: 'remittanceAccount',
            label: handleLabel('remittanceAccount'),
            value: '',
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

const Payment = ({ path }) => {
    const theme = useTheme()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, exchangeRates, languages, handleLabel, updateFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const payments = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/payment'),
        type: 'array'
    })
    const loading = payments.loading
    const rows = payments.data || []
    var columns = useColumn()
    var format = getFormat(handleLabel, exchangeRates, languages)

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
        <div>
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
        </div>
    )
}

export default Payment;
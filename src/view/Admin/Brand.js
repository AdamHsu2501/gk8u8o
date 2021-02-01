import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _noImage } from '../../variables/Values'
import Firebase, { useFirebase, handleTags, useFirestoreQuery, updateStorage, deleteStorage } from '../../Firebase';
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

    var arr = languages.map(item => ({
        title: item.native, field: `displayName.${item.id}`
    }))

    return [
        ...arr,
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
        { title: handleLabel('sort'), field: 'sort', type: 'numeric' },
    ];
}

function getFormat(handleLabel, languages, rows) {

    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `bnd${Date.now()}`,
        },
        {
            fieldType: 'file',
            id: 'images',
            label: handleLabel('image'),
            helperText: handleLabel('dropzoneHelper'),
            value: [],
            multiple: false,
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
            fieldType: 'number',
            id: 'sort',
            label: handleLabel('sort'),
            value: rows.length + 1,
        },
    ]
}

const Brand = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const brands = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/brand'),
        type: 'array',
        sort: 'sort'
    })
    const loading = brands.loading
    const rows = brands.data || []
    var columns = useColumn();
    var format = getFormat(handleLabel, languages, rows)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`
        var type = action.type

        if (type === 'update') {
            handleTags(true, {
                ...newData,
                attribute: ['brand']
            })
        }

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

    const handleDelete = data => {
        var title = `${handleLabel('delete')} ${handleLabel(data.displayName)}`
        var change = getDifferent(null, data)

        handleTags(false, {
            ...data,
            attribute: ['brand']
        })

        Promise.all([
            deleteStorage(`${ref}/${data.id}`),
            deleteFirestore(ref, data.id, change)
        ]).then(() => {
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
                onDelete={handleDelete}
                actions={[
                    {
                        icon: AddBox,
                        disabled: !isEditable || rows.length >= 100,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('brand')}`)
                    },
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

export default Brand;
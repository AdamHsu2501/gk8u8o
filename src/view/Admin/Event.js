import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _noImage } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery, updateStorage, deleteStorage } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: '100%'
    },
}));

const useColumn = () => {
    const classes = useStyles();
    const { handleLabel } = useFirebase()

    return [
        {
            title: handleLabel('avatar'),
            field: 'images',
            render: rowData => {
                if (rowData.images.length) {
                    return (
                        <img
                            src={rowData.images[0].preview}
                            onError={(e) => e.target.src = _noImage}
                            alt={rowData.id}
                            className={classes.img}
                        />
                    )
                } else {
                    return null
                }
            }
        },
        { title: handleLabel('pathname'), field: 'pathname' },
        { title: handleLabel('sort'), field: 'sort', type: 'numeric' },
    ];
}

function getFormat(handleLabel, rows) {
    const origin = window.location.origin
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `evt${Date.now()}`,
        },
        {
            fieldType: 'file',
            id: 'images',
            label: handleLabel('images'),
            value: [],
            multiple: false,
            helperText: handleLabel('dropzoneHelper')
        },
        {
            fieldType: 'number',
            id: 'sort',
            label: handleLabel('sort'),
            value: rows.length + 1,
        },
        {
            fieldType: 'text',
            id: 'pathname',
            required: true,
            label: handleLabel('pathname'),
            value: "",
            startAdornment: `${origin}/`,
            sm: 12
        },
    ]
}

const Event = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const events = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/event'),
        type: 'array',
        sort: 'sort'
    })
    const loading = events.loading
    const rows = events.data || []
    var columns = useColumn();
    var format = getFormat(handleLabel, rows)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${newData.id}`

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
        var title = `${handleLabel('delete')} ${data.id}`
        var change = getDifferent(null, data)

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
                        onClick: (event) => handleAction(null, 'add', `${handleLabel('add')}${handleLabel('event')}`)
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'update', rowData.id)
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'view', rowData.id)
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

export default Event;
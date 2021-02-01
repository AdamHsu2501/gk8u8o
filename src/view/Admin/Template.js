import React from 'react';
import { Typography } from '@material-ui/core';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import Firebase, { useFirebase, _template, useFirestoreQuery } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { handleLabel } = useFirebase()

    return [
        { title: handleLabel('displayName'), field: 'displayName' },
        {
            title: handleLabel('text'),
            field: 'text',
            render: rowData => {
                const { text } = rowData
                return (
                    <Typography>
                        {text.length > 50 ? text.substring(0, 50).concat('...') : rowData.text}
                    </Typography>
                )
            }
        }
    ]
}

function getFormat(handleLabel) {
    var d = Date.now();

    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `temp${d}`,
        },
        {
            fieldType: 'text',
            id: 'displayName',
            label: handleLabel('displayName'),
            value: '',
            sm: 12,
        },
        {
            fieldType: 'text',
            id: 'text',
            label: handleLabel('text'),
            helperText: handleLabel('textHelper'),
            value: '',
            multiline: true,
            rows: 5,
            rowsMax: 10,
            sm: 12
        },
    ]
}

const Template = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const templates = useFirestoreQuery({ ref: Firebase.firestore().collection(_template) })
    const loading = templates.loading
    const rows = templates.data || []
    var columns = useColumn();
    var format = getFormat(handleLabel)

    const handleUpdate = (newData) => {
        var path = `${_template}/${newData.id}`
        var title = `${handleLabel('update')} ${newData.displayName}`
        var change = getDifferent(newData, action.data)

        updateFirestore(path, newData, true, change).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    const handleDelete = data => {
        var path = `${_template}/${data.id}`
        var title = `${handleLabel('delete')} ${data.displayName}`
        var change = getDifferent(null, data)

        deleteFirestore(path, null, change).then(() => {
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
                        disabled: !isEditable,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('template')}`)
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

export default Template;
import React, { useCallback } from 'react';
import { Chip } from '@material-ui/core';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _tag } from '../../variables/Values';
import Firebase, { useFirebase, handleTags, useFirestoreQuery } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { languages, handleLabel } = useFirebase()
    return languages.map(item => ({
        title: item.native,
        field: `displayName.${item.id}`
    })).concat({
        title: handleLabel('attribute'),
        field: 'attribute',
        render: rowData => rowData.attribute.map((id, key) => (
            <Chip
                key={key}
                label={id}
            />
        ))
    })
}

function getFormat(languages, handleLabel) {
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `tag${Date.now()}`,
        },
        {
            fieldType: 'title',
            id: 'displayName',
            label: handleLabel('tagName'),
            children: languages.map(item => ({
                fieldType: 'text',
                required: item.default,
                id: item.id,
                label: item.native,
                value: ''
            }))
        },
        {
            fieldType: 'select',
            id: 'attribute',
            label: handleLabel('attribute'),
            helperText: handleLabel('permitHelper'),
            value: [],
            multiple: true,
            options: _tag.filter(item => item !== 'brand').map(item => (
                { value: item, label: handleLabel(item) }
            )),
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
            sm: 12,
        },

    ]
}

const Tag = ({ path }) => {
    const { action, setAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const tags = useFirestoreQuery({ ref: Firebase.firestore().collection('tag') });
    const loading = tags.loading
    const rows = loading ? [] : tags.data.sort((a, b) => (
        _tag.findIndex(id => id === a.attribute[0]) - _tag.findIndex(id => id === b.attribute[0])
    ))
    var columns = useColumn();
    var format = getFormat(languages, handleLabel)

    const handleAction = useCallback((id, type, titel) => {
        var data = type === 'log' ? id : rows.find(item => item.id === id)

        setAction({
            data: data,
            type: type,
            title: titel,
        })
    }, [rows, setAction])

    const handleUpdate = (newData) => {
        var path = `tag/${newData.id}`
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`
        var data = {
            ...newData,
            attribute: newData.attribute.sort((a, b) => _tag.indexOf(a) - _tag.indexOf(b))
        }
        var change = getDifferent(data, action.data)

        var type = action.type
        if (type === 'update') {
            handleTags(true, newData)
        }

        updateFirestore(path, data, false, change)
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handleDelete = data => {
        var path = `tag/${data.id}`
        var title = `${handleLabel('delete')} ${handleLabel(data.displayName)}`
        var change = getDifferent(null, data)

        Promise.all([
            handleTags(false, data),
            deleteFirestore(path, null, change)
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
                rows={rows.map(item => {
                    return {
                        ...item,
                        attribute: !item.attribute.length ? [handleLabel('all')] : item.attribute.map(id => handleLabel(id))
                    }
                })}
                isDeletable={() => isDeletable}
                onDelete={handleDelete}
                actions={[
                    {
                        icon: AddBox,
                        disabled: !isEditable,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('tag')}`)
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'update', handleLabel(rowData.displayName))
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'view', handleLabel(rowData.displayName))
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

export default Tag
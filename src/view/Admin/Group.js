import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _groupTypes, _level } from '../../variables/Values';
import Firebase, { useFirebase, useFirestoreQuery, handleGroups } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { handleLabel, languages } = useFirebase()

    var langs = languages.map(item => ({
        title: item.native,
        field: `displayName.${item.id}`
    }))

    return [
        ...langs,
        { title: handleLabel('type'), field: 'type', lookup: _groupTypes.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {}) },
        {
            title: handleLabel('percent'),
            field: 'percent',
            type: 'numeric',
            render: rowData => <div>{rowData.percent}%</div>
        },
        { title: handleLabel('lv'), field: 'lv', type: 'numeric' }
    ]
}

function getFormat(handleLabel, languages, brands) {
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `grp${Date.now()}`,
        },
        {
            fieldType: 'text',
            id: 'type',
            label: handleLabel('type'),
            required: true,
            value: _groupTypes[0],
            options: _groupTypes.map((item) => (
                { value: item, label: handleLabel(item) }
            ))
        },
        {
            fieldType: 'select',
            id: 'brand',
            label: handleLabel('brand'),
            value: null,
            multiple: false,
            options: brands,
            getOptionLabel: opt => handleLabel(opt.displayName),
            getValue: opt => ({
                id: opt.id,
                displayName: opt.displayName
            }),
            filter: {
                id: 'type',
                operator: '===',
                value: 'vendor'
            }
        },
        {
            fieldType: 'text',
            id: 'lv',
            label: handleLabel('lv'),
            value: 0,
            options: _level.map(item => (
                { value: item, label: item }
            ))
        },
        {
            fieldType: 'number',
            id: 'percent',
            label: handleLabel('percent'),
            value: 0,
            endAdornment: '%',
        },
        {
            fieldType: 'title',
            id: 'displayName',
            label: handleLabel('groupName'),
            children: languages.map(item => ({
                fieldType: 'text',
                required: item.default,
                id: item.id,
                label: item.native,
                value: ''
            }))
        },
    ]
}

const Group = ({ path }) => {
    const theme = useTheme()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const groups = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/group'),
        type: 'array',
    })
    const brands = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/brand'),
        type: 'array',
        sort: 'order'
    })
    const loading = groups.loading || brands.loading
    const rows = groups.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, languages, brands.data)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`
        var data = {
            [newData.id]: newData,
        }
        var type = action.type;
        var change = getDifferent(newData, action.data)

        if (type === 'update') {
            handleGroups(true, newData)
        }

        updateFirestore(ref, data, true, change).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    const handleDelete = data => {
        var title = `${handleLabel('delete')} ${handleLabel(data.displayName)}`
        var change = getDifferent(null, data)

        return Promise.all([
            handleGroups(false, data),
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
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('group')}`)
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
                options={{
                    rowStyle: rowData => {
                        const { type } = rowData
                        if (type === 'user') {
                            return { color: theme.palette.text.primary }
                        } else if (type === 'dealer') {
                            return { color: theme.palette.info.light }
                        } else {
                            return { color: theme.palette.warning.main }
                        }
                    }
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

export default Group;
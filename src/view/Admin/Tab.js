import React from 'react';
import countriesList from 'countries-list'
import { Typography, Chip } from '@material-ui/core';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _tag } from '../../variables/Values';
import Firebase, { useFirebase, useFirestoreQuery } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { handleLabel, languages } = useFirebase()

    var lang = languages.map(item => ({
        title: item.native,
        field: `tag.displayName.${item.id}`,
        filtering: false
    }))

    var attribute = _tag.reduce((a, c) => {
        return { ...a, [c]: handleLabel(c) }
    }, { null: handleLabel('all') })
    return [
        ...lang,
        {
            title: handleLabel('attribute'),
            field: 'attribute',
            lookup: attribute,
        },
        {
            title: handleLabel('permit'),
            field: 'permit',
            filtering: false,
            render: (rowData) => !rowData.permit.length ? (
                <Typography>{handleLabel('all')}</Typography>
            ) : (
                    rowData.permit.map((id, key) => {
                        var country = countriesList.countries[id]
                        return (
                            <Chip key={key} label={`${country.native}(${country.name})`} />

                        )
                    })
                )
        },
        { title: handleLabel('sort'), field: 'sort', filtering: false, type: 'numeric' },
    ];
}

function getFormat(handleLabel, tags, rows) {
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `tab${Date.now()}`,
        },
        {
            fieldType: 'select',
            id: 'tag',
            label: handleLabel('tag'),
            required: true,
            value: null,
            multiple: false,
            options: tags,
            getOptionLabel: opt => handleLabel(opt.displayName),
            getValue: opt => ({
                id: opt.id,
                displayName: opt.displayName
            }),
        },
        {
            fieldType: 'select',
            id: 'attribute',
            label: handleLabel('attribute'),
            helperText: handleLabel('permitHelper'),
            value: null,
            multiple: false,
            options: _tag.filter(item => item !== 'brand').map(item => ({
                id: item,
                label: handleLabel(item)
            })),
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.id,
        },
        {
            fieldType: 'select',
            id: 'permit',
            label: handleLabel('permit'),
            value: [],
            helperText: handleLabel('permitHelper'),
            multiple: true,
            options: Object.keys(countriesList.countries).map(key => {
                var obj = countriesList.countries[key]
                return ({
                    value: key,
                    label: `${obj.native} (${obj.name})`
                })
            }),
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
        },
        {
            fieldType: 'number',
            id: 'sort',
            label: handleLabel('sort'),
            value: rows.length + 1,
        },
    ]
}

const Tab = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const tabs = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/tab'),
        type: 'array',
        sort: 'sort'
    })
    const tags = useFirestoreQuery({ ref: Firebase.firestore().collection('tag') });
    const loading = tabs.loading || tags.loading
    const rows = tabs.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, tags.data, rows)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${newData.id}`
        var data = {
            [newData.id]: newData,
        }
        var change = getDifferent(newData, action.data)

        updateFirestore(ref, data, true, change).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    const handleDelete = data => {
        var title = `${handleLabel('delete')} ${data.id}`
        var change = getDifferent(null, data)

        deleteFirestore(ref, data.id, change).then(() => {
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
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('tab')}`)
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
                options={{
                    filtering: true,
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

export default Tab;
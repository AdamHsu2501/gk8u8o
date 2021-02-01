import React from 'react';
import countriesList from 'countries-list'
import { useTheme } from '@material-ui/core/styles';
import { Typography, Chip } from '@material-ui/core';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _boolean } from '../../variables/Values'
import { useFirebase } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { handleLabel } = useFirebase()

    return [
        { title: handleLabel('MOQ'), field: 'MOQ' },
        {
            title: handleLabel('percent'),
            field: 'percent',
            render: rowData => <div>{rowData.percent}%</div>
        },
        {
            title: handleLabel('ban'),
            field: 'ban',
            render: (rowData) => rowData.ban.map((id, key) => {
                return <Chip key={key} label={countriesList.countries[id].native} />
            })
        },
        {
            title: handleLabel('enable'),
            field: 'enable',
            render: (rowData) => <Typography>{handleLabel(rowData.enable)}</Typography>
        },
    ];
}

function getFormat(handleLabel) {
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `dis${Date.now()}`,
        },
        {
            fieldType: 'text',
            id: 'enable',
            label: handleLabel('enable'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
        {
            fieldType: 'select',
            id: 'ban',
            label: handleLabel('ban'),
            value: [],
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
            id: 'MOQ',
            label: handleLabel('MOQ'),
            value: 0,
        },
        {
            fieldType: 'number',
            id: 'percent',
            label: handleLabel('percent'),
            value: 0,
            endAdornment: '%',
        },
    ]
}

const Discount = ({ path }) => {
    const theme = useTheme()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, discounts, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    // const discounts = useFirestoreQuery({
    //     ref: Firebase.firestore().doc('system/discount'),
    //     type: 'array',
    //     sort: 'MOQ'
    // })
    // const loading = discounts.loading
    const rows = discounts //discounts.data || []
    var columns = useColumn();
    var format = getFormat(handleLabel)

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
                // loading={loading}
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
                        onClick: (event) => handleAction(null, 'add', `${handleLabel('add')}${handleLabel('discount')}`)
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

export default Discount;
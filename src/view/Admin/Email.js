import React, { useCallback } from 'react';
import { Chip } from '@material-ui/core'
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';
import countriesList from 'countries-list'

import { _locale } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery, _user } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import SearchCard from '../../components/Card/SearchCard'
import { useAdmin } from '../../layout/Admin'

const useColumn = () => {
    const { handleLabel } = useFirebase()

    return [
        { title: handleLabel('email'), field: 'email' },
        {
            title: handleLabel('emailOrder'),
            field: 'order',
            render: rowData => rowData.order.map((item, key) => (
                <Chip key={key} variant="outlined" label={item} />
            ))
        },
        {
            title: handleLabel('orderMsg'),
            field: 'orderMsg',
            render: rowData => rowData.orderMsg.map((item, key) => (
                <Chip key={key} variant="outlined" label={item} />
            ))
        },
        {
            title: handleLabel('emailComment'),
            field: 'comment',
            render: rowData => rowData.comment.map((item, key) => (
                <Chip key={key} label={item} />
            ))
        }
    ]
}

function getFormat(handleLabel, languages, users) {
    var options = languages.map(item => (
        { value: item.id, label: item.native }
    ))
    return [
        {
            fieldType: 'select',
            id: 'email',
            label: handleLabel('email'),
            required: true,
            value: null,
            multiple: false,
            options: users,
            renderOption: opt => <SearchCard avatar={opt.photoURL} primary={opt.displayName} secondary={opt.email} />,
            getOptionLabel: opt => opt.email,
            getValue: opt => opt.email,
        },
        {
            fieldType: 'select',
            id: 'order',
            label: handleLabel('emailOrder'),
            value: [],
            multiple: true,
            options: _locale.map(item => (
                { value: item, label: item === 'others' ? handleLabel(item) : countriesList.countries[item].native }
            )),
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
        },
        {
            fieldType: 'select',
            id: 'orderMsg',
            label: handleLabel('orderMsg'),
            value: [],
            multiple: true,
            options: options,
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
        },
        {
            fieldType: 'select',
            id: 'comment',
            label: handleLabel('emailComment'),
            value: [],
            multiple: true,
            options: options,
            getOptionLabel: opt => opt.label,
            getValue: opt => opt.value,
        },
    ]
}


const Email = ({ path }) => {
    const { action, setAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const emails = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/email'),
        type: 'array'
    })

    const users = useFirestoreQuery({ ref: Firebase.firestore().collection(_user).where('admin', '>', 0) })
    const loading = emails.loading || users.loading
    const rows = emails.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, languages, users.data.filter(user => !rows.find(item => item.id === user.id)))
    var langObj = languages.reduce((a, c) => {
        return {
            ...a,
            [c.id]: c.native
        }
    }, {})

    const handleAction = useCallback((id, type, titel) => {

        var data = type === 'log' ? id : rows.find(item => item.id === id)
        setAction({
            data: data,
            type: type,
            title: titel,
        })
    }, [rows, setAction])

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${newData.email}`

        var user = users.data.find(item => item.email === newData.email)
        var data = {
            ...newData,
            id: user.id,
        }
        var change = getDifferent(data, action.data)

        updateFirestore(ref, { [user.id]: data }, true, change)
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                alert(error)
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }


    const handleDelete = data => {
        var title = `${handleLabel('update')} ${data.email}`
        var change = getDifferent(null, data)


        return deleteFirestore(ref, data.id, change)
            .then(() => {
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
                rows={rows.map(item => ({
                    ...item,
                    order: item.order.map(id => id === 'others' ? handleLabel('others') : countriesList.countries[id].native),
                    orderMsg: item.orderMsg.map(id => langObj[id]),
                    comment: item.comment.map(id => langObj[id])
                }))}
                isDeletable={() => isDeletable}
                onDelete={handleDelete}
                actions={[
                    {
                        icon: AddBox,
                        disabled: !isEditable,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', handleLabel('add'))
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'update', rowData.email)
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'view', rowData.email)
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

export default Email;
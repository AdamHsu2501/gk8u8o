import React from 'react';
import { Avatar } from '@material-ui/core'
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import * as ROUTES from '../../routes'
import Firebase, { useFirebase, _user, useFirestoreQuery } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm'
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'
import SearchCard from '../../components/Card/SearchCard'

const useColumn = () => {
    const { handleLabel } = useFirebase()

    return [
        {
            title: handleLabel('avatar'),
            field: 'photoURL',
            render: rowData => (
                <Avatar alt={rowData.email} src={rowData.photoURL} />
            )
        },
        { title: handleLabel('email'), field: 'email' },
        { title: handleLabel('displayName'), field: 'displayName' },
    ]
}

const convert = (data) => {
    if (!data) {
        return data
    }
    return {
        user: data,
        permission: data.permission
    }
}

var getCheckboxOptions = list => {
    return list.reduce((a, c) => {
        return {
            ...a,
            [c]: false
        }
    }, {})
}

function getFormat(handleLabel, action, users) {
    return [
        {
            fieldType: 'select',
            id: 'user',
            required: true,
            disabled: action === 'update',
            label: handleLabel(action === 'set' ? 'user' : 'administrator'),
            value: null,
            multiple: false,
            renderOption: opt => <SearchCard avatar={opt.photoURL} primary={opt.displayName} secondary={opt.email} />,
            getOptionLabel: opt => opt.email,
            getValue: opt => opt,
            options: action === 'set' ? [] : users,
            dbRef: Firebase.firestore().collection(_user).where('admin', '==', 0),
            sm: 12,
        },
        {
            id: 'permission',
            label: handleLabel('permission'),
            checkbox: true,
            children: ROUTES.adminRoutes.reduce((a, c) => {
                if (c.children) {
                    c.children.forEach(item => {
                        a.push({
                            fieldType: 'checkbox',
                            id: item.id,
                            label: handleLabel(item.id),
                            value: getCheckboxOptions(item.permission),
                        })
                    })
                }
                else {
                    a.push({
                        fieldType: 'checkbox',
                        id: c.id,
                        label: handleLabel(c.id),
                        value: getCheckboxOptions(c.permission),
                    })
                }
                return a
            }, []),
            filter: {
                id: 'user',
                operator: '!==',
                value: null
            }
        }
    ]
}

const Administrator = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, updateFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const users = useFirestoreQuery({ ref: Firebase.firestore().collection(_user).where('admin', '>', 0) })
    const loading = users.loading
    const rows = users.data || []
    var columns = useColumn();
    var format = getFormat(handleLabel, action.type, rows)

    const handleUpdate = (newData) => {
        var data = {
            ...newData.user,
            admin: 1,
            permission: newData.permission
        }

        var path = `${_user}/${data.id}`
        var title = `${handleLabel('update')} ${handleLabel('administrator')} ${data.email}`

        var change = getDifferent(data, action.data)

        updateFirestore(path, data, false, change)
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                alert(error)
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handleDelete = oldData => {
        var path = `${_user}/${oldData.id}`
        var title = `${handleLabel('delete')} ${handleLabel('administrator')} ${oldData.email}`

        var data = {
            ...oldData,
            admin: 0,
            permission: null,
        }

        if (!!data.tableData) {
            delete data.tableData
        }

        var change = getDifferent(data, action.data)

        updateFirestore(path, data, false, change)
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                alert(error)
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
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')} ${handleLabel('administrator')}`)
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'update', rowData.email)
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'view', rowData.email)
                    },
                    {
                        icon: Book,
                        tooltip: handleLabel('logTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                    },
                ]}
            />

            <Form
                open={!!action.type && action.type !== 'log'}
                title={action.title}
                disabled={action.type === 'view'}
                format={format}
                oldState={convert(action.data)}
                onClose={handleClose}
                onSubmit={handleUpdate}
            />
        </div>
    )
}

export default Administrator;
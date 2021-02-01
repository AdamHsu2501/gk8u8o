import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Typography, Avatar, Chip } from '@material-ui/core';
import { Edit, Settings, Visibility, Book } from '@material-ui/icons';

import { _msgStatus, _boolean } from '../../../variables/Values';
import Firebase, { useFirebase, _message, _template, useFirestoreQuery, deleteStorage } from '../../../Firebase';
import DataTable from '../../../components/Table/DataTable';
import { getDifferent } from '../../../utils/getDifferent';
import TextField from '../../../components/Field/TextField'
import Form from '../../../components/Form/UpdateForm'
import { useAdmin } from '../../../layout/Admin'
import MessageForm from '../../../components/Form/MessageForm'

const useStyles = makeStyles(theme => ({
    content: {
        wordBreak: 'break-all',
    },
    img: {
        width: 60
    },
    margin: {
        marginRight: theme.spacing(1)
    }
}));

const useColumn = (status) => {
    const classes = useStyles()
    const { languages, handleLabel } = useFirebase()

    const lang = languages.reduce((a, c) => {
        return {
            ...a,
            [c.id]: c.native
        }
    }, {})

    return [
        {
            title: handleLabel('date'),
            field: 'date',
            filtering: false,
            render: rowData => {
                var d = new Date(rowData.create)
                return `${d.toLocaleString()} (${handleLabel(d.getDay())})`
            }
        },
        {
            title: handleLabel('user'),
            field: 'user.displayName',
            filtering: false,
            render: rowData => (
                <Avatar alt={rowData.user.displayName} src={rowData.messages[0].photoURL} />
            )
        },
        {
            title: handleLabel('message'),
            field: '',
            filtering: false,
            render: rowData => {
                var arr = rowData.messages.filter(item => !item.admin)
                if (!arr.length) {
                    return null
                } else {
                    var obj = arr[arr.length - 1]
                    return (
                        <Typography className={classes.content}>
                            {obj.text}
                        </Typography>
                    )
                }
            }
        },
        {
            title: handleLabel('type'),
            field: 'type',
            lookup: {
                order: handleLabel('order'),
                product: handleLabel('product'),
                comment: handleLabel('comment')
            }
        },
        {
            title: handleLabel('language'),
            field: 'language',
            lookup: lang,
        },
        {
            title: handleLabel('status'),
            field: 'status',
            lookup: status.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {})
        },
        {
            title: handleLabel('public'),
            field: 'public',
            lookup: _boolean.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {})
        }
    ];
}


function getFormat(handleLabel) {
    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: '',
        },
        {
            fieldType: 'text',
            id: 'public',
            label: handleLabel('public'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
        {
            fieldType: 'text',
            id: 'status',
            label: handleLabel('status'),
            value: _msgStatus[0],
            options: _msgStatus.map((item) => ({ value: item, label: handleLabel(item) }))
        },
        {
            fieldType: 'text',
            id: 'remark',
            label: handleLabel('remark'),
            value: '',
            multiline: true,
            rows: 3,
            rowsMax: 5,
            sm: 12
        },

    ]
}

const Message = ({ path }) => {
    const theme = useTheme()
    const classes = useStyles()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const [status, setStatus] = useState(_msgStatus[0])
    var value = status === _msgStatus[0] ? _msgStatus.slice(0, 2) : [status]
    const messages = useFirestoreQuery({
        ref: Firebase.firestore().collection(_message).orderBy('update', 'desc').where('status', 'in', value),
    })

    const templates = useFirestoreQuery({ ref: Firebase.firestore().collection(_template) })
    const loading = messages.loading || templates.loading
    const rows = messages.data || []
    var columns = useColumn(value);
    var format = getFormat(handleLabel);

    const handleChange = (id, value, parentId) => {
        setStatus(value)
    }

    const handleUpdate = (newData) => {
        var ref = `${_message}/${action.data.id}`
        var title = `${handleLabel('update')} ${action.data.id}`
        var change = getDifferent(newData, action.data)

        return updateFirestore(ref, newData, true, change)
            .then(() => {
                handleSnackbar(true, title)
            }).catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handleDelete = data => {
        var ref = `${_message}/${data.id}`
        var title = `${handleLabel('delete')} ${data.id}`
        var change = getDifferent(null, data)

        Promise.all([
            deleteStorage(ref),
            deleteFirestore(ref, null, change)
        ]).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    var displayName
    if (action.data) {
        const { type, target } = action.data
        if (type === 'product') {
            displayName = `(${target.code}) ${handleLabel(target.displayName)}`
        } else if (type === 'order') {
            displayName = `${handleLabel('orderNo')} ${action.data.id}`
        } else {
            displayName = `${handleLabel('message')} ${action.data.id}`
        }
    }

    return (
        <Grid container>
            <Grid item xs={6} sm={4}>
                <TextField
                    id='status'
                    label={handleLabel('status')}
                    value={status}
                    onChange={handleChange}
                    options={_msgStatus.filter(id => id !== 'replied').map(item => (
                        { value: item, label: handleLabel(item) })
                    )}
                />
            </Grid>

            <DataTable
                loading={loading}
                title={path}
                columns={columns}
                rows={rows}
                isDeletable={() => isDeletable}
                onDelete={handleDelete}
                actions={[
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'update')
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'view')
                    },
                    {
                        icon: Book,
                        tooltip: handleLabel('logTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                    },
                    {
                        icon: Settings,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'setting', handleLabel('settingTooltip'))
                    },
                ]}

                options={{
                    filtering: true,
                    rowStyle: rowData => ({
                        color: rowData.status === 'pending' ? theme.palette.warning.main : theme.palette.text.primary
                    })
                }}
            />

            <Form
                open={action.type === 'setting'}
                title={action.title}
                format={format}
                oldState={action.data}
                onClose={handleClose}
                onSubmit={handleUpdate}
            />

            <MessageForm
                open={action.type === 'update' || action.type === 'view'}
                disabled={action.type === 'view'}
                isAdmin={true}

                data={action.data}
                templates={templates.data || []}
                onClose={handleClose}
                title={!!action.data && (
                    <div>
                        <Grid container >
                            <Typography variant="h6" className={classes.margin}>{displayName}</Typography>
                            <Chip
                                color={action.data.public ? 'primary' : 'secondary'}
                                label={action.data.public ? handleLabel('public') : handleLabel('unpublic')}
                            />
                        </Grid>
                        {!!action.data.target && (
                            <Grid item xs={12}>
                                {action.data.target.images.map((url, key) => (
                                    <img key={key} alt={key} src={url} className={classes.img} />
                                ))}
                            </Grid>
                        )}
                    </div>
                )}
            />
        </Grid>
    )
}

export default Message;
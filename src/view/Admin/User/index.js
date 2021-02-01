import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import { Grid, Avatar, Typography } from '@material-ui/core';
import { Edit, Visibility, Book } from '@material-ui/icons';
import countriesList from 'countries-list'

import { _address } from '../../../variables/Values';
import Firebase, { useFirebase, _user, useFirestoreQuery } from '../../../Firebase';
import DataTable from '../../../components/Table/DataTable';
import Form from '../../../components/Form/UpdateForm';
import { getDifferent } from '../../../utils/getDifferent';
import { getCurrency } from '../../../utils/getCurrency'
import { useAdmin } from '../../../layout/Admin'

const countries = Object.keys(countriesList.countries).reduce((a, c) => {
    return {
        ...a,
        [c]: countriesList.countries[c].native
    }
}, {})

const useColumn = () => {
    const { langCode, handleLabel } = useFirebase()

    return [
        {
            title: handleLabel('avatar'),
            field: 'photoURL',
            render: rowData => (
                <Avatar alt={rowData.email} src={rowData.photoURL} />
            )
        },
        {
            title: handleLabel('email'),
            field: 'email',
            render: rowData => {
                const { email, remark } = rowData
                return (
                    <div>
                        <Typography>{email}</Typography>
                        {!!remark && (
                            <Typography color="secondary">{remark}</Typography>
                        )}
                    </div>
                )
            }
        },
        { title: handleLabel('displayName'), field: 'displayName' },
        { title: handleLabel('group'), field: `group.displayName.${langCode}` },
        { title: handleLabel('country'), field: 'country', lookup: countries },
        {
            title: handleLabel('totalAmount'),
            field: 'amount',
            render: rowData => {
                const { amount } = rowData
                return Object.keys(amount).map(key => (
                    <Typography key={key}>{`${key} ${getCurrency(amount[key])}`}</Typography>
                ))
            }
        },
        { title: handleLabel('points'), field: 'points', type: 'numeric' },

    ]
}


function getFormat(handleLabel, exchangeRates, groups) {
    var d = Date.now()
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
            id: 'email',
            hidden: true,
            label: handleLabel('email'),
            value: '',
        },
        {
            fieldType: 'text',
            id: 'displayName',
            hidden: true,
            label: handleLabel('displayName'),
            value: '',
        },
        {
            fieldType: 'date',
            id: 'create',
            label: handleLabel('signUp'),
            value: d,
            hidden: true,
        },
        {
            fieldType: 'date',
            id: 'last',
            label: handleLabel('last'),
            value: d,
            hidden: true,
        },
        {
            fieldType: 'select',
            id: 'group',
            label: handleLabel('group'),
            required: true,
            value: null,
            multiple: false,
            options: groups,
            getOptionLabel: opt => handleLabel(opt.displayName),
            getValue: opt => opt.id,
        },
        {
            fieldType: 'number',
            id: 'points',
            label: handleLabel('points'),
            value: 0,
        },
        {
            fieldType: 'title',
            id: 'amount',
            hidden: true,
            label: handleLabel('totalAmount'),
            children: Object.keys(exchangeRates).map(key => {
                return {
                    fieldType: 'number',
                    id: key,
                    label: key,
                    value: 0,
                }
            })
        },
        {
            fieldType: 'title',
            id: 'recipient',
            label: handleLabel('recipient'),
            children: _address.map(item => {
                if (item.id === 'country') {
                    return ({
                        fieldType: 'select',
                        id: item.id,
                        label: handleLabel(item.id),
                        required: item.required,
                        value: null,
                        multiple: false,
                        options: Object.keys(countriesList.countries).map(key => {
                            var obj = countriesList.countries[key]
                            return {
                                value: key,
                                label: `${obj.native} (${obj.name})`
                            }
                        }),
                        getOptionLabel: opt => opt.label,
                        getValue: opt => opt.value,
                    })
                } else {
                    return ({
                        fieldType: 'text',
                        id: item.id,
                        label: handleLabel(item.id),
                        helperText: !!item.helper && handleLabel(item.helper),
                        required: item.required,
                        value: '',
                        type: item.id === 'phone' ? 'tel' : 'text',

                    })
                }
            })
        },
        {
            fieldType: 'text',
            id: 'remark',
            label: handleLabel('remark'),
            helperText: handleLabel('onlyStaff'),
            value: '',
            multiline: true,
            rows: 3,
            rowsMax: 5,
            sm: 12
        },
    ]
}

const User = ({ path }) => {
    const theme = useTheme();
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, exchangeRates, handleLabel, updateFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write

    const users = useFirestoreQuery({ ref: Firebase.firestore().collection('user').orderBy('create', 'desc') })
    const groups = useFirestoreQuery({
        ref: Firebase.firestore().doc('system/group'),
        type: 'array',
    })

    const loading = users.loading || groups.loading
    const rows = users.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, exchangeRates, groups.data)

    const handleUpdate = (newData) => {
        var path = `${_user}/${newData.id}`
        var title = `${handleLabel('update')} ${newData.email}`
        var data = {
            ...newData,
            group: groups.data.find(item => item.id === newData.group) || null
        }
        var change = getDifferent(data, action.data)

        updateFirestore(path, data, true, change)
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
                actions={[
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
                options={{
                    rowStyle: rowData => ({ color: rowData.admin > 0 ? theme.palette.info.light : theme.palette.text.primary })
                }}
                detailPanel={rowData => {
                    const { group } = rowData
                    if (!group) {
                        return null
                    }
                    return (
                        <Grid container spacing={1} style={{ padding: '8px' }}>
                            <Grid item xs={12} sm={6}>
                                <Typography>{`${handleLabel('displayName')}: ${handleLabel(group.displayName)}`}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography>{`${handleLabel('percent')}: ${group.percent}%`}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography>{`${handleLabel('type')}: ${handleLabel(group.type)}`}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography>{`${handleLabel('lv')}: ${group.lv}`}</Typography>
                            </Grid>
                            {!!group.brand && (
                                <Grid item xs={12} sm={6}>
                                    <Typography>{`${handleLabel('brand')}: ${handleLabel(group.brand.displayName)}`}</Typography>
                                </Grid>
                            )}
                        </Grid>
                    )
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

export default User;
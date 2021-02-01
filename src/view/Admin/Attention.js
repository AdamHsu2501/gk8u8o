import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core'
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _boolean } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useStyles = makeStyles(theme => ({
    title: {
        borderBottom: `1px solid ${theme.palette.divider}`
    },
}));

const useColumn = () => {
    const classes = useStyles()
    const { handleLabel, languages } = useFirebase()

    var langs = languages.map(item => ({
        title: item.native,
        field: `text.${item.id}`,
        render: rowData => {
            var text = rowData.text[item.id]
            return (
                <Grid >
                    <Typography variant="subtitle1" className={classes.title}>
                        {rowData.displayName[item.id]}
                    </Typography>
                    <Typography >
                        {text.length > 25 ? text.substring(0, 50).concat('...') : text}
                    </Typography>
                </Grid>
            )
        }
    }))

    return [
        {
            title: handleLabel('date'),
            field: 'date',
            render: rowData => {
                var d = new Date(rowData.date)
                return `${d.toLocaleString()} (${handleLabel(d.getDay())})`
            }
        },
        ...langs,
        {
            title: handleLabel('enable'),
            field: 'enable',
            render: rowData => handleLabel(rowData.enable)
        },

    ]
}

function getFormat(handleLabel, languages) {
    var d = Date.now();

    return [
        {
            fieldType: 'date',
            id: 'date',
            hidden: true,
            label: handleLabel('date'),
            value: d,
        },
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `att${d}`,
        },
        {
            fieldType: 'title',
            id: 'displayName',
            label: handleLabel('messageTitle'),
            children: languages.map(item => ({
                fieldType: 'text',
                required: true,
                id: item.id,
                label: item.native,
                value: '',
            }))
        },
        {
            fieldType: 'title',
            id: 'text',
            label: handleLabel('messageContent'),
            children: languages.map(item => ({
                fieldType: 'text',
                id: item.id,
                label: item.native,
                value: '',
                rows: 3,
                rowsMax: 5,
                multiline: true
            }))
        },
        {
            fieldType: 'text',
            id: 'enable',
            label: handleLabel('enable'),
            value: _boolean[0],
            options: _boolean.map(item => ({ value: item, label: handleLabel(item) }))
        },
    ]
}

const Attention = ({ path }) => {
    const theme = useTheme()
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete

    const attentions = useFirestoreQuery({
        ref: Firebase.firestore().collection('attention').orderBy('date', 'desc')
    })
    const loading = attentions.loading
    const rows = attentions.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, languages)

    const handleUpdate = (newData) => {
        var ref = `attention/${newData.id}`
        var title = `${handleLabel('update')} ${handleLabel(newData.displayName)}`

        var change = getDifferent(newData, action.data)

        updateFirestore(ref, newData, false, change)
            .then(() => {
                handleSnackbar(true, title)
            })
            .catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    const handleDelete = data => {
        var ref = `attention/${data.id}`
        var title = `${handleLabel('delete')} ${handleLabel(data.displayName)}`
        var change = getDifferent(null, data)

        deleteFirestore(ref, null, change)
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
                rows={rows}
                isDeletable={() => isDeletable}
                onDelete={handleDelete}
                actions={[
                    {
                        icon: AddBox,
                        disabled: !isEditable,
                        tooltip: handleLabel('addTooltip'),
                        isFreeAction: true,
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('attention')}`)
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

export default Attention;
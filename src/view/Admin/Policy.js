import React from 'react';
import { makeStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core';
import { AddBox, Edit, Visibility, Book } from '@material-ui/icons';

import { _policy, _noImage } from '../../variables/Values'
import Firebase, { useFirebase, useFirestoreQuery, updateStorage, deleteStorage } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import Form from '../../components/Form/UpdateForm';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const useStyles = makeStyles(theme => ({
    img: {
        width: 100
    }
}))

const useColumn = () => {
    const { languages, handleLabel } = useFirebase()
    const classes = useStyles()

    return [
        { title: handleLabel('displayName'), field: 'displayName', filtering: false },
        {
            title: handleLabel('text'),
            field: 'text',
            filtering: false,
            render: rowData => {
                const { text } = rowData
                return (
                    <Typography>
                        {text.length > 50 ? text.substring(0, 50).concat('...') : rowData.text}
                    </Typography>
                )
            }
        },
        {
            title: handleLabel('image'),
            field: 'images',
            filtering: false,
            render: rowData => {
                return rowData.images.map((item, key) => (
                    <img
                        key={key}
                        src={item.preview}
                        onError={(e) => e.target.src = _noImage}
                        alt={item.name}
                        className={classes.img}
                    />
                ))

            }
        },
        {
            title: handleLabel('type'),
            field: 'type',
            lookup: _policy.reduce((a, c) => ({ ...a, [c]: handleLabel(c) }), {})
        },
        {
            title: handleLabel('language'),
            field: 'language',
            lookup: languages.reduce((a, c) => ({ ...a, [c.id]: c.native }), {})
        },
        {
            title: handleLabel('sort'),
            field: 'sort',
            filtering: false,
        }
    ]
}

function getFormat(handleLabel, languages) {
    var d = Date.now();

    return [
        {
            fieldType: 'text',
            id: 'id',
            hidden: true,
            label: handleLabel('id'),
            value: `plc${d}`,
        },
        {
            fieldType: 'text',
            id: 'type',
            label: handleLabel('type'),
            value: _policy[0],
            options: _policy.map(id => (
                { value: id, label: handleLabel(id) }
            ))
        },
        {
            fieldType: 'text',
            id: 'language',
            label: handleLabel('language'),
            value: 'zh-tw',
            options: languages.map(item => (
                { value: item.id, label: item.native }
            ))
        },
        {
            fieldType: 'number',
            id: 'sort',
            label: handleLabel('sort'),
            value: 1,
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
            value: '',
            multiline: true,
            rows: 5,
            rowsMax: 10,
            sm: 12
        },
        {
            fieldType: 'file',
            id: 'images',
            label: handleLabel('images'),
            value: [],
            multiple: true,
            helperText: handleLabel('dropzoneHelper')
        },
    ]
}

const Policy = ({ path }) => {
    const { action, handleAction, handleClose, handleSnackbar } = useAdmin();
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const policies = useFirestoreQuery({
        ref: Firebase.firestore().doc(ref),
        type: 'array',
    });
    const loading = policies.loading
    const rows = policies.data || []
    var columns = useColumn();
    var format = loading ? [] : getFormat(handleLabel, languages, rows)

    const handleUpdate = (newData) => {
        var title = `${handleLabel('update')} ${newData.displayName}`

        return Promise.all(
            newData.images.filter(item => item.path).map(item => {
                return updateStorage(`${ref}/${newData.id}`, item.name, item)
            })
        ).then(results => {
            var obj = {
                ...newData,
                images: newData.images.map(item => results.find(res => res.name === item.name) || item),
            }

            var change = getDifferent(obj, action.data)

            return updateFirestore(ref, { [newData.id]: obj }, true, change)
        }).then(() => {
            handleSnackbar(true, title)
        }).catch(error => {
            console.log('error', error)
            handleSnackbar(false, title)
        })
    }

    const handleDelete = data => {
        var title = `${handleLabel('delete')} ${data.displayName}`
        var change = getDifferent(null, data)

        Promise.all([
            deleteStorage(`${ref}/${data.id}`),
            deleteFirestore(ref, data.id, change)
        ])
            .then(() => {
                handleSnackbar(true, title)
            }).catch(error => {
                console.log('error', error)
                handleSnackbar(false, title)
            })
    }

    return (
        <div >
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
                        onClick: (event) => handleAction(null, 'set', `${handleLabel('add')}${handleLabel('terms')}`)
                    },
                    {
                        icon: Edit,
                        disabled: !isEditable,
                        tooltip: handleLabel('editTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'update', rowData.displayName)
                    },
                    {
                        icon: Visibility,
                        tooltip: handleLabel('viewTooltip'),
                        onClick: (event, rowData) => handleAction(rowData, 'view', rowData.displayName)
                    },
                    {
                        icon: Book,
                        tooltip: handleLabel('logTooltip'),
                        onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                    },
                ]}
                options={{
                    filtering: true
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

export default Policy;
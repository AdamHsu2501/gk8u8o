import React, { useState } from 'react';
import { Grid, IconButton, Typography, Tooltip } from '@material-ui/core';
import { HelpOutline, Book } from '@material-ui/icons';
import { useSnackbar } from 'notistack';

import { useFirebase } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const Language = ({ path }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { handleAction } = useAdmin()
    const { auth, languages, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const [loading, setLoading] = useState(false)

    var columns = [
        { title: handleLabel('ISO'), field: 'id', editable: 'onAdd' },
        { title: handleLabel('displayName'), field: 'native' },
        { title: handleLabel('sort'), field: 'order', type: 'numeric', },
    ]

    const handleUpdate = (newData, oldData) => {
        if (newData.id) {
            setLoading(true)

            var data = {
                id: newData.id.toLowerCase(),
                native: newData.native || "",
                order: isNaN(newData.order) ? languages.length : Math.abs(newData.order),
                default: newData.default || false
            }

            var title = `${handleLabel('update')} ${data.native}`
            var change = getDifferent(data, oldData)

            updateFirestore(ref, { [data.id]: data }, true, change).then(() => {
                enqueueSnackbar(title, { variant: 'success' });
            }).catch(error => {
                console.log('error', error)
                enqueueSnackbar(title, { variant: 'error' });
            }).then(() => {
                setLoading(false)
            })
        }
    }

    const handleDelete = data => {
        setLoading(true)
        var title = `${handleLabel('delete')} ${data.native}`
        var change = getDifferent(null, data)

        deleteFirestore(ref, data.id, change).then(() => {
            enqueueSnackbar(title, { variant: 'success' });
        }).catch(error => {
            console.log('error', error)
            enqueueSnackbar(title, { variant: 'error' });
        }).then(() => {
            setLoading(false)
        })
    }

    return (
        <div>
            <Grid container justify="space-between" alignItems="center">
                <Typography>IETF語言標籤 Browser language codes</Typography>
                <Tooltip title={handleLabel('help')}>
                    <IconButton component="a" href="https://www.metamodpro.com/browser-language-codes" target="_blank" >
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Grid>
            <Grid item xs={12}>
                <DataTable
                    loading={loading}
                    title={path}
                    columns={columns}
                    rows={languages}
                    isDeletable={(rowData) => isDeletable && !rowData.default}
                    isEditable={() => isEditable}
                    onAdd={isEditable && handleUpdate}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    actions={[
                        {
                            icon: Book,
                            tooltip: handleLabel('logTooltip'),
                            onClick: (event, rowData) => handleAction(rowData.id, 'log', handleLabel('logTooltip'))
                        },
                    ]}
                />
            </Grid>
        </div>
    )
}

export default Language;
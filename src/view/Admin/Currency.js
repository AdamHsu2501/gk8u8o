import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { Book } from '@material-ui/icons';

import { useFirebase } from '../../Firebase';
import DataTable from '../../components/Table/DataTable';
import { getDifferent } from '../../utils/getDifferent';
import { useAdmin } from '../../layout/Admin'

const Currency = ({ path }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { handleAction } = useAdmin()
    const { auth, exchangeRates, handleLabel, updateFirestore, deleteFirestore } = useFirebase();
    const { admin, permission } = auth
    var isEditable = admin === 2 ? true : permission[path].write
    var isDeletable = admin === 2 ? true : permission[path].delete
    var ref = `system/${path.toLowerCase()}`

    const [loading, setLoading] = useState(false)
    const rows = Object.keys(exchangeRates).map(key => ({
        id: key,
        exchangeRate: exchangeRates[key]
    }))


    var columns = [
        { title: handleLabel('ISO'), field: 'id', editable: 'onAdd', },
        { title: `${handleLabel('exchangeRate')}`, field: 'exchangeRate', type: 'numeric' },
    ]

    const handleUpdate = (newData, oldData) => {
        setLoading(true)
        var title = `${handleLabel('update')} ${newData.id}`
        const data = {
            [newData.id]: Math.abs(newData.exchangeRate) || 1
        };
        var change = getDifferent(newData, oldData)

        updateFirestore(ref, data, true, change).then(() => {
            return enqueueSnackbar(title, { variant: 'success' });
        }).catch(error => {
            return enqueueSnackbar(title, { variant: 'error' });
        }).then(() => {
            setLoading(false)
        })
    }

    const handleDelete = data => {
        setLoading(false)
        var title = `${handleLabel('delete')} ${data.id}`
        var change = getDifferent(null, data)

        deleteFirestore(ref, data.id, change).then(() => {
            enqueueSnackbar(title, { variant: 'success' });
        }).catch(error => {
            enqueueSnackbar(title, { variant: 'error' });
        }).then(() => {
            setLoading(false)
        })
    }

    return (
        <DataTable
            loading={loading}
            title={path}
            columns={columns}
            rows={rows}
            isEditable={rowData => isEditable && !rowData.default}
            isDeletable={rowData => isDeletable && !rowData.default && !(rowData.id === 'TWD' || rowData.id === 'USD')}
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
    )
}

export default Currency;
import React, { forwardRef } from 'react';
import MaterialTable from 'material-table';
import {
    AddBox, ArrowUpward, Check, ChevronLeft, ChevronRight,
    Clear, DeleteOutline, Edit, FilterList, FirstPage,
    LastPage, Remove, SaveAlt, Search, ViewColumn,
} from '@material-ui/icons';

import { useFirebase } from '../../Firebase';


const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowUpward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

const DataTable = ({
    loading, title, columns, rows, actions,
    isEditable, isDeletable, onAdd, onUpdate, onDelete,
    options, detailPanel,
}) => {
    const { handleLabel } = useFirebase()

    return (
        <MaterialTable
            isLoading={loading}
            title={handleLabel(title)}
            columns={columns}
            data={rows}
            options={{
                actionsColumnIndex: -1,
                draggable: false,
                detailPanelType: 'single',
                pageSize: 10,
                pageSizeOptions: [10, 25, 50, 100],
                ...options
            }}

            actions={actions}
            detailPanel={detailPanel}

            editable={{
                isEditable: isEditable,
                isDeletable: isDeletable,
                onRowAdd: onAdd ? (newData =>
                    new Promise(resolve => {
                        setTimeout(() => {

                            resolve(onAdd(newData))
                        }, 600);
                    })) : null,

                onRowUpdate: onUpdate ? ((newData, oldData) =>
                    new Promise(resolve => {
                        setTimeout(() => {
                            resolve(onUpdate(newData, oldData))
                        }, 600);
                    })) : null,

                onRowDelete: onDelete ? (oldData =>
                    new Promise(resolve => {
                        setTimeout(() => {
                            resolve(onDelete(oldData));
                        }, 600);
                    })) : null,
            }}

            icons={tableIcons}
            localization={{
                header: {
                    actions: '',
                },
                body: {
                    addTooltip: handleLabel('addTooltip'),
                    deleteTooltip: handleLabel('deleteTooltip'),
                    editTooltip: handleLabel('editTooltip'),
                    emptyDataSourceMessage: handleLabel('emptyDataSourceMessage'),
                    editRow: {
                        deleteText: handleLabel('deleteText'),
                        cancelTooltip: handleLabel('cancelTooltip'),
                        saveTooltip: handleLabel('saveTooltip'),

                    }
                },
                toolbar: {
                    searchTooltip: handleLabel('searchTooltip'),
                    nRowsSelected: handleLabel('nRowsSelected'),
                },
                pagination: {
                    labelRowsSelect: handleLabel('labelRowsSelect'),
                    firstTooltip: handleLabel('firstTooltip'),
                    previousTooltip: handleLabel('previousTooltip'),
                    nextTooltip: handleLabel('nextTooltip'),
                    lastTooltip: handleLabel('lastTooltip'),
                }
            }}
            style={{ width: '100%' }}
        />
    );
}

export default DataTable
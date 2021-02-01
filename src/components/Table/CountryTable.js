import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableRow, } from '@material-ui/core/';

const Content = ({ data }) => {
    return (
        <TableRow>
            <TableCell>
                {data.flag}
            </TableCell>
            <TableCell>
                {data.native}
            </TableCell>
            <TableCell>
                {data.value}
            </TableCell>
            <TableCell>
                {data.percent}
            </TableCell>
        </TableRow>
    )
}

const CountryTable = ({ list }) => {
    return (
        <TableContainer >
            <Table size="small">
                <TableBody>
                    {list.slice(0, 10).map((item, key) => (
                        <Content key={key} data={item} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer >
    )
}

export default CountryTable
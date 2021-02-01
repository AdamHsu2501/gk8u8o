import React from 'react'
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import {
    Table, TableHead, TableRow, TableCell, TableBody, FormControlLabel,
    Typography, Checkbox,
} from '@material-ui/core';

import * as ROUTES from '../../routes';
import { useFirebase } from '../../Firebase'

const useStyles = makeStyles(theme => ({
    userTitle: {
        color: theme.palette.warning.main
    },
    orderTitle: {
        color: theme.palette.text.primary,
    },
    link: {
        textDecoration: 'none',
        opacity: 1,
        '&:hover': {
            opacity: 0.6,
        }
    }
}))

const defaultHeadCells = [
    { id: 'checked', align: 'center' },
    { id: 'reserved', align: 'center' },
    { id: 'displayName', align: 'left' },
    { id: 'remark', align: 'left' },
    { id: 'quantity', align: 'center' },
]

const RequestTable = (({ list, data, onSubmit }) => {
    const { handleLabel } = useFirebase()

    return (
        <Table size='small'>
            <TableHead>
                <TableRow>
                    {defaultHeadCells.map((cell, key) => {
                        const { id, align } = cell;
                        if (id === 'checked') {
                            return (
                                <TableCell key={key} padding='checkbox' align={align}>
                                    <Checkbox
                                        indeterminate={Object.values(list).some(item => !item[id])}
                                        checked={Object.values(list).every(item => item[id])}
                                        onChange={(e) => onSubmit(e, null, id)}
                                    />
                                </TableCell>
                            )
                        } else if (id === 'reserved') {
                            return (
                                <TableCell key={key} align={align} >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                indeterminate={Object.values(list).some(item => !item[id])}
                                                checked={Object.values(list).every(item => item[id])}
                                                onClick={(e) => onSubmit(e, null, id)}
                                            />
                                        }
                                        label={handleLabel(id)}
                                    />
                                </TableCell>
                            )
                        } else {
                            return (
                                <TableCell key={key} align={align}>
                                    {handleLabel(id)}
                                </TableCell>
                            )
                        }
                    })}

                </TableRow>
            </TableHead>
            {Object.values(list).map((item, key) => (
                <Content key={key} user={item} data={data} onSubmit={onSubmit} />
            ))}
        </Table>
    )
})


const Content = ({ user, data, onSubmit }) => {
    const classes = useStyles()
    const { handleLabel } = useFirebase()
    if (!data) {
        return null
    }

    return (
        <TableBody>
            <TableRow >
                {defaultHeadCells.map((cell, key) => {
                    const { id, align } = cell;
                    if (id === 'checked' || id === 'reserved') {
                        return (
                            <TableCell key={key} padding={id === 'checked' ? 'checkbox' : 'default'} align={align}>
                                <Checkbox
                                    checked={user[id]}
                                    onClick={(e) => onSubmit(e, user.id, id)}
                                />
                            </TableCell>
                        )
                    } else if (id === 'displayName') {
                        return (
                            <TableCell key={key} align={align} >
                                <a
                                    href={`${ROUTES.ORDER}?${user.id}`}
                                    target='_blank'
                                    rel="noreferrer noopener"
                                    className={classNames(classes.userTitle, classes.link)}
                                >
                                    <Typography>
                                        {user.displayName}
                                    </Typography>
                                    <Typography variant="caption">
                                        {user.email}
                                    </Typography>
                                </a>
                            </TableCell>
                        )

                    } else if (id === 'remark') {
                        return (
                            <TableCell key={key} align={align}>
                                {user.remark}
                            </TableCell>
                        )
                    } else {
                        return (
                            <TableCell key={key} align={align} />
                        )
                    }
                })}
            </TableRow>

            {Array.isArray(user.orders) && user.orders.map((order, key) => (
                <TableRow key={key} >
                    {defaultHeadCells.map((cell, subkey) => {
                        const { id, align } = cell;
                        var d = new Date(order.date)
                        if (id === 'displayName') {
                            return (
                                <TableCell key={subkey} align={align}>
                                    <a
                                        href={`${ROUTES.ORDER}/${order.id}`}
                                        target='_blank'
                                        rel="noreferrer noopener"
                                        className={classNames(classes.orderTitle, classes.link)}
                                    >
                                        <Typography>
                                            {order.id}
                                        </Typography>
                                        <Typography variant="caption">
                                            {`${d.toLocaleString()}(${handleLabel(d.getDay())})`}
                                        </Typography>
                                    </a>
                                </TableCell>
                            )
                        } else if (id === 'quantity') {
                            var temp = order.items.find(subItem => subItem.id === data.id)

                            return (
                                <TableCell key={subkey} align={align}>
                                    {temp.qty}
                                </TableCell>
                            )
                        } else if (id === 'remark') {
                            return (
                                <TableCell key={subkey} align={align}>
                                    {order.remark}
                                </TableCell>
                            )
                        } else {
                            return (
                                <TableCell key={subkey} align={align} />
                            )
                        }
                    })}
                </TableRow>
            ))}
        </TableBody>
    )

}

export default RequestTable
import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';

import Firebase, { useFirebase } from '../Firebase'
import Dialog from '../components/Dialog/SlideDialog'

const useStyles = makeStyles(theme => ({
    row: {
        background: theme.palette.divider
    },
    text: {
        wordBreak: "break-all"
    }
}))

const defaultHeadCells = [
    { id: 'date', align: 'left' },
    { id: 'administrator', align: 'left' },
    { id: 'type', align: 'left' }
]

const getLabel = (id) => {
    switch (id) {
        case 'rates':
            return 'postageRates'
        case 'spec':
            return 'specification'
        case 'formula':
            return 'volumetricWeightformula'
        case 'native':
            return 'displayName'
        case 'gDiscount':
            return 'groupDiscount'
        default:
            return id
    }
}

const Content = ({ data }) => {
    const { date, user, change, type } = data
    const classes = useStyles()
    const { handleLabel, languages } = useFirebase()
    var d = new Date(date)

    return (
        <TableBody>
            <TableRow className={classes.row}>
                {defaultHeadCells.map((item, key) => {
                    const { id, align } = item
                    if (id === 'date') {
                        return (
                            <TableCell key={key} align={align}>
                                {`${d.toLocaleString()} (${handleLabel(d.getDay())})`}
                            </TableCell>
                        )
                    }
                    if (id === 'administrator') {

                        return (
                            <TableCell key={key} align={align}>
                                {user.email}
                            </TableCell>
                        )
                    } else {
                        return (
                            <TableCell key={key} align={align}>
                                {handleLabel(type)}
                            </TableCell>
                        )
                    }

                })}
            </TableRow>
            {typeof (change) === 'string' && (
                <TableRow>
                    <TableCell colSpan={defaultHeadCells.length}>
                        {change}
                    </TableCell>
                </TableRow>
            )}
            {typeof (change) === 'object' && Object.keys(change).map((id, key) => {
                var child = change[id]
                if (typeof (child) === 'object') {
                    if (Array.isArray(child)) {
                        return child.map((item, subKey) => (
                            <TableRow key={subKey}>
                                <TableCell colSpan={defaultHeadCells.length}>
                                    <div>
                                        <Typography>{handleLabel(getLabel(id))}</Typography>
                                        <Typography className={classes.text}>{item}</Typography>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    } else {
                        return Object.keys(child).map((subId, subKey) => {
                            var value = languages.find(item => item.id === subId)

                            return (
                                <TableRow key={subKey}>
                                    <TableCell colSpan={defaultHeadCells.length}>
                                        <div>
                                            <Typography>{`${handleLabel(getLabel(id))} ${!value ? handleLabel(getLabel(subId)) : value.native} `}</Typography>
                                            <Typography className={classes.text}>{JSON.stringify(child[subId])}</Typography>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                } else {
                    return (
                        <TableRow key={key}>
                            <TableCell colSpan={defaultHeadCells.length}>
                                <div>
                                    <Typography>{handleLabel(getLabel(id))}</Typography>
                                    <Typography className={classes.text}>{change[id]}</Typography>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                }
            })}
        </TableBody>
    )
}

const Log = ({ open, id, onClose }) => {
    const { handleLabel } = useFirebase()
    const [loading, setLoading] = useState(false)
    const [state, setState] = useState([])

    useEffect(() => {
        if (!!id) {
            setLoading(true)
            Firebase.firestore().collectionGroup('log').where('target', '==', id).orderBy('date', 'desc').get().then(snap => {
                var arr = snap.docs.map(doc => doc.data())
                setState(arr)
                setLoading(false)
            })
        }

    }, [id])

    return (
        <Dialog
            open={open}
            loading={loading}
            title={<Typography variant="h6">{handleLabel('logTooltip')}</Typography>}
            onClose={onClose}
        >
            <Table size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        {defaultHeadCells.map((item, key) => (
                            <TableCell key={key} align={item.align}>
                                {handleLabel(item.id)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                {state.map((item, key) => (
                    <Content key={key} data={item} />
                ))}
            </Table>
        </Dialog>
    )
}

export default Log
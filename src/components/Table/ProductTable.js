import React from 'react';
import classnames from 'classnames'
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import {
    Button, Typography, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton
} from '@material-ui/core/';

import { Lock, LockOpen } from '@material-ui/icons';

import * as ROUTES from '../../routes';
import { _boolean, _paymentStatus, _noImage } from '../../variables/Values'
import { useFirebase } from '../../Firebase';
import TextField from '../Field/TextField'
import NumberField from '../Field/NumberField'
import StatusTag from '../Tag/StatusTag'
import { getFixed } from '../../utils/getFixed'
import { getCurrency } from '../../utils/getCurrency'


const useStyles = makeStyles(theme => ({
    img: {
        width: theme.spacing(7),
        height: theme.spacing(7)
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.text.primary,
        opacity: 1,
        '&:hover': {
            opacity: 0.8,
        }
    },
    error: {
        background: theme.palette.divider,
        filter: 'grayscale(100%)'
    },
    bold: {
        color: theme.palette.warning.main,
        fontWeight: 600
    },
    red: {
        color: theme.palette.error.main
    },
    outFrame: {
        border: `4px solid ${theme.palette.warning.main}`,
        backgroundColor: theme.palette.warning.main
    },
    maxWidth: {
        maxWidth: theme.spacing(20)
    },
    text: {
        wordBreak: 'break-all'
    },
}))

const ShopItem = ({ mode, user, item, onSubmit, index, cells, onSelect }) => {
    const classes = useStyles();
    const { handleLabel, discounts } = useFirebase();

    if (item.qty === 0 && !item.error) {
        return null
    }
    var qtyOptions

    if (mode === 'admin' || mode === 'cart') {
        var num = item.deduction ? item.quantity : 50
        qtyOptions = [...Array(num).keys()].map(i => ({ value: i + 1, label: i + 1 }))
    }

    var img = (
        <img
            src={!!item.images.length ? item.images[0].preview : _noImage}
            onError={(e) => e.target.src = _noImage}
            alt={item.code}
            className={classnames(classes.img, (item.nDiscount && item.discount.enable) && classes.outFrame)}
        />
    )

    var error = !!item.error
    var booleanOptions = _boolean.map(item => ({
        value: item, label: handleLabel(item)
    }))

    var paymentOptions = _paymentStatus.map((item, key) => ({
        value: !!key, label: handleLabel(item)
    }))

    var discountOptions = discounts.map(item => ({
        value: item.percent, label: item.percent
    })).concat({ value: 0, label: 0 })

    return (
        <TableBody size="small" >
            <TableRow
                className={classnames(error && classes.error)}
            >
                {cells.map((cell, key) => {
                    const { id, align } = cell;

                    if (id === 'checkbox') {
                        return (
                            <TableCell key={key} padding='checkbox' align={align} rowSpan={5} >
                                <Checkbox
                                    checked={item.selected}
                                    onClick={(event) => onSelect(event, item.id)}
                                />
                            </TableCell>
                        )
                    } else if (id === 'image') {
                        return (
                            <TableCell key={key} rowSpan={5} >
                                {mode === 'cart' ? <Link to={`${ROUTES.LIST}/${item.id}`}>{img}</Link> : img}
                            </TableCell>
                        )
                    } else if (id === 'displayName') {
                        return (
                            <TableCell key={key} align={align} className={classnames(classes.maxWidth, classes.text)}>
                                {error ? (
                                    <Typography color="secondary">{handleLabel(item.error)}</Typography>
                                ) : (
                                        <StatusTag status={item.status} />
                                    )}

                                {mode === 'cart' ? (
                                    <Typography
                                        component={Link}
                                        to={`${ROUTES.LIST}/${item.id}`}
                                        className={classnames(classes.link)}
                                    >
                                        {handleLabel(item.displayName)}
                                    </Typography>

                                ) : (
                                        <Typography color={error ? "secondary" : "textPrimary"}>
                                            {handleLabel(item.displayName)}
                                        </Typography>
                                    )}

                                <Typography variant="body2">
                                    {item.code}
                                </Typography>

                            </TableCell>
                        )

                    } else if (id === 'unitPrice') {

                        if (mode === 'admin') {
                            return (
                                <TableCell key={key} align={align} className={classes.maxWidth}>
                                    <NumberField
                                        disabled={!!item.paymentDate}
                                        id='price'
                                        parentId={index}
                                        label={handleLabel('price')}
                                        value={item.price}
                                        onChange={onSubmit}
                                        allowEmptyFormatting={false}
                                        thousandSeparator={true}
                                    />
                                </TableCell>
                            )
                        }
                        return (
                            <TableCell key={key} align={align} className={classes.maxWidth}>
                                <Typography>{getCurrency(item.price)}</Typography>
                                {item.type === 'group' && (
                                    <Typography color="textSecondary">
                                        {handleLabel(user.group.displayName)}
                                    </Typography>
                                )}
                                {item.type === 'event' && (
                                    <Typography color="textSecondary">
                                        {handleLabel('eventSpecials')}
                                    </Typography>
                                )}
                            </TableCell>
                        )
                    } else if (id === 'quantity') {
                        return (
                            <TableCell key={key} align={align} >
                                {(mode === 'admin' || mode === 'cart') ? (
                                    <TextField
                                        disabled={!!item.paymentDate}
                                        id="qty"
                                        parentId={index}
                                        label={handleLabel('quantity')}
                                        value={item.qty}
                                        onChange={onSubmit}
                                        options={qtyOptions}
                                    />
                                ) : (
                                        item.qty
                                    )}
                            </TableCell>
                        )
                    } else if (id === 'amount') {
                        return (
                            <TableCell key={key} align={align} >
                                <Typography >
                                    {getCurrency(item.price * item.qty)}
                                </Typography>
                            </TableCell>
                        )
                    } else if (id === 'status') {
                        return (
                            <TableCell key={key} align={align} >
                                {mode === 'admin' ? (
                                    <TextField
                                        // disabled={!!item.paymentDate}
                                        id="paid"
                                        parentId={index}
                                        label=''
                                        value={item.paid}
                                        onChange={onSubmit}
                                        options={paymentOptions}
                                    />
                                ) : (
                                        <Typography color={item.paid ? "inherit" : 'secondary'}>
                                            {handleLabel(_paymentStatus[Number(item.paid)])}
                                        </Typography>
                                    )}
                            </TableCell>
                        )
                    } else if (id === 'reserved') {
                        return (
                            <TableCell key={key} align={align} >
                                {mode === 'admin' ? (

                                    <TextField
                                        // disabled={!!item.paymentDate}
                                        id="reserved"
                                        parentId={index}
                                        label=''
                                        value={item.reserved}
                                        onChange={onSubmit}
                                        options={booleanOptions}
                                    />
                                ) : (
                                        <Typography>{handleLabel(item.reserved)}</Typography>
                                    )}
                            </TableCell>
                        )
                    } else if (id === 'rewardPoints') {
                        return (
                            <TableCell key={key} align={align} className={classes.maxWidth}>
                                {mode === 'admin' ? (
                                    <NumberField
                                        disabled={!!item.paymentDate}
                                        id='rewards'
                                        parentId={index}
                                        label={handleLabel('rewardPoints')}
                                        value={item.rewards}
                                        onChange={onSubmit}
                                        allowEmptyFormatting={false}
                                        thousandSeparator={true}
                                    />
                                ) : (
                                        getCurrency(item.rewards)
                                    )}
                            </TableCell>
                        )
                    } else {
                        return (
                            <TableCell key={key} align={align} >
                                { (mode === 'admin' || mode === 'cart') && (
                                    <Button
                                        // disabled={!!item.paymentDate}
                                        color="secondary"
                                        onClick={() => {
                                            onSubmit('delete', 0, index)
                                        }}
                                    >
                                        {handleLabel('delete')}
                                    </Button>
                                )}
                            </TableCell>
                        )
                    }
                })}
            </TableRow>

            {(mode === 'admin' || (item.nDiscount && !!item.discount.percent)) && (
                <TableRow
                    className={classnames(error && classes.error)}
                >
                    {cells.map((cell, key) => {
                        const { id, align } = cell;

                        if (id === 'action') {
                            return (
                                <TableCell key={key} align={align}>
                                    {mode === 'admin' && (
                                        <Button
                                            color={item.nDiscount ? "secondary" : "default"}
                                            onClick={() => {

                                                onSubmit('nDiscount', !item.nDiscount, index)
                                            }}
                                        >
                                            {item.nDiscount ? handleLabel('cancel') : handleLabel('enable')}
                                        </Button>
                                    )}
                                </TableCell>
                            )
                        } else if (id === 'status') {
                            return (
                                <TableCell key={key} align={align}>
                                    {mode === 'admin' && (
                                        <IconButton
                                            disabled={!item.nDiscount}
                                            onClick={() => {
                                                onSubmit('dLock', !item.discount.locked, index)
                                            }}
                                        >
                                            {item.discount.locked ? <Lock /> : <LockOpen />}
                                        </IconButton>
                                    )}
                                </TableCell>
                            )
                        } else if (id === 'displayName') {
                            return (
                                <TableCell key={key} align={align} >
                                    <Typography
                                        color={item.nDiscount ? 'secondary' : 'textSecondary'}
                                    >
                                        {handleLabel('nDiscount')}
                                    </Typography>
                                </TableCell>
                            )
                        } else if (id === 'unitPrice') {
                            return (
                                <TableCell key={key} align={align} >
                                    {mode === 'admin' ? (
                                        <TextField
                                            disabled={!item.nDiscount}
                                            id="percent"
                                            parentId={index}
                                            label={handleLabel('percent')}
                                            value={item.discount.percent}
                                            onChange={onSubmit}
                                            options={discountOptions}
                                            endAdornment='%'
                                        />
                                    ) : (
                                            <Typography
                                                color={item.nDiscount ? 'secondary' : 'textSecondary'}
                                            >
                                                {`-${item.discount.percent}%`}
                                            </Typography>
                                        )}
                                </TableCell>
                            )
                        } else if (id === 'amount') {
                            return (
                                <TableCell key={key} align={align} >
                                    {item.nDiscount && (
                                        <Typography color={item.qty ? 'secondary' : 'textSecondary'} >
                                            -{getCurrency(item.discount.amount)}
                                        </Typography>
                                    )}
                                </TableCell>
                            )
                        } else if (id === 'image' || id === 'checkbox') {
                            return null
                        } else {
                            return (
                                <TableCell key={key} />
                            )
                        }
                    })}
                </TableRow>
            )}

            {(mode === 'admin' || mode === 'adminView'
                || (mode === 'checkout' && (!!user.points || item.points.enable))
                || (mode === 'view' && item.points.enable)) && (
                    <TableRow
                        className={classnames(error && classes.error)}
                    >
                        {cells.map((cell, key) => {
                            const { id, align } = cell;

                            if (id === 'action') {

                                return (
                                    <TableCell key={key} align={align}>
                                        {(mode === 'admin' || mode === 'checkout') && (
                                            <Button
                                                color={item.points.enable ? "secondary" : "default"}
                                                onClick={() => {
                                                    onSubmit('points', !item.points.enable, index)
                                                }}
                                            >
                                                {item.points.enable ? handleLabel('cancel') : handleLabel('enable')}
                                            </Button>
                                        )}
                                    </TableCell>
                                )
                            } else if (id === 'status') {
                                return (
                                    <TableCell key={key} align={align}>
                                        {mode === 'admin' && (
                                            <IconButton
                                                disabled={!item.points.enable}
                                                onClick={() => {
                                                    onSubmit('pLock', !item.points.locked, index)
                                                }}
                                            >
                                                {item.points.locked ? <Lock /> : <LockOpen />}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                )
                            } else if (id === 'displayName') {
                                return (
                                    <TableCell key={key} align={align} >
                                        <Typography
                                            color={item.points.enable ? 'secondary' : 'textSecondary'}
                                        >
                                            {handleLabel('pointsAmount')}
                                        </Typography>
                                    </TableCell>
                                )
                            } else if (id === 'quantity') {
                                return (
                                    <TableCell key={key} align={align}>
                                        {item.points.enable && (
                                            <Typography color='secondary'>
                                                {`${item.points.cost} ${handleLabel('points')}`}
                                            </Typography>
                                        )}
                                    </TableCell>
                                )
                            } else if (id === 'amount') {
                                return (
                                    <TableCell key={key} align={align}>
                                        {item.points.enable && (
                                            <Typography color='secondary'>
                                                -{getCurrency(item.points.amount)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                )
                            } else if (id === 'image' || id === 'checkbox') {
                                return null
                            } else {
                                return (
                                    <TableCell key={key} />
                                )
                            }
                        })}
                    </TableRow>
                )}

            {mode === 'admin' && (
                <TableRow
                    className={classnames(error && classes.error)}
                >
                    <TableCell colSpan={cells.length - 1}>
                        <TextField
                            id="remark"
                            parentId={index}
                            label={handleLabel('remark')}
                            value={item.remark}
                            onChange={onSubmit}
                            multiline
                            rows={3}
                            rowsMax={5}
                        />

                    </TableCell>
                </TableRow>
            )}

            {mode === 'adminView' && (
                <TableRow
                    className={classnames(error && classes.error)}
                >
                    <TableCell colSpan={cells.length - 1}>
                        <Typography gutterBottom>{handleLabel('remark')}</Typography>
                        <Typography>{item.remark}</Typography>
                    </TableCell>
                </TableRow>
            )}


            <TableRow className={classnames(error && classes.error)} >
                {mode === 'admin' ? (
                    <TableCell colSpan={cells.length - 1}>
                        <TextField
                            id="adminRemark"
                            parentId={index}
                            label={handleLabel('adminRemark')}
                            helperText={handleLabel('displayToUser')}
                            value={item.adminRemark}
                            onChange={onSubmit}
                            multiline
                            rows={3}
                            rowsMax={5}
                        />

                    </TableCell>
                ) : (!!item.adminRemark || mode === 'adminView') && (
                    <TableCell colSpan={cells.length - 1}>
                        <Typography gutterBottom>{handleLabel('adminRemark')}</Typography>
                        <Typography>{item.adminRemark}</Typography>
                    </TableCell>
                )}

            </TableRow>
        </TableBody>
    )
}

const defaultHeadCells = [
    { id: 'image', align: 'left' },
    { id: 'displayName', align: 'left' },
    { id: 'unitPrice', align: 'right', currency: true },
    { id: 'quantity', align: 'right' },
    { id: 'amount', align: 'right', currency: true },
    { id: 'rewardPoints', align: 'right' },
]

const getcells = (mode) => {
    switch (mode) {
        case 'view':
            return [
                ...defaultHeadCells,
                { id: 'status', align: 'right' }
            ]

        case 'cart':
            return [
                { id: 'checkbox', align: 'center' },
                ...defaultHeadCells,

                { id: 'action', align: 'right' }
            ]

        case 'checkout':
            return [
                ...defaultHeadCells,
                { id: 'action', align: 'right' }
            ]

        case 'admin':
            return [
                ...defaultHeadCells,
                { id: 'reserved', align: 'right' },
                { id: 'status', align: 'right' },
                { id: 'action', align: 'right' }
            ]

        case 'adminView':
            return [
                ...defaultHeadCells,
                { id: 'reserved', align: 'right' },
                { id: 'status', align: 'right' },
            ]
        default:
            return []
    }
}

const ProductTable = ({ mode, user, list, onSubmit, currency, fee, onSelect }) => {
    const classes = useStyles();
    const { handleLabel } = useFirebase();

    var arr = mode === 'cart' ? list.filter(item => item.selected && !item.error) : list.filter(item => !item.error)

    var sum = arr.reduce((a, c) => {
        var subtotal = getFixed(c.qty * c.price, c.currency)
        var discount = c.nDiscount ? c.discount.amount : 0
        var points = c.points.enable ? c.points.amount : 0
        a += (subtotal - discount - points)
        return a
    }, 0)

    var cells = getcells(mode)

    var selectedLentgh = list.reduce((a, c) => {
        a += c.selected ? 1 : 0
        return a
    }, 0)

    return (
        <TableContainer >
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {cells.map((cell, key) => {
                            const { id, align } = cell;
                            if (id === 'action') {
                                return <TableCell key={key} />
                            } else if (id === 'checkbox') {
                                return (
                                    <TableCell key={key} padding='checkbox' align={align} >
                                        <Checkbox
                                            indeterminate={selectedLentgh < list.length}
                                            checked={selectedLentgh === list.length}
                                            onChange={(e) => onSelect(e, null)}
                                        />
                                    </TableCell>
                                )
                            } else {
                                return (
                                    <TableCell key={key} align={align}>
                                        {cell.currency ? (
                                            `${handleLabel(id)} (${currency})`
                                        ) : (
                                                handleLabel(id)
                                            )}
                                    </TableCell>
                                )
                            }
                        })}
                    </TableRow>
                </TableHead>

                {list.map((item, key) => (
                    <ShopItem
                        key={key}
                        index={key}
                        mode={mode}
                        item={item}
                        onSubmit={onSubmit}
                        cells={cells}
                        user={user}
                        onSelect={onSelect}
                    />
                ))}

                <TableBody>

                    <TableRow >
                        {cells.map((cell, key) => {
                            const { id } = cell;
                            if (id === 'displayName') {
                                return (
                                    <TableCell key={key} align="left" className={classes.bold}>
                                        <Typography>{handleLabel('subtotal')}</Typography>
                                    </TableCell>
                                )
                            } else if (id === 'amount') {
                                return (
                                    <TableCell key={key} align="right" className={classes.bold}>
                                        <Typography>{getCurrency(sum)}</Typography>
                                    </TableCell>
                                )
                            } else {
                                return (
                                    <TableCell key={key} />
                                )
                            }
                        })}
                    </TableRow>

                    {!!fee && (
                        <TableRow >
                            {cells.map((cell, key) => {
                                const { id } = cell;
                                if (id === 'displayName') {
                                    return (
                                        <TableCell key={key} align="left" className={classes.bold}>
                                            <Typography>{handleLabel('shippingFee')}</Typography>
                                        </TableCell>
                                    )
                                } else if (id === 'amount') {
                                    return (
                                        <TableCell key={key} align="right" className={classes.bold}>
                                            <Typography>{getCurrency(fee)}</Typography>
                                        </TableCell>
                                    )
                                } else {
                                    return (
                                        <TableCell key={key} />
                                    )
                                }
                            })}
                        </TableRow>
                    )}

                    {!!fee && (
                        <TableRow >
                            {cells.map((cell, key) => {
                                const { id } = cell;
                                if (id === 'displayName') {
                                    return (
                                        <TableCell key={key} align="left" className={classes.bold}>
                                            <Typography>{handleLabel('total')}</Typography>
                                        </TableCell>
                                    )
                                } else if (id === 'amount') {
                                    return (
                                        <TableCell key={key} align="right" className={classes.bold}>
                                            <Typography>{getCurrency(sum + fee)}</Typography>
                                        </TableCell>
                                    )
                                } else {
                                    return (
                                        <TableCell key={key} />
                                    )
                                }
                            })}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default ProductTable
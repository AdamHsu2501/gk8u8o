import React from 'react'
import classNames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import countriesList from 'countries-list'

import { _noImage } from '../variables/Values'
import { getCurrency } from '../utils/getCurrency'
import { getLabel } from '../utils/getLabel'

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%'
    },
    border: {
        border: '1px solid black',
        borderCollapse: 'collapse',
    },
    w10: {
        width: '10%'
    },
    w15: {
        width: '15%'
    },
    red: {
        color: 'red'
    },
    blue: {
        color: 'blue'
    },
    img: {
        width: '100%'
    }
}))

const Print = () => {
    const state = window.order
    const classes = useStyles()
    const langCode = 'zh-tw'

    if (!state) {
        window.close()
    }

    const { total, user, items, logistics, CVS } = state
    const { recipient } = user
    var d = new Date(state.date)


    var address
    if (logistics.type === 'CVS') {
        address = `(${CVS.storeId})${CVS.storeName}${CVS.address} `
    } else {
        var addressArray = [
            recipient.zip,
            countriesList.countries[recipient.country].native,
            recipient.state,
            recipient.city,
            recipient.street
        ]
        if (!!recipient.street1.replace(/\s/g, '').length) {
            addressArray.push(recipient.street1)
        }
        if (!!recipient.street2.replace(/\s/g, '').length) {
            addressArray.push(recipient.street2)
        }

        address = recipient.country === 'TW' ? addressArray.join('') : addressArray.reverse().join(', ')
        if (!!recipient.company) {
            address = `${address} - ${recipient.company}`
        }
    }

    const handleLabel = (v) => {
        return getLabel(v, langCode)
    }

    const handleProduce = (data, key) => {

        var src = !!data.images.length ? data.images[0].preview : _noImage
        var type = data.type === 'group' ? handleLabel(user.group.displayName) : handleLabel('eventSpecials')

        var total = data.price * data.qty
        if (data.nDiscount && !!data.discount.percent) {
            total -= data.discount.amount
        }
        if (data.points.enable && !!data.points.cost) {
            total -= data.points.amount
        }

        return (
            <tbody key={key}>
                <tr>
                    <td rowSpan={3} className={classes.border}>
                        <img src={src} className={classes.img} alt='product' />
                    </td>
                    <td colSpan={6} className={classes.border}>
                        ({handleLabel(data.status)})
                        ({data.code}) {handleLabel(data.displayName)}
                        <span className={classes.red}>{`(${type} ${data.currency} ${getCurrency(data.price)})`}</span>
                        <span className={classes.blue}>{` * ${data.qty}`}</span>
                    </td>
                    <td className={classes.border}>{data.rewards}</td>

                </tr>
                <tr>
                    <td colSpan={7} className={classes.border}>
                        {`${getCurrency(data.price)} * ${data.qty}`}
                        {(data.nDiscount && !!data.discount.percent) && (
                            <span className={classes.blue}>
                                {` - ${getCurrency(data.discount.amount)}(${handleLabel('nDiscount')}${data.discount.percent}%)`}
                            </span>
                        )}
                        {(data.points.enable && !!data.points.cost) && (
                            <span className={classes.red}>
                                {` - ${getCurrency(data.points.amount)}(${handleLabel('points')}${data.points.cost})`}
                            </span>
                        )}
                        {` = ${total}`}
                    </td>
                </tr>
                <tr>
                    <td className={classes.border}>
                        {handleLabel('remark')}
                    </td>
                    <td colSpan={6} className={classes.border}>
                        {data.remark}
                    </td>
                </tr>

            </tbody>
        )
    }

    window.onload = () => {
        console.log('loaded')
        window.print();
        window.close();
    }

    return (
        <div>
            <table className={classNames(classes.border, classes.root)}>
                <tbody>
                    <tr>
                        <th className={classes.w10} />
                        <td className={classes.w15} />
                        <th className={classes.w10} />
                        <td className={classes.w15} />
                        <th className={classes.w10} />
                        <td className={classes.w15} />
                        <th className={classes.w10} />
                        <td className={classes.w15} />
                    </tr>
                    <tr >
                        <th className={classes.border}>{handleLabel("date")}</th>
                        <td colSpan={3} className={classes.border}>
                            {d.toLocaleString()} ({handleLabel(d.getDay())})
                    </td>
                        <th className={classes.border}>{handleLabel("orderNo")}</th>
                        <td colSpan={3} className={classes.border}>
                            {state.id}
                            <span className={classes.red}>
                                {handleLabel(state.status)}
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("paymentMethod")}</th>
                        <td className={classes.border}>{handleLabel(state.payment.displayName)}</td>
                        <th className={classes.border}>{handleLabel("totalAmount")}</th>
                        <td className={classes.border}>{`${total.currency} ${getCurrency(total.totalAmount)}`}</td>
                        <th className={classes.border}>{handleLabel("logisticsMethod")}</th>
                        <td className={classes.border}>{handleLabel(state.logistics.displayName)}</td>
                        <th className={classes.border}>{handleLabel("shippingFee")}</th>
                        <td className={classes.border}>{`${total.currency} ${getCurrency(total.shipping)}`} </td>
                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("user")}</th>
                        <td colSpan={7} className={classes.border}>
                            <span className={classes.red}>{state.user.id}</span>
                            <span>{state.user.email}</span>
                            <span className={classes.blue}>{!!state.user.group && state.user.group.displayName[langCode]}</span>
                        </td>
                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("recipient")}</th>
                        <td colSpan={7} className={classes.border}>
                            <span className={classes.red}>{state.user.recipient.name}</span>
                            <span>{state.user.recipient.email}</span>
                            <span className={classes.blue}>{state.user.recipient.phone}</span>
                        </td>
                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("address")}</th>
                        <td colSpan={7} className={classes.border}>{address}</td>

                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("remark")}</th>
                        <td colSpan={7} className={classes.border}>{state.remark}</td>

                    </tr>

                    <tr>
                        <th className={classes.border}>{handleLabel("userRemark")}</th>
                        <td colSpan={7} className={classes.border}>{state.userRemark}</td>
                    </tr>

                    <tr>
                        <th colSpan={7} className={classes.border}>{handleLabel("product")}</th>
                        <th className={classes.border}>{handleLabel("rewardPoints")}</th>
                    </tr>
                </tbody>

                {items.filter(item => !item.error).map((item, key) => handleProduce(item, key))}

                <tbody>
                    <tr>
                        <th className={classes.border}>{handleLabel('subtotal')}</th>
                        <td className={classes.border}>{`${total.currency} ${getCurrency(total.subtotal - total.discount - total.pointsAmount)}`}</td>
                        <th className={classes.border}>{handleLabel('totalAmount')}</th>
                        <td className={classes.border}>{`${total.currency} ${getCurrency(total.totalAmount)}`}</td>
                        <th className={classes.border}>{handleLabel('rewardPoints')}</th>
                        <td className={classes.border}>{total.rewards}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}


export default Print
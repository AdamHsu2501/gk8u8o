import { getEvent } from './getEvent'
import { getFixed } from './getFixed'

export const getSKU = (data, exchangeRate, currency, locale, group) => {
    var event = getEvent(data.events)
    var listPrice = !!group && group.type === 'dealer' ? data.prices.wholesalePrice * exchangeRate : data.prices.price * exchangeRate;

    var percent, type
    if (!event) {
        percent = !!group && data.gDiscount ? group.percent : 0;
        type = !!group && (data.gDiscount || group.type === 'dealer') ? 'group' : null;
    } else {
        percent = event.percent
        type = 'event'
    }

    var banPoints = !!event || data.banPoints.includes(locale)

    return {
        ...data,
        currency: currency,
        rewards: banPoints ? 0 : data.rewardPoints,
        listPrice: getFixed(listPrice, currency),
        percent: percent,
        type: type,
        nDiscount: !!event ? false : data.nDiscount,
        points: {
            enable: false,
            locked: false,
            cost: 0,
            amount: 0
        },
        discount: {
            locked: false,
            percent: 0,
            amount: 0,
        },
        price: !type ? getFixed(listPrice, currency) : getFixed(listPrice * (100 - percent) / 100, currency),
        qty: 0,
        prevD: 0,
        prevS: 0,
        error: data.status === 'disabled' || data.status === 'outOfStock' || data.status === 'failed' ? data.status : null,
        selected: false,
        paymentId: null,
        paymentDate: null,
        paid: false,
        reserved: data.deduction,
        remark: '',
        adminRemark: '',
    }
}
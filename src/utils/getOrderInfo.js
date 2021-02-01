import { getFixed } from './getFixed'

export const getOrderInfo = (list, shippingFee, currency, country) => {

    var arr = list.filter(item => !item.error)
    var subtotal = getFixed(arr.map(i => i.price * i.qty).reduce((a, c) => a + c, 0), currency)
    var discount = getFixed(arr.filter(i => i.nDiscount).map(i => i.discount.amount).reduce((a, c) => a + c, 0), currency)
    var points = arr.filter(i => i.points.enable).map(i => i.points.cost).reduce((a, c) => a + c, 0)
    var pointsAmount = getFixed(arr.filter(i => i.points.enable).map(i => i.points.amount).reduce((a, c) => a + c, 0), currency)
    var totalAmount = getFixed(subtotal - discount - pointsAmount + shippingFee, currency)
    var rewards = getFixed(arr.map(i => i.rewards).reduce((a, c) => a + c, 0), currency)


    var locale
    if (country === 'TW' || country === 'JP') {
        locale = country
    } else if (country === 'CN' || country === 'HK' || country === 'MO') {
        locale = 'CN'
    } else {
        locale = 'others'
    }

    return {
        currency: currency,
        subtotal: subtotal,
        discount: discount,
        points: points,
        pointsAmount: pointsAmount,
        shipping: shippingFee,
        totalAmount: totalAmount,
        rewards: rewards,
        locale: locale
    }
}
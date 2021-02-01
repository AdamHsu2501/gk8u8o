import { getFixed } from './getFixed'

export const getDiscount = (items, dList, country, exchangeRate, totalPoints) => {

    var num = items.filter(item => item.selected && item.nDiscount).reduce((a, c) => a + c.qty, 0)
    var disc = dList.find(item => !item.ban.includes(country) && num >= item.MOQ)
    var discountPercent = !disc ? 0 : disc.percent

    var newPoints = totalPoints

    var list = items.map(item => {
        const { discount, points } = item
        const { cost } = points

        var percent, amount, newCost = 0

        if (item.selected && item.nDiscount) {
            percent = discount.locked ? discount.percent : discountPercent
            amount = getFixed(item.price * item.qty * percent / 100, item.currency)
        } else {
            percent = 0
            amount = 0
        }

        if (points.enable) {
            var pts = Math.ceil(((item.price * item.qty) - amount) / exchangeRate)
            if (points.locked) {
                newCost = pts > cost ? cost : pts
            } else {
                newCost = pts > newPoints + cost ? newPoints + cost : pts
            }
            newPoints += cost - newCost
        } else {
            newPoints += cost
        }

        return {
            ...item,
            discount: {
                ...item.discount,
                percent: percent,
                amount: amount,
            },
            points: {
                ...item.points,
                cost: newCost,
                amount: newCost * exchangeRate
            }
        }
    })

    return {
        items: list,
        points: newPoints,
    }
}
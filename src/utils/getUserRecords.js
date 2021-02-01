import { _orderStatus } from '../variables/Values'
export const getUserRecords = (prev, next) => {
    var a, p;
    //console.log('getUserRecords', prev, next)
    const pending = _orderStatus.slice(0, 2)
    const complete = _orderStatus.slice(2, 4)

    if (!!prev && !!next) {
        const pt = prev.total, ps = prev.status,
            nt = next.total, ns = next.status
        //console.log('ps', ps, pt)
        //console.log('ns', ns, nt)

        if (pending.includes(ps)) {
            if (pending.includes(ns)) {
                //console.log('00')
                a = 0
                p = pt.points - nt.points
            } else if (complete.includes(ns)) {
                //console.log('01')

                a = nt.totalAmount
                p = pt.points - nt.points + nt.rewards
            } else {
                //console.log('02')

                a = 0
                p = pt.points
            }
        } else if (complete.includes(ps)) {
            if (pending.includes(ns)) {
                //console.log('10')

                a = -pt.totalAmount
                p = pt.points - pt.rewards - nt.points

            } else if (complete.includes(ns)) {
                //console.log('11')

                a = nt.totalAmount - pt.totalAmount
                p = pt.points - pt.rewards - nt.points + nt.rewards
            } else {
                //console.log('12')

                a = -pt.totalAmount
                p = pt.points - pt.rewards
            }
        } else {
            if (pending.includes(ns)) {
                //console.log('20')

                a = 0
                p = -nt.points
            } else if (complete.includes(ns)) {
                //console.log('21')
                a = nt.totalAmount
                p = nt.rewards - nt.points
            } else {
                //console.log('22')
                a = 0
                p = 0
            }
        }
    } else {
        var c = !prev ? 1 : -1
        const temp = prev || next
        const tt = temp.total, ts = temp.status
        //console.log('temp', tt, ts)

        if (pending.includes(ts)) {
            //console.log('31')

            a = 0
            p = -tt.points * c
        } else if (complete.includes(ts)) {
            //console.log('32')

            a = tt.totalAmount * c
            p = (tt.rewards - tt.points) * c
        } else {
            //console.log('33')
            a = 0
            p = 0
        }
    }

    return { amount: a, points: p }
}
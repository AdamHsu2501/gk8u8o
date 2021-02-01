import { _tag } from '../variables/Values'

function arr_diff(a1, a2) {
    var after = JSON.stringify(a1)
    var before = JSON.stringify(a2)
    // console.log('after', after)
    // console.log('before', before)

    return a1.filter(i => !before.includes(JSON.stringify(i))).map(i => `null > ${JSON.stringify(i)}`).concat(
        a2.filter(i => !after.includes(JSON.stringify(i))).map(i => `${JSON.stringify(i)} > null `)
    )
}

const filterList = [..._tag, 'id', 'date', 'update', 'tags', 'tagQuery', 'menu']

const findDifferent = (x, y, filter) => {
    var changes = {}
    Object.keys(x).filter(key => filter ? !filterList.includes(key) : true).forEach(key => {
        var after = x[key]
        var before = !y ? null : y[key]

        if (typeof (after) === 'object' && after !== null) {
            if (Array.isArray(after)) {
                var arr = arr_diff(after.sort(), !before ? [] : before.sort())
                if (!!arr.length) {
                    changes[key] = arr
                }
            } else {
                var temp = findDifferent(after, before, false)
                if (!!temp) {
                    changes[key] = temp
                }
            }

        } else {
            if (after !== before) {
                changes[key] = `${before} > ${after}`
            }
        }
    }, {})

    return !Object.keys(changes).length ? null : changes
}


export function getDifferent(x, y) {
    var changes = !x ? JSON.stringify(y) : findDifferent(x, y, true);
    return changes
}
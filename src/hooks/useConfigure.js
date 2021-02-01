import { useState, useEffect } from 'react';
import { useFirebase, _order } from '../Firebase'
import { _tag } from '../variables/Values'

export const useConfigure = () => {
    const { auth, country } = useFirebase()

    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        if (refresh) {
            setTimeout(() => {
                setRefresh(false)
            }, 2000)
        }
    }, [refresh])

    var d = new Date();
    d.setDate(d.getDate() - 14)

    var id = !auth ? 0 : auth.id
    var lv = !auth || !auth.group ? 0 : auth.group.lv
    var filters = `NOT status:disabled AND lv<=${lv} AND permit:${country}`
    var rankFilters = filters.concat(` AND date >= ${d.getTime()}`)
    var followFilters = filters.concat(` AND followers:${id}`)
    var commentFilters = `NOT type:${_order}`
    var messageFilters = `user.id:${id}`
    return {
        limit: 3,
        showMoreLimit: 2000,

        refresh: refresh,
        setRefresh: setRefresh,
        filters: filters,
        searchPerPage: 5,

        rankFilters: rankFilters,
        rankPerPage: 6,

        followFilters: followFilters,
        productPerPage: 30,
        productList: ['status'],
        productMenu: _tag.concat(['size', 'scale']),

        commentFilters: commentFilters,
        commentPerPage: 20,

        messageFilters: messageFilters,
        messagePerPage: 20,

        orderPerPage: 20,
        orderList: ['status']
    }
}
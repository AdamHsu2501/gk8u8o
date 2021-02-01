import React from 'react'; //{ useState, useEffect, useCallback } 
//import { Grid } from '@material-ui/core';

// import { _scope } from '../../../variables/Values'
// import { useFirebase } from '../../../Firebase'

import MapReport from './MapReport'
// import OrderReport from './OrderReport'
// import MsgReport from './MsgReport'


// const getTimes = (date, scope) => {
//     var d = new Date(date), start, end, unit
//     if (scope === 'day') {
//         start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
//         end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
//         unit = 'hour'
//     } else if (scope === 'week') {
//         var diff = d.getDate() - d.getDay()
//         var day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
//         start = new Date(day.setDate(diff))
//         end = new Date(day.setDate(diff + 7))
//         unit = 'day'
//     } else if (scope === 'month') {
//         start = new Date(d.getFullYear(), d.getMonth())
//         end = new Date(d.getFullYear(), d.getMonth() + 1)
//         unit = 'week'
//     } else if (scope === 'year') {
//         start = new Date(d.getFullYear(), 0)
//         end = new Date(d.getFullYear() + 1, 0)
//         unit = 'month'
//     } else {
//         start = new Date(0)
//         end = new Date(d.getFullYear() + 100, 0)
//         unit = 'year'
//     }

//     return {
//         date: date,
//         scope: scope,
//         unit: unit,
//         start: start,
//         end: end,
//     }
// }


const Dashboard = ({ path }) => {
    // const { auth, handleLabel } = useFirebase()


    // const [loading, setLoading] = useState(true)
    // const [state, setState] = useState({
    //     scope: null,
    //     unit: null,
    //     date: null,
    //     start: null,
    //     end: null,
    // });

    // useEffect(() => {
    //     var data = getTimes(Date.now(), _scope[0])
    //     setState(data)
    //     setLoading(false)
    // }, [])

    // const handleChange = useCallback((id, value, parentId) => {
    //     console.log('handleChange', id, value, parentId)
    //     setState(prev => {
    //         var scope = id === 'scope' ? value : prev.scope;
    //         var date = id === 'date' ? value : prev.date
    //         return getTimes(date, scope)
    //     })
    // }, [])

    // if (loading) {
    //     return <div>Loading...</div>
    // }

    // if (auth.admin === 2 || !!auth.permission.ORDER || !!auth.permission.MESSAGE) {

    //     return (
    //         <Grid container spacing={4}>
    //             <Grid item xs={8} sm={3}>
    //                 <MemoDatePicker
    //                     id='date'
    //                     value={state.date}
    //                     onChange={handleChange}
    //                 />
    //             </Grid>

    //             <Grid item xs={4} sm={3}>
    //                 <MemoTextField
    //                     id='scope'
    //                     label={handleLabel('scope')}
    //                     value={state.scope}
    //                     onChange={handleChange}
    //                     options={_scope.map(id => ({ label: handleLabel(id), value: id }))}
    //                 />
    //             </Grid>

    //             {(auth.admin === 2 || auth.permission.ORDER.read) && (
    //                 <Grid item xs={12}>
    //                     <OrderReport state={state} />
    //                 </Grid>
    //             )}

    //             {(auth.admin === 2 || auth.permission.MESSAGE.read) && (
    //                 <Grid item xs={12}>
    //                     <MsgReport state={state} />
    //                 </Grid>
    //             )}

    //         </Grid >
    //     );
    // }else{

    return (
        <div>
            <MapReport />

        </div>
    )
    // }

}


export default Dashboard
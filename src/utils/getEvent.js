export const getEvent = (list) => {
    var d = Date.now()
    return list.find(item => item.start <= d && item.end > d)
}
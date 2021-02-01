export const getCurrency = (price) => {
    return new Intl.NumberFormat().format(price)
}
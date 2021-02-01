export const getFixed = (n, currency) => {
    return currency === 'USD' ? Math.round(n * 100) / 100 : Math.round(n)
}
export const getPaypalOrder = ((handleLabel, id, description, info, items) => {
    return {
        application_context: {
            locale: "en-US",
        },
        purchase_units: [{
            reference_id: id, // "PUHF", //
            description: description,
            amount: {
                currency_code: info.currency,
                value: info.totalAmount,
                breakdown: {
                    item_total: {
                        currency_code: info.currency,
                        value: info.subtotal - info.discount - info.pointsAmount
                    },
                    shipping: {
                        currency_code: info.currency,
                        value: info.shipping
                    },
                    discount: {
                        currency_code: info.currency,
                        value: info.discount
                    }
                }
            },
            items: items.filter(item => item.type === 'product').map(item => ({
                name: handleLabel(item.displayName),
                sku: item.code,
                unit_amount: {
                    currency_code: info.currency,
                    value: item.price
                },
                quantity: item.qty
            }))
        }],
    }
})
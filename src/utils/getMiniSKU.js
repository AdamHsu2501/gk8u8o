export const getMiniSKU = (item, paymentId, paymentDate) => {
    return {
        adminRemark: item.adminRemark,
        code: item.code,
        currency: item.currency,
        deduction: item.deduction,
        discount: {
            ...item.discount,
            locked: true,
        },
        displayName: item.displayName,
        error: item.error,
        id: item.id,
        images: item.images.slice(0, 1),
        nDiscount: item.nDiscount,
        paid: paymentDate ? true : item.paid,
        paymentDate: paymentDate || item.paymentDate,
        paymentId: paymentId || item.paymentId,
        points: {
            ...item.points,
            locked: true,
        },
        price: item.price,
        qty: item.qty,
        remark: item.remark,
        reserved: item.reserved,
        rewards: item.rewards,
        status: item.status,
        type: item.type,
    }
}
import React from 'react';
import { useParams, useLocation } from 'react-router-dom'

import Firebase, { _order, _message, useFirestoreQuery } from '../../Firebase'
import OrderPanel from '../../components/Panel/OrderPanel'
import ReturnButton from '../../components/Button/ReturnButton'


const OrderView = () => {
    const { state } = useLocation();
    let { topicId } = useParams();

    const order = useFirestoreQuery({
        ref: Firebase.firestore().collection(_order).doc(topicId),
        data: state,
        required: true
    })

    const messages = useFirestoreQuery({
        ref: Firebase.firestore().collection(_message).doc(topicId),
    })

    if (order.loading || messages.loading) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <ReturnButton />
            <OrderPanel
                order={order.data}
                messages={messages.data}
            />
        </div>
    )
}

export default OrderView
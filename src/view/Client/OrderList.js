import React from 'react';
import { Switch, Route } from 'react-router-dom'
import * as ROUTES from '../../routes'
import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, _order } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'

import OrderView from './OrderView'

const OrderList = ({ location }) => {
    const { handleLabel } = useFirebase()
    const { orderPerPage, orderList } = useConfigure()

    return (
        <Algolia indexName={_order} list={orderList} filterButton={true} seo={true} pagination={true}>
            <Switch>
                <Route exact path={ROUTES.MYORDER}>
                    <IndexPanel
                        indexName={_order}
                        label={handleLabel('myOrder')}
                        hitsPerPage={orderPerPage}
                    />
                </Route>

                <Route path={`${ROUTES.MYORDER}/:topicId`}>
                    <OrderView />
                </Route>
            </Switch>
        </Algolia>
    );
}

export default OrderList

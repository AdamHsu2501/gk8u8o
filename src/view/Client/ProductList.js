import React from 'react';
import { Divider } from '@material-ui/core'
import { Switch, Route, useLocation } from 'react-router-dom'

import * as ROUTES from '../../routes'
import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, _stock, _ranking } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'

import ProductView from './ProductView'

const ProductList = ({ location }) => {
    const { handleLabel } = useFirebase()
    const { pathname } = useLocation()
    const { filters, rankFilters, productPerPage, rankPerPage, productList, productMenu } = useConfigure()

    return (
        <Algolia
            indexName={_stock}
            list={productList}
            menu={productMenu}
            filterButton={true}
            seo={true}
            pagination={pathname === ROUTES.LIST}
        >
            <Switch>
                <Route exact path={ROUTES.LIST}>
                    <IndexPanel
                        indexName={_ranking}
                        label={handleLabel('ranking')}
                        filters={rankFilters}
                        hitsPerPage={rankPerPage}
                    />

                    <Divider style={{ margin: '10% 0' }} />

                    <IndexPanel
                        indexName={_stock}
                        label={handleLabel('new')}
                        filters={filters}
                        hitsPerPage={productPerPage}
                    />
                </Route>

                <Route path={`${ROUTES.LIST}/:topicId`}>
                    <ProductView />
                </Route>
            </Switch>
        </Algolia>
    );
}

export default ProductList


import React from 'react';

import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, _stock } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'


const FollowList = ({ location }) => {
    const { handleLabel } = useFirebase()
    const { followFilters, productPerPage, productList } = useConfigure()

    return (
        <Algolia indexName={_stock} list={productList} pagination={true} >
            <IndexPanel
                indexName={_stock}
                label={handleLabel('followList')}
                filters={followFilters}
                hitsPerPage={productPerPage}
            />
        </Algolia>
    );
}

export default FollowList


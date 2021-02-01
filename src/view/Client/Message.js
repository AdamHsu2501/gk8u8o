import React from 'react';

import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, _message } from '../../Firebase';
import { useConfigure } from '../../hooks/useConfigure'


const Message = ({ location }) => {
    const { handleLabel } = useFirebase()
    const { messageFilters, messagePerPage } = useConfigure()

    return (
        <Algolia indexName={_message} pagination={true} >
            <IndexPanel
                indexName={_message}
                type='comment'
                label={handleLabel('myMessage')}
                filters={messageFilters}
                hitsPerPage={messagePerPage}
                searchBox={true}
            />
        </Algolia>
    );
}

export default Message


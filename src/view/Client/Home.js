import React, { useState } from 'react';
import { Grid } from '@material-ui/core';

import Algolia from '../../Algolia'
import IndexPanel from '../../Algolia/IndexPanel'
import { useFirebase, useInfo, _stock, _ranking } from '../../Firebase'
import { useConfigure } from '../../hooks/useConfigure'
import AccordionPanel from '../../components/Panel/AccordionPanel'
import TabPanel from '../../components/Panel/TabPanel'

const Home = (props) => {
    const { country, handleLabel, attentions, tabs } = useFirebase()
    // const {  } = useInfo()
    const { filters, rankFilters, productPerPage, rankPerPage } = useConfigure()
    var tabList = tabs.filter(item => !item.permit.length || item.permit.includes(country)).map(item => ({
        label: handleLabel(item.tag.displayName),
        id: item.tag.id,
        attribute: item.attribute
    }))
    const [tabNum, setTabNum] = useState(0)
    const tab = tabList[tabNum]

    const handleTab = (event, value) => {
        setTabNum(value);
    };

    var newFilters = !tab ? filters : filters.concat(!tab.attribute ? ` AND tagQuery: ${tab.id}` : ` AND tag.${tab.attribute}: ${tab.id}`)

    return (
        <Algolia indexName={_stock}>
            <Grid container spacing={1}>
                {!!attentions.length && (
                    <Grid item xs={12}>
                        {attentions.map((item, key) => (
                            <AccordionPanel key={key} data={item} />
                        ))}
                    </Grid>
                )}

                <Grid item xs={12} >
                    <IndexPanel
                        indexName={_ranking}
                        label={handleLabel('ranking')}
                        filters={rankFilters}
                        hitsPerPage={rankPerPage}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TabPanel list={tabList} value={tabNum} onSubmit={handleTab} />
                </Grid>

                <Grid item xs={12} >
                    <IndexPanel
                        indexName={_stock}
                        label={handleLabel('new')}
                        filters={newFilters}
                        hitsPerPage={productPerPage}
                    />
                </Grid>
            </Grid>
        </Algolia>
    )
}

export default Home
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Accordion, AccordionSummary, AccordionDetails, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { useFirebase } from '../../Firebase'

const StylePanel = withStyles({
    root: {
        boxShadow: 'none',
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(Accordion);

const StylePanelSummary = withStyles({
    root: {
        backgroundColor: 'rgba(0, 0, 0, .03)',
        borderTop: '3px solid #fff',
        minHeight: 18,
        '&$expanded': {
            minHeight: 18,
        },
    },
    content: {
        '&$expanded': {
            margin: '12px 0',
        },
    },
    expanded: {},
})(AccordionSummary);

const StylePanelDetails = withStyles(theme => ({
    root: {
        padding: theme.spacing(2),
        backgroundColor: 'rgba(0, 0, 0, .03)',
    },
}))(AccordionDetails);

const AccordionPanel = ({ data }) => {
    const { handleLabel } = useFirebase()
    const [expanded, setExpanded] = React.useState(false);
    var d = new Date(data.date)

    return (
        <StylePanel square expanded={expanded} onChange={() => setExpanded(prev => !prev)}>
            <StylePanelSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container justify="space-between" alignItems="baseline">
                    <Typography>{handleLabel(data.displayName)}</Typography>
                    <Typography color="textSecondary" variant="body2">{d.toLocaleDateString()}</Typography>
                </Grid>
            </StylePanelSummary>
            <StylePanelDetails>
                <Typography>{handleLabel(data.text)}</Typography>
            </StylePanelDetails>
        </StylePanel>
    );
}

export default AccordionPanel
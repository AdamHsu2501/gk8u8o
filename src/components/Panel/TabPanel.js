import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Tabs, Tab } from '@material-ui/core';
import { orange } from '@material-ui/core/colors';

const AntTabs = withStyles({
    root: {
        borderBottom: '1px solid #e8e8e8',
    },
    indicator: {
        backgroundColor: orange[400],
        height: 5
    },
})(Tabs);

const AntTab = withStyles(theme => ({
    root: {
        textTransform: 'none',
        minWidth: 72,
        fontSize: 22,
        fontWeight: theme.typography.fontWeightRegular,
        marginRight: theme.spacing(2),
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        '&:hover': {
            color: orange[200],
            opacity: 1,
        },
        '&$selected': {
            color: orange[400],
            fontWeight: theme.typography.fontWeightBold,
        },
    },
    selected: {},
}))(props => <Tab disableRipple {...props} />);

const TabPanel = ({ list, value, onSubmit }) => {
    return (
        <AntTabs value={value} onChange={onSubmit} >
            {list.map((item, key) => (
                <AntTab key={key} label={item.label} id={item.id} />
            ))}
        </AntTabs>
    )
}

export default TabPanel
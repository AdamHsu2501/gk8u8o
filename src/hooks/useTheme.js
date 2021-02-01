import React from 'react'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core'
import { blue } from '@material-ui/core/colors';
import { SnackbarProvider } from 'notistack';

import { useApp } from './useApp'

const _themes = {
    dark: {
        palette: {
            type: "dark",
            primary: blue
        },
        overrides: {
            MuiToolbar: {
                root: {
                    height: 128
                }
            },
            // MuiBadge: {
            //     anchorOriginTopRightCircle: {
            //         zIndex: 1301,
            //     },
            // },
        }
    },
    light: {
        palette: {
            // primary: {
            //     main: orange[500]
            // },
            background: {
                default: '#FFFFFF'
            },
            type: "light"
        },
        overrides: {
            MuiDrawer: {
                paperAnchorDockedLeft: {
                    borderRight: "none"
                },
                paperAnchorDockedRight: {
                    borderLeft: "none"
                },
            },
            MuiBadge: {
                anchorOriginTopRightRectangle: {
                    top: '3%',
                    right: '12%'
                },
            },
            MuiToolbar: {
                root: {
                    height: 128
                }
            },
        },
    },
}


export const ProvideTheme = ({ children }) => {
    const { isAdmin } = useApp()
    const theme = createMuiTheme(_themes[isAdmin ? 'dark' : 'light'])
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider preventDuplicate maxSnack={3}>
                {children}
            </SnackbarProvider>
        </ThemeProvider>
    );
}


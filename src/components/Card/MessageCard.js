import React from 'react';
import classNames from 'classnames'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Paper, Typography, Avatar, Button } from '@material-ui/core';
import { ContactSupport, Person } from '@material-ui/icons';
import MuiAlert from '@material-ui/lab/Alert';
import moment from 'moment'
import 'moment/locale/zh-tw';

import * as ROUTES from '../../routes'
import { _noImage } from '../../variables/Values'
import { useFirebase, _message, _order } from '../../Firebase'
import { useApp } from '../../hooks/useApp'
import ImageDialog from '../Dialog/ImageDialog';

const useStyles = makeStyles(theme => ({
    alert: {
        alert: '100%',
        marginBottom: theme.spacing(2)
    },
    root: {
        display: 'flex',
        maxWidth: '80%',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap'
    },
    content: {
        marginLeft: theme.spacing(2),
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        background: theme.palette.divider
    },
    right: {
        display: 'flex',
        marginTop: 8,
        justifyContent: 'flex-end'
    },
    img: {
        width: "100%"
    },
    link: {
        cursor: 'pointer',
        opacity: 1,
        '&:hover': {
            opacity: 0.5,
        }
    },
    orderTitle: {
        color: theme.palette.warning.main,
    },
}))

function encode(value) {
    return value.replace(/./g, '*');
}

const useMessage = (data, isAdmin, isSelf, isPublic) => {
    const { handleLabel } = useFirebase()

    var d = new Date(data.date)
    var displayName, photoURL;
    if (data.isAdmin) {
        displayName = isAdmin ? data.displayName : handleLabel('CSR')
        photoURL = isAdmin ? data.photoURL : null
    } else {
        if (isSelf) {
            displayName = data.displayName
        } else if (isPublic) {
            displayName = data.displayName.slice(0, 1).concat(encode(data.name.slice(1)))
        } else {
            displayName = encode(data.displayName)
        }
        photoURL = isSelf || isPublic ? data.photoURL : null
    }

    return {
        ...data,
        photoURL: photoURL,
        displayName: displayName,
        text: isSelf || isPublic ? data.text : encode(data.text),
        images: isSelf || isPublic ? data.images : [],
        date: moment(d).fromNow(),
        deletable: Date.now() - data.date < 10800000
    }
}

const MessageItem = ({ index, item, isAdmin, isSelf, isPublic, onDelete }) => {
    const { handleLabel, } = useFirebase()
    const classes = useStyles();

    var data = useMessage(item, isAdmin, isSelf, isPublic)
    var avatar
    if (!data.photoURL) {
        avatar = data.isAdmin ? (
            <Avatar>
                <ContactSupport />
            </Avatar>
        ) : (
                <Avatar>
                    <Person />
                </Avatar>
            )
    } else {
        avatar = <Avatar alt={data.name} src={data.photoURL} />
    }



    return (
        <div className={classes.root}>
            {avatar}

            <div>
                <Paper className={classes.content}>
                    <Typography variant="subtitle2" gutterBottom >{data.displayName}</Typography>
                    <Typography >{data.text}</Typography>

                    <div>
                        {data.images.map((item, key) => (
                            <ImageDialog key={key} src={item.preview} />
                        ))}
                    </div>
                </Paper>
                <Grid container justify="flex-end" alignItems="center">
                    {(isSelf && data.isAdmin === isAdmin && data.deletable) && (
                        <Button onClick={() => onDelete(index)} >
                            {handleLabel('delete')}
                        </Button>
                    )}
                    <Typography variant="caption"  >{data.date}</Typography>
                </Grid>
            </div>
        </div>
    )
}

export const MessageCard = ({ hit }) => {
    const classes = useStyles()
    const { isAdmin } = useApp()
    const { auth, handleLabel, updateFirestore, deleteFirestore } = useFirebase()

    if (!hit) {
        return null
    }

    const deleteMessage = (index) => {
        if (index === 0) {
            deleteFirestore(`${_message}/${hit.id}`)
        } else {
            var arr = hit.messages
            arr.splice(index, 1)
            updateFirestore(`${_message}/${hit.id}`, { messages: arr }, true)
        }
    }

    return (
        <Grid container spacing={1}>
            {(isAdmin && !!hit.remark) && (
                <MuiAlert elevation={6} variant="filled" severity="error" className={classes.alert} >
                    {`${handleLabel('remark')} ${hit.remark}`}
                </MuiAlert>
            )}

            {hit.messages.map((item, key) => (
                <Grid key={key} item container justify={item.isAdmin ? 'flex-end' : 'flex-start'} >
                    <MessageItem
                        id={hit.id}
                        index={key}
                        item={item}
                        isAdmin={isAdmin}
                        isSelf={hit.user.id === auth.id}
                        isPublic={hit.public}
                        onDelete={deleteMessage}
                    />
                </Grid >
            ))}
        </Grid>
    )
}

export const CommentCard = ({ hit }) => {
    const classes = useStyles()
    const { target, type, id } = hit
    let history = useHistory()
    const { handleLabel } = useFirebase()

    const handleClick = () => {
        if (type === 'product') {
            history.push(`${ROUTES.LIST}/${target.id}`)
        } else if (ROUTES.ORDER.includes(type)) {
            history.push(`${ROUTES.MYORDER}/${target.id}`)
        }
    }

    var displayName
    if (type === 'product') {
        displayName = `${target.code} ${handleLabel(target.displayName)}`
    } else if (ROUTES.ORDER.includes(type)) {
        displayName = `${handleLabel('orderNo')} ${id}`
    } else {
        displayName = null
    }

    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <Typography
                    className={classNames(classes.link, type === _order && classes.orderTitle)}
                    onClick={handleClick}
                >
                    {displayName}
                </Typography>
            </Grid>

            <Grid item xs={12} sm={3} md={2} className={classes.link} >
                {!!target && (
                    <img
                        src={target.images[0]}
                        alt={target.id}
                        onError={(e) => e.target.src = _noImage}
                        className={classes.img}
                        onClick={handleClick}
                    />
                )}
            </Grid>

            <Grid item xs={12} sm={9} md={10}>
                <MessageCard hit={hit} />
            </Grid>
        </Grid>
    )
}
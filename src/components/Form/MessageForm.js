import React, { useState, useCallback } from 'react';
import { Grid, Button, Typography, Container } from '@material-ui/core';
import { Send } from '@material-ui/icons';

import { _msgStatus, APP_NAME, APP_EMAIL } from '../../variables/Values'
import { _message, useFirebase, updateStorage, handleEmail } from '../../Firebase'
import { Dropzone } from '../Field/Dropzone'
import TextField from '../Field/TextField'
import SelectField from '../Field/SelectField'
import SlideDialog from '../Dialog/SlideDialog'
import { MessageCard } from '../Card/MessageCard'
import { getDifferent } from '../../utils/getDifferent'


const MessageForm = ({ disabled, isAdmin, title, open, onClose, target, data, templates }) => {
    const { auth, langCode, handleLabel, updateFirestore } = useFirebase();

    const [loading, setLoading] = useState(false)
    const [state, setState] = useState({
        template: null,
        text: '',
        images: [],
    })

    const handleText = (e, value) => {
        if (!value) {
            setState(prev => ({
                ...prev,
                text: "",
                template: null,
            }))
        } else {

            var text = value.text
            var match = text.match(/{\w*}/g)
            if (!!match) {
                match.filter((item, key, self) => self.indexOf(item) === key).forEach(id => {
                    var obj = data.user
                    var temp = obj[id.slice(1, -1)]
                    text = text.split(id).join(temp)
                })
            }

            setState(prev => ({
                ...prev,
                text: text,
                template: value
            }))
        }
    }

    const handleChange = useCallback((id, value, parentId) => {
        return setState(prev => ({
            ...prev,
            [id]: value
        }))
    }, [])

    const handleUpdate = () => {
        setLoading(true)
        var d = Date.now();

        var newData
        if (!!data) {
            newData = {
                ...data,
                update: d,
                status: isAdmin ? _msgStatus[1] : _msgStatus[0]
            }
        } else {
            var temp = {}
            if (!target) {
                temp = {
                    id: `msg${d}`,
                    language: langCode,
                    user: {
                        id: auth.id,
                        email: auth.email,
                        displayName: auth.displayName,
                    },
                    target: null,
                    type: 'comment'
                }
            } else {
                if (!target.code) {
                    temp = {
                        id: target.id,
                        language: isAdmin ? target.user.language : langCode,
                        target: {
                            id: target.id,
                            displayName: target.id,
                            images: target.items.map(item => item.images[0].preview),
                        },
                        user: {
                            id: target.user.id,
                            email: target.user.email,
                            displayName: target.user.displayName
                        },
                        type: 'order'
                    }
                } else {
                    temp = {
                        id: `msg${d}`,
                        language: langCode,
                        user: {
                            id: auth.id,
                            email: auth.email,
                            displayName: auth.displayName,
                        },
                        target: {
                            id: target.id,
                            displayName: target.displayName,
                            code: target.code,
                            images: [target.images[0].preview]
                        },
                        type: 'product'
                    }
                }
            }

            newData = {
                ...temp,
                create: d,
                update: d,
                status: isAdmin ? _msgStatus[1] : _msgStatus[0],
                public: false,
                messages: [],
                remark: '',
            }
        }

        var path = `${_message}/${newData.id}`

        Promise.all(
            state.images.map((item, key) => {
                return updateStorage(path, `${d}-${key}`, item)
            })
        )
            .then(results => {
                var message = {
                    isAdmin: !!isAdmin,
                    date: d,
                    text: state.text,
                    images: results,
                    id: auth.id,
                    email: auth.email,
                    photoURL: auth.photoURL,
                    displayName: isAdmin ? auth.displayName : newData.user.displayName,
                }

                newData.messages.push(message)
                var change = isAdmin ? getDifferent(state, null) : null

                var temp = null
                if (!!newData.target) {
                    if (!!newData.target.code) {
                        temp = {
                            displayName: `(${newData.target.code}) ${handleLabel(newData.target.displayName, newData.language)}`,
                            images: newData.target.images
                        }
                    } else {
                        temp = {
                            displayName: `${handleLabel('orderNo', newData.language)} ${newData.target.id}`,
                            images: newData.target.images
                        }
                    }
                }

                var email = {
                    from: APP_NAME,
                    to: isAdmin ? newData.user.email : APP_EMAIL,
                    subject: isAdmin ? handleLabel('emailReply', newData.language) : handleLabel('emailComment', 'zh-tw'),
                    template: _message,
                    context: {
                        ...message,
                        systemEmail: handleLabel('systemEmail', isAdmin ? newData.language : 'zh-tw'),
                        name: isAdmin ? APP_NAME : message.displayName,
                        email: isAdmin ? APP_EMAIL : message.email,
                        text: message.text.replace(/(\r\n|\n|\r)/gm, '<br>'),
                        target: temp,
                        href: window.location.origin,
                        APP_NAME: APP_NAME,
                    }
                }

                if (isAdmin) {
                    handleEmail(email, newData.type === 'product' ? 'orderMsg' : 'comment', newData.language)
                    return updateFirestore(path, newData, false, change)
                } else {
                    return Promise.all([
                        updateFirestore(path, newData, false, change),
                        handleEmail(email, newData.type === 'product' ? 'orderMsg' : 'comment', newData.language)
                    ])
                }
            })
            .then(() => {
                setTimeout(() => {
                    setLoading(false)
                    setState({
                        text: '',
                        template: null,
                        images: []
                    })
                    onClose()
                }, isAdmin ? 0 : 1000);
            })
    }

    return (
        <SlideDialog
            open={open}
            loading={loading}
            title={title || <Typography variant="h6">{handleLabel('leaveAMessage')}</Typography>}
            onClose={onClose}
            content={(isAdmin && !!data) && (
                <Container fixed>
                    <MessageCard hit={data} />
                </Container>
            )}
            actions={!disabled && (
                <Grid container>
                    {(!!templates && isAdmin) && (
                        <Grid item xs={6}>
                            <SelectField
                                id="template"
                                label={handleLabel('template')}
                                value={state.template}
                                multiple={false}
                                onChange={handleText}
                                options={templates}
                                getOptionLabel={opt => opt.displayName}
                                getValue={opt => opt}
                            />
                        </Grid>
                    )}

                    <Grid item xs={12} >
                        <TextField
                            id='text'
                            label={handleLabel('message')}
                            value={state.text}
                            onChange={handleChange}
                            multiline
                            rows={5}
                            rowsMax={5}
                        />
                    </Grid>

                    <Grid item xs={12} >
                        <Dropzone
                            id='images'
                            label={handleLabel('image')}
                            value={state.images}
                            onChange={handleChange}
                            multiple
                            helperText={handleLabel('dropzoneHelper')}
                            msgMode
                        />
                    </Grid>
                    <Grid item container justify="flex-end">
                        <Button
                            disabled={!state.text.replace(/\s/g, '').length && !state.images.length}
                            variant="contained"
                            onClick={handleUpdate}
                            color="primary"
                            endIcon={<Send />}
                        >
                            {handleLabel('send')}
                        </Button>
                    </Grid>
                </Grid>
            )}
        />
    )
}

export default MessageForm
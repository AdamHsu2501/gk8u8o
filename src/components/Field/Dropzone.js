import React, { memo } from 'react'
import clsx from 'clsx'
import { useDropzone } from 'react-dropzone'
import { makeStyles } from '@material-ui/core/styles';
import { Badge, Grid, Typography, IconButton } from '@material-ui/core';
import { Cancel, Photo } from '@material-ui/icons';
import { GridContextProvider, GridDropZone, GridItem, swap } from "react-grid-dnd";


const height = 240

const useStyles = makeStyles(theme => ({
    margin: {
        marginBottom: theme.spacing(2)
    },
    root: {
        outline: 'none',
        cursor: 'pointer',
    },
    width: {
        width: '100%',
    },
    border: {
        borderWidth: 4,
        borderRadius: 4,
        borderStyle: 'dashed',
    },
    grey: {
        borderColor: theme.palette.text.secondary,
    },
    info: {
        borderColor: theme.palette.info.main,
    },
    padding: {
        padding: theme.spacing(1)
    },
    thumb: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
        height: height,
    },
    img: {
        width: "100%",
        display: 'block',
    },
    tag: {
        position: 'absolute',
        top: 0,
        left: 0,
        background: theme.palette.info.main,
        padding: theme.spacing(0, 1)
    },
    mask: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: "100%",
        height: '100%',
    },
    divider: {
        borderTopColor: theme.palette.secondary.main,
        borderTopStyle: 'dashed',
        borderTopWidth: 2
    }
}));



export const Dropzone = memo(({ disabled, id, multiple, value, onChange, helperText, msgMode }) => {
    // console.log('---Dropzone', id, value)

    const classes = useStyles();
    const { getRootProps, getInputProps } = useDropzone({
        disabled: disabled,
        accept: "image/*",
        multiple: multiple,
        onDrop: acceptedFiles => {
            var files = acceptedFiles.map(item =>
                Object.assign(item, {
                    preview: URL.createObjectURL(item),
                })
            );

            if (multiple) {
                files = value.concat(files.filter(file => !value.find(item => item.name === file.name)))
            }

            onChange(id, files)
        }
    })

    var totalHeight = `${(Math.ceil(value.length / 4) * height)}px`

    const clearImg = key => () => {
        var arr = [...value]
        arr.splice(key, 1)
        onChange(id, arr)
    }

    function handleChange(sourceId, sourceIndex, targetIndex, targetId) {
        const nextState = swap(value, sourceIndex, targetIndex);
        onChange(id, nextState);
    }

    if (disabled) {
        return (
            <Grid container spacing={2} className={classes.divider}>
                {value.map((item, key) => (
                    <Grid key={key} item xs={6} sm={2}>
                        <img
                            className={classes.img}
                            src={item.preview}
                            alt={item.name}
                        />
                    </Grid>
                ))}
            </Grid>
        )
    }

    return (
        <Grid container direction="column" spacing={1} className={classes.margin}>
            <Grid {...getRootProps({ className: classes.root })} item container justify="center">
                <input {...getInputProps()} />
                {!multiple && value.length > 0 ? (
                    <Badge
                        overlap="circle"
                        badgeContent={
                            <IconButton onClick={clearImg(0)}>
                                <Cancel color="secondary" />
                            </IconButton>
                        }
                        className={clsx(classes.border, classes.grey, classes.width)}
                    >
                        <img
                            className={classes.img}
                            src={value[0].preview}
                            alt={value[0].name}
                        />
                    </Badge>
                ) : (
                        <Grid
                            container
                            direction="column"
                            justify="center"
                            alignItems="center"
                            className={
                                clsx(classes.border, classes.grey, classes.padding)
                            }
                        >
                            <Photo fontSize="large" />
                            <Typography color="textSecondary" >{helperText}</Typography>
                        </Grid>
                    )}
            </Grid >

            {multiple && (
                <Grid item xs={12}>
                    <GridContextProvider onChange={handleChange}>
                        <GridDropZone
                            boxesPerRow={4}
                            rowHeight={height}
                            style={{ height: totalHeight }}
                        >
                            {value.map((item, key) => (
                                <GridItem key={item.name} >
                                    <Badge
                                        overlap="circle"
                                        badgeContent={
                                            <IconButton onClick={clearImg(key)}>
                                                <Cancel color="secondary" />
                                            </IconButton>
                                        }
                                        className={!msgMode && key === 0 ?
                                            clsx(classes.thumb, classes.border, classes.info)
                                            :
                                            clsx(classes.thumb, classes.border, classes.grey)
                                        }
                                    >
                                        <img
                                            className={classes.img}
                                            src={item.preview}
                                            alt={item.name}
                                        />
                                    </Badge>
                                    {!msgMode && key === 0 && (
                                        <Typography className={classes.tag}>Icon</Typography>
                                    )}
                                    <div className={classes.mask} />
                                </GridItem>
                            ))}
                        </GridDropZone>
                    </GridContextProvider>
                </Grid>
            )
            }
        </Grid >
    );
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next))
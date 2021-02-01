import React from 'react';
import { Grid, Button } from '@material-ui/core';

import { useFirebase } from '../../Firebase';

import TitleField from './TitleField'
import CheckboxField from './CheckboxField'
import TextField from './TextField'
import NumberField from './NumberField'
import SelectField from './SelectField'
import { MemoDateTimePicker } from './DateTimePicker'
import { Dropzone } from './Dropzone';
import EventField from './EventField'

const filterDisplay = (state, operator, value) => {
    switch (operator) {
        case '>':
            return state > value
        case '>=':
            return state >= value
        case '===':
            return state === value
        case '!==':
            return state !== value
        case '<':
            return state < value
        case '<=':
            return state <= value
        default:
            return false
    }
}

const Field = ({ state, disabled, item, value, onChange, onCheck, onAdd, onDelete, path }) => {
    const { handleLabel } = useFirebase()
    const { filter } = item
    if ((!disabled && item.hidden) || (!!filter && !filterDisplay(state[filter.id], filter.operator, filter.value))) {
        return null
    }

    var newPath = !!path ? path.concat(item.id) : [item.id]
    var setting = {
        disabled: disabled || item.disabled,
        id: newPath,
        value: value,
        onChange: onChange,
    }

    if (Array.isArray(item.children)) {
        return (
            <Grid item container spacing={1}>
                <Grid item xs={12}>
                    <TitleField label={item.label} helperText={item.helperText} />
                </Grid>
                {item.checkbox && (
                    <Grid item container direction="column" alignItems="center">
                        <Button
                            disabled={disabled}
                            variant="contained"
                            onClick={(e) => onCheck([item.id], 'all')}
                            color="secondary"
                        >
                            {handleLabel('all')}
                        </Button>
                    </Grid>
                )}

                {Array.isArray(item.children) && item.children.map((subItem, key) => (
                    <Field
                        key={key}
                        state={state}
                        disabled={disabled}
                        item={subItem}
                        value={value[subItem.id]}
                        onChange={onChange}
                        onCheck={onCheck}
                        onAdd={onAdd}
                        onDelete={onDelete}
                        path={newPath}
                    />
                ))}
            </Grid>
        )
    }

    switch (item.fieldType) {
        case 'title':
            return (
                <Grid item xs={12}>
                    <TitleField label={item.label} helperText={item.helperText} />
                </Grid>
            )
        case 'checkbox':
            return (
                <Grid item xs={12} >
                    <CheckboxField
                        disabled={disabled}
                        item={item}
                        path={newPath}
                        onChange={onChange}
                        value={value}
                        onCheck={onCheck}
                    />
                </Grid>
            )
        case 'event':
            return (
                <Grid item xs={12}>
                    <EventField
                        disabled={disabled}
                        item={item}
                        path={newPath}
                        value={value}
                        onChange={onChange}
                        onAdd={onAdd}
                        onDelete={onDelete}
                    />
                </Grid>
            )
        case 'text': //輸入 單選 需有值
            return (
                <Grid item xs={12} sm={item.sm || 6}>
                    <TextField {...item} {...setting} />
                </Grid>
            )
        case 'select': //多選 單選 可空值
            return (
                <Grid item xs={12} sm={item.sm || 6}>
                    <SelectField {...item} {...setting} />
                </Grid>
            )
        case 'number':
            return (
                <Grid item xs={12} sm={item.sm || 6}>
                    <NumberField {...item} {...setting} />
                </Grid>
            )
        case 'date':
            return (
                <Grid item xs={12} sm={item.sm || 6}>
                    <MemoDateTimePicker {...item} {...setting} />
                </Grid>
            )
        case 'file':
            return (
                <Grid item xs={12}>
                    <Dropzone {...item} {...setting} />
                </Grid>
            )
        default:
            return null

    }
}

export default Field
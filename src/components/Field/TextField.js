import React, { memo } from 'react';
import { TextField, InputAdornment, MenuItem } from '@material-ui/core';

const handleValue = (value) => {
    if (Array.isArray(value)) {
        return value.length
    } else if (typeof (value) === 'object' && value !== null) {
        return Object.values(value).reduce((a, c) => a + c, 0)
    } else {
        return value
    }
}

const handleError = (v, r, e) => {
    if (e) {
        return true
    } else {
        if (r) {
            if (v || v === 0) {
                return false
            } else {
                return true
            }
        } else {
            return false
        }
    }
}

const MemoTextField = memo(({
    required, disabled, error, parentId,
    id, label, value, helperText, onChange, placeholder, variant, margin,
    options, multiline, rows, rowsMax, type,
    startAdornment, endAdornment,
}) => {
    // console.log('TextField', id, value)

    var v = handleValue(value)
    var e = handleError(v, required, error)

    return (
        <TextField
            required={required}
            error={e}
            disabled={disabled}
            variant={variant || "outlined"}
            margin={margin || "normal"}
            fullWidth
            placeholder={placeholder}
            label={label}
            value={v}
            helperText={helperText || null}
            onChange={e => {
                var ans = type === 'tel' ? e.target.value.replace(/\D/g, '') : e.target.value
                return onChange(id, ans, parentId)
            }}
            select={options ? true : false}
            multiline={multiline}
            rows={rows || 1}
            rowsMax={rowsMax || 1}
            type={type}
            InputProps={{
                startAdornment: startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>,
                endAdornment: endAdornment && <InputAdornment position="end">{endAdornment}</InputAdornment>,
            }}
        >
            {options && (options.map(item => (
                <MenuItem key={item.value} value={item.value}>
                    {item.label}
                </MenuItem>
            )))}
        </TextField>
    )
}, (prev, next) => JSON.stringify(prev.value) === JSON.stringify(next.value))

export default MemoTextField
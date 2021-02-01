import React, { memo } from 'react';
import { InputAdornment, IconButton } from '@material-ui/core';
import { MuiPickersUtilsProvider, DateTimePicker, DatePicker } from '@material-ui/pickers';
import { Event } from '@material-ui/icons';
import DateFnsUtils from '@date-io/date-fns';
import twLocale from "date-fns/locale/zh-TW";
// import enLocale from "date-fns/locale/en-US";


export const MemoDatePicker = memo(({
    required, error, disabled,
    id, label, value, onChange,
    openTo, views, country,
}) => {
    // console.log('MemoDatePicker', id)

    // const locale = !!country && country.toUpperCase() === 'TW' ? twLocale : enLocale
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={twLocale}>
            <DatePicker
                required={required}
                error={error}
                disabled={disabled}
                autoOk
                variant="inline"
                inputVariant="outlined"
                margin="normal"
                format='yyyy/MM/dd'
                label={label}
                value={value}
                onChange={e => onChange(id, e.getTime())}
                // openTo={openTo}
                // views={views}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton>
                                <Event />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
        </MuiPickersUtilsProvider>
    )
})

export const MemoDateTimePicker = memo(({
    required, disabled,
    id, label, value, onChange,
}) => {
    // console.log('DatePicker', id)

    var error = required ? !Boolean(value) : false
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils} /*locale={locale}*/>
            <DateTimePicker
                required={required}
                error={error}
                disabled={disabled}
                autoOk
                ampm={false}
                format="yyyy/MM/dd hh:mm:ss"
                variant="inline"
                inputVariant="outlined"
                // minDate={new Date()}
                fullWidth
                margin="normal"
                label={label}
                value={value}
                onChange={e => onChange(id, e.getTime())}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton>
                                <Event />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
        </MuiPickersUtilsProvider>
    )
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next))
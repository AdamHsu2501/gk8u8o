import React, { memo } from 'react';
import NumberFormat from 'react-number-format';
import { TextField, InputAdornment } from '@material-ui/core';

const NumberField = memo(({
    required, disabled, error, parentId,
    id, label, value, helperText, onChange,
    thousandSeparator, allowLeadingZeros, prefix, startAdornment, endAdornment, currency
    //type, thousandsGroupStyle, decimalScale, fixedDecimalScale,  allowEmptyFormatting,
}) => {
    // console.log('NumberField', id)

    var v = !currency ? value : value * currency['TWD']
    var exchangeArr = !!currency && Object.keys(currency).filter(key => key !== 'TWD').map(key => {
        return key.concat(' ', new Intl.NumberFormat().format((value * currency[key]).toFixed(2)))
    })

    var e = error || required ? !Boolean(value) : false

    return (
        <NumberFormat
            required={required}
            error={e}
            disabled={disabled}
            customInput={TextField}
            variant="outlined"
            margin="normal"
            fullWidth
            label={label}
            value={v}
            helperText={!currency ? helperText : exchangeArr.join(' / ')}
            onValueChange={e => {
                var ans = !!e.floatValue ? e.floatValue : 0;
                return onChange(id, ans, parentId)
            }}
            thousandSeparator={thousandSeparator}
            // thousandsGroupStyle={thousandsGroupStyle}
            // decimalScale={decimalScale}
            // fixedDecimalScale={fixedDecimalScale}
            allowNegative={false}
            // allowEmptyFormatting={allowEmptyFormatting}
            allowLeadingZeros={allowLeadingZeros}
            type='tel'
            prefix={!currency ? prefix : 'TWD '}
            InputProps={{
                startAdornment: startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>,
                endAdornment: endAdornment && <InputAdornment position="end">{endAdornment}</InputAdornment>,
            }}
        />
    )
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next))

export default NumberField
import React, { memo, useState, useEffect } from 'react';
import { TextField, CircularProgress } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

const filterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) => JSON.stringify(option),
});

const handleValues = (multiple, value, options, getValue) => {
    if (multiple) {
        return value.map(item => {
            return options.find(option => {
                return JSON.stringify(getValue(option)) === JSON.stringify(item)
            })
        })
    } else {
        return !value || value.id === 'new' ? value : options.find(option => {
            if (!!option.id) {
                if (!!value.id) {
                    return option.id === value.id
                }
                return JSON.stringify(getValue(option)) === JSON.stringify(value)
            } else {
                return JSON.stringify(getValue(option)) === JSON.stringify(value)
            }
        })
    }
}

// {
//     fieldType: 'select',
//     id: 'dmultiple',
//     label: 'dbRef multiple',
//     required: true,
//     value: [],
//     multiple: true,
//     getOptionLabel: opt => handleLabel(opt.displayName),
//     getValue: opt => ({
//         id: opt.id,
//         displayName: opt.displayName
//     }),
//     dbRef: Firebase.firestore().collection('tag'),
// },
// {
//     fieldType: 'select',
//     id: 'dsingle',
//     label: 'dbRef single',
//     required: true,
//     value: null,
//     multiple: false,
//     getOptionLabel: opt => handleLabel(opt.displayName),
//     getValue: opt => ({
//         id: opt.id,
//         displayName: opt.displayName
//     }),
//     dbRef: Firebase.firestore().collection('tag'),
// },
// {
//     fieldType: 'select',
//     id: 'multiple',
//     label: 'multiple',
//     required: true,
//     value: [],
//     multiple: true,
//     options: tags,
//     getOptionLabel: opt => handleLabel(opt.displayName),
//     getValue: opt => ({
//         id: opt.id,
//         displayName: opt.displayName
//     }),
// },
// {
//     fieldType: 'select',
//     id: 'single',
//     label: 'single',
//     required: true,
//     value: null,
//     multiple: false,
//     options: tags,
//     getOptionLabel: opt => handleLabel(opt.displayName),
//     getValue: opt => ({
//         id: opt.id,
//         displayName: opt.displayName
//     }),
// },

const SelectField = memo(({
    required, disabled, error, parentId,
    id, label, helperText, value, onChange,
    options, multiple,
    renderOption, getOptionLabel, getOptionSelected, // getOptionDisabled, groupBy,
    dbRef, getValue
}) => {
    const [open, setOpen] = useState(false);
    const [opts, setOptions] = useState(options || []);
    const loading = open && opts.length === 0;

    var ref = React.useRef()
    useEffect(() => {
        if (!!dbRef) {
            ref.current = dbRef;
        }
    }, [dbRef]);

    useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        if (!!ref.current) {
            ref.current.get().then(snap => {
                // console.log('SelectField fetch', snap)
                var arr = []
                if ('exists' in snap) {
                    if (snap.exists && active) {
                        arr = Object.values(snap.data())
                    }
                } else {
                    if (!snap.empty && active) {
                        arr = snap.docs.map(doc => doc.data())
                    }
                }
                setOptions(arr)
            })
        }

        return () => {
            active = false;
        };
    }, [loading, ref]);

    var v = handleValues(multiple, value, opts, getValue)
    var e = error || required ? !Boolean(multiple ? value.length : value) : false;

    return (
        <Autocomplete
            disabled={disabled}
            multiple={multiple}
            loading={loading}
            fullWidth
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            options={opts}
            filterOptions={filterOptions}
            getOptionLabel={getOptionLabel}
            // getOptionDisabled={getOptionDisabled}
            getOptionSelected={getOptionSelected}
            renderOption={renderOption}
            value={v}
            filterSelectedOptions
            // groupBy={!!groupBy ? (options) => options[groupBy] : null}
            onChange={(e, data) => {
                var selected

                if (!data) {
                    selected = data
                } else {
                    if (Array.isArray(data)) {
                        selected = data.map(getValue)
                    } else {
                        selected = getValue(data)
                    }
                }

                return onChange(id, selected, parentId)
            }}
            renderInput={params => (
                <TextField
                    {...params}
                    required={required}
                    error={e}
                    label={label}
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
}, (p, n) => JSON.stringify(p.value) === JSON.stringify(n.value));

export default SelectField
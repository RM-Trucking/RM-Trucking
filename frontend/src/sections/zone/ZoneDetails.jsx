import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Autocomplete,
    Chip,
    Stack,
    Typography,
    Divider,
    CircularProgress
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import { postZoneData, putZoneData } from '../../redux/slices/zone';
import Iconify from '../../components/iconify';

ZoneDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedZoneRowDetails: PropTypes.object,
};

export default function ZoneDetails({ type, handleCloseConfirm, selectedZoneRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.zonedata?.operationalMessage);
    const isLoading = useSelector((state) => state?.zonedata?.isLoading);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues
    } = useForm({
        defaultValues: {
            zone: '',
            individualZipCodes: '',
            rangeZipCodes: '',
            notes: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        let obj = {
            "zoneName": data.zone,
            "zipCodes": data.individualZipCodes
                .split(',')            // Split by comma
                .map(s => s.trim())    // Remove any extra whitespace
                .filter(Boolean),
            "ranges": data.rangeZipCodes,
            "note": {
                "messageText": data.notes
            }
        }
        if (type === 'Add') {
            dispatch(postZoneData(obj));
        } else if (type === 'Edit') {
            obj.activeStatus = selectedZoneRowDetails.activeStatus;
            dispatch(putZoneData(selectedZoneRowDetails.zoneId, obj));
        }
    };
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (selectedZoneRowDetails) {
            setValue('zone', selectedZoneRowDetails?.zoneName || '');
            setValue('individualZipCodes', selectedZoneRowDetails?.zipCodes?.join(', ') || '');
            setValue('rangeZipCodes', selectedZoneRowDetails?.ranges || '');
            setValue('notes', selectedZoneRowDetails?.notes[0]?.messageText || '');
        }
    }, [selectedZoneRowDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Zone Details</Typography>
                    {type === 'View' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="zone"
                            control={control}
                            rules={{ required: 'Zone Name is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Zone Name"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.zone} helperText={errors.zone?.message}
                                    disabled={type === 'View'}
                                />
                            )}
                        />
                        <Controller
                            name="individualZipCodes"
                            control={control}
                            rules={{
                                required: 'Individual Zip Codes is required',
                                validate: (value) => {
                                    // Split by comma, trim spaces, and check if every segment is exactly 5 digits
                                    const zips = value.split(',').map(z => z.trim()).filter(z => z.length > 0);
                                    const allValid = zips.every(z => /^\d{5}$/.test(z));
                                    return allValid || "Each zip code must be exactly 5 digits (numbers only)";
                                }
                            }}
                            render={({ field: { onChange, value, ...field } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value}
                                    label="Individual Zip Code"
                                    variant="standard"
                                    fullWidth
                                    required
                                    placeholder="e.g. 12345, 67890"
                                    sx={{ width: '75%' }}
                                    error={!!errors.individualZipCodes}
                                    helperText={errors.individualZipCodes?.message}
                                    disabled={type === 'View'}
                                    onChange={(e) => {
                                        const inputValue = e.target.value;

                                        // 1. Remove any characters that aren't numbers or commas
                                        const cleanValue = inputValue.replace(/[^\d,]/g, '');

                                        // 2. Logic: If user types 5 digits, automatically append a comma
                                        // We split by existing commas and look at the last segment
                                        const parts = cleanValue.split(',');
                                        const lastPart = parts[parts.length - 1];

                                        if (lastPart.length === 5 && !inputValue.endsWith(',')) {
                                            onChange(cleanValue + ',');
                                        } else if (lastPart.length <= 5) {
                                            onChange(cleanValue);
                                        }
                                        // (This prevents typing a 6th digit without a comma)
                                    }}
                                />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        {/* <Controller
                            name="rangeZipCodes"
                            control={control}
                            defaultValue={[]}
                            rules={{
                                validate: (value) => {
                                    if (!value || value.length === 0) return true;
                                    for (let range of value) {
                                        const match = range.match(/^(\d{3})\d{2}-(\d{3})\d{2}$/);
                                        if (!match) return `Invalid format: ${range}`;
                                        const [, prefix1, prefix2] = match;
                                        if (prefix1 !== prefix2) return `Prefix mismatch: ${range}`;
                                    }
                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => {
                                const [typedText, setTypedText] = useState("");
                                const [localError, setLocalError] = useState("");

                                const handleInputChange = (newInputValue) => {
                                    let val = newInputValue.replace(/[^\d-]/g, '');

                                    // Auto-fill prefix after hyphen
                                    if (val.length === 6 && !val.includes('-')) {
                                        const prefix = val.substring(0, 3);
                                        val = val.slice(0, 5) + '-' + prefix + val.slice(5);
                                    } else if (val.endsWith('-') && val.length === 6) {
                                        const prefix = val.substring(0, 3);
                                        val = val + prefix;
                                    }

                                    if (val.length <= 11) setTypedText(val);
                                };

                                const handleKeyDown = (event) => {
                                    const { selectionStart, selectionEnd } = event.target;

                                    // 1. BLOCK DELETION OF AUTO-PREFIX
                                    // The prefix occupies indices 6, 7, and 8 (e.g., "12345-123")
                                    if (typedText.includes('-')) {
                                        const hyphenIndex = typedText.indexOf('-');
                                        const prefixEndIndex = hyphenIndex + 4; // hyphen + 3 digits

                                        if (event.key === 'Backspace') {
                                            // Prevent backspace if it would delete chars in the prefix (indices hyphen+1 to hyphen+3)
                                            if (selectionStart > hyphenIndex + 1 && selectionStart <= prefixEndIndex && selectionStart === selectionEnd) {
                                                event.preventDefault();
                                                return;
                                            }
                                        }

                                        if (event.key === 'Delete') {
                                            // Prevent delete if it targets the prefix
                                            if (selectionStart >= hyphenIndex + 1 && selectionStart < prefixEndIndex) {
                                                event.preventDefault();
                                                return;
                                            }
                                        }
                                    }

                                    // 2. HANDLE CHIP CREATION
                                    if (event.key === ',' || event.key === 'Enter') {
                                        event.preventDefault();
                                        const parts = typedText.split('-');
                                        const isValid = /^\d{5}-\d{5}$/.test(typedText);
                                        const match = parts[0]?.substring(0, 3) === parts[1]?.substring(0, 3);

                                        if (isValid && match) {
                                            if (!value.includes(typedText)) onChange([...value, typedText]);
                                            setTypedText("");
                                            setLocalError("");
                                        } else {
                                            setLocalError("Invalid range or prefix mismatch");
                                        }
                                    }
                                };

                                return (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        fullWidth
                                        options={[]}
                                        value={value || []}
                                        disabled={type === 'View'}
                                        onChange={(event, newValue) => onChange(newValue)}
                                        inputValue={typedText}
                                        onInputChange={(event, newInputValue, reason) => {
                                            if (reason === 'input') handleInputChange(newInputValue);
                                            else { setTypedText(""); setLocalError(""); }
                                        }}
                                        renderTags={(tagValue, getTagProps) =>
                                            tagValue.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return (
                                                    <Chip
                                                        key={key}
                                                        label={option}
                                                        {...tagProps}
                                                        variant="outlined"
                                                        sx={{ bgcolor: 'rgba(224, 242, 255, 1)' }}
                                                        onClick={() => {
                                                            if (type !== 'View') {
                                                                onChange(value.filter((_, i) => i !== index));
                                                                setTypedText(option);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                multiline
                                                fullWidth
                                                rows={4}
                                                label="Range Zipcode"
                                                onKeyDown={handleKeyDown} // Use the new handler here
                                                error={!!error || !!localError}
                                                helperText={localError || error?.message || "Example: 45236-45296"}
                                            />
                                        )}
                                    />
                                );
                            }}
                        /> */}
                        <Controller
                            name="rangeZipCodes"
                            control={control}
                            defaultValue={[]}
                            rules={{
                                validate: (value) => {
                                    if (!value || value.length === 0) return true;
                                    for (let range of value) {
                                        const match = range.match(/^(\d{3})(\d{2})-(\d{3})(\d{2})$/);
                                        if (!match) return `Invalid format: ${range}`;
                                        const [, p1, s1, p2, s2] = match;
                                        if (p1 !== p2) return `Prefix mismatch: ${range}`;
                                        if (parseInt(s2) <= parseInt(s1)) return `End (${s2}) must be > Start (${s1})`;
                                    }
                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => {
                                const [typedText, setTypedText] = useState("");
                                const [localError, setLocalError] = useState("");

                                const handleInputChange = (newInputValue) => {
                                    let val = newInputValue.replace(/[^\d-]/g, '');

                                    // 1. Auto-fill Prefix Logic
                                    if (val.length === 6 && !val.includes('-')) {
                                        val = val.slice(0, 5) + '-' + val.slice(0, 3) + val.slice(5);
                                    } else if (val.endsWith('-') && val.length === 6) {
                                        val = val + val.substring(0, 3);
                                    }

                                    // 2. Real-time Suffix Validation (indices 3-5 and 9-11)
                                    if (val.length === 11) {
                                        const parts = val.split('-');
                                        const s1 = parseInt(parts[0].substring(3));
                                        const s2 = parseInt(parts[1].substring(3));

                                        if (s2 <= s1) {
                                            setLocalError(`Invalid: ${s2} must be greater than ${s1}`);
                                        } else {
                                            setLocalError("");
                                        }
                                    } else {
                                        // Keep error visible if they are mid-correction at 11 chars
                                        if (val.length < 11) setLocalError("");
                                    }

                                    if (val.length <= 11) setTypedText(val);
                                };

                                const handleKeyDown = (event) => {
                                    const { selectionStart, selectionEnd } = event.target;

                                    // Lock auto-prefix
                                    if (typedText.includes('-')) {
                                        const hyphenIndex = typedText.indexOf('-');
                                        if (event.key === 'Backspace' && selectionStart > hyphenIndex + 1 && selectionStart <= hyphenIndex + 4 && selectionStart === selectionEnd) {
                                            event.preventDefault(); return;
                                        }
                                    }

                                    // Add Chip Logic
                                    if (event.key === ',' || event.key === 'Enter') {
                                        event.preventDefault();
                                        const match = typedText.match(/^(\d{3})(\d{2})-(\d{3})(\d{2})$/);

                                        if (match) {
                                            const [, p1, s1, p2, s2] = match;
                                            if (p1 === p2 && parseInt(s2) > parseInt(s1)) {
                                                if (!value.includes(typedText)) onChange([...value, typedText]);
                                                setTypedText("");
                                                setLocalError("");
                                            } else if (p1 !== p2) {
                                                setLocalError("Prefix mismatch!");
                                            } else {
                                                setLocalError(`Range Error: ${s2} is not > ${s1}`);
                                            }
                                        } else if (typedText !== "") {
                                            setLocalError("Incomplete range format");
                                        }
                                    }
                                };

                                return (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        fullWidth
                                        options={[]}
                                        value={value || []}
                                        disabled={type === 'View'}
                                        onChange={(event, newValue) => onChange(newValue)}
                                        inputValue={typedText}
                                        onInputChange={(event, newInput, reason) => {
                                            if (reason === 'input') handleInputChange(newInput);
                                            else if (reason === 'clear') { setTypedText(""); setLocalError(""); }
                                        }}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                multiline
                                                fullWidth
                                                rows={4}
                                                label="Range Zipcode"
                                                onKeyDown={handleKeyDown}
                                                // Ensure localError triggers the red border and text
                                                error={!!localError || !!error}
                                                helperText={localError || error?.message || "Example: 45236-45296"}
                                            />
                                        )}
                                    // ... rest of your renderTags logic
                                    />
                                );
                            }}
                        />
                        <Controller
                            name="notes"
                            control={control}
                            rules={{
                                validate: (value) => {
                                    // 1. If it's empty, it's valid (because it's optional)
                                    if (!value || value.length === 0) return true;

                                    // 2. If it has value, ensure it's not just whitespace
                                    if (value.trim().length === 0) {
                                        return "Notes cannot be empty spaces";
                                    }

                                    // 3. Ensure the first character is not a space (prevents " empty starts")
                                    if (value.startsWith(" ")) {
                                        return "Notes cannot start with a space";
                                    }

                                    return true;
                                }
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Notes"
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    sx={{ width: '50%' }}
                                    error={!!errors.notes}
                                    helperText={errors.notes?.message}
                                    disabled={type === 'View'}
                                    // Optional: Prevent typing a space as the very first character
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === " ") return; // Blocks leading space in real-time
                                        field.onChange(e);
                                    }}
                                />
                            )}
                        />
                    </Stack>
                </Stack>
                {(type === 'Add' || type === 'Edit') && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseConfirm}
                        size="small"
                        sx={{
                            '&.MuiButton-outlined': {
                                borderRadius: '4px',
                                color: '#000',
                                boxShadow: 'none',
                                fontSize: '14px',
                                p: '2px 16px',
                                bgcolor: '#fff',
                                fontWeight: 'normal',
                                ml: 1,
                                mr: 1,
                                borderColor: '#000'
                            },
                        }}
                    >
                        Cancel
                    </Button>

                    <Box>
                        <Button
                            variant="contained"
                            size="small"
                            type='submit'
                            onClick={handleSubmit(onSubmit)}
                            sx={{
                                '&.MuiButton-contained': {
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#A22',
                                    fontWeight: 'normal',
                                    ml: 1,
                                },
                            }}
                        >
                            {type === 'Add' ? 'Add' : 'Edit'}
                        </Button>
                        {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                    </Box>
                </Stack>}
            </Box>
        </>
    );
};

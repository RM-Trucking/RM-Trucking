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
                        <Controller
                            name="rangeZipCodes"
                            control={control}
                            defaultValue={[]}
                            rules={{
                                validate: (value) => {
                                    if (!value || value.length === 0) return true;
                                    for (let range of value) {
                                        if (!/^\d{5}-\d{5}$/.test(range)) return `Invalid format: ${range}`;
                                    }
                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => {
                                const [typedText, setTypedText] = useState("");

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
                                            if (reason === 'input') {
                                                let val = newInputValue.replace(/[^\d-]/g, '');
                                                if (val.length >= 6 && !val.includes('-')) {
                                                    val = val.slice(0, 5) + '-' + val.slice(5);
                                                }
                                                if (val.length <= 11) setTypedText(val);
                                            } else {
                                                setTypedText("");
                                            }
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === ',' || event.key === 'Enter') {
                                                event.preventDefault();
                                                if (/^\d{5}-\d{5}$/.test(typedText)) {
                                                    if (!value.includes(typedText)) {
                                                        onChange([...value, typedText]);
                                                    }
                                                    setTypedText("");
                                                }
                                            }
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
                                                variant="outlined"
                                                error={!!error}
                                                helperText={error?.message || "Format: 12345-67890"}
                                            />
                                        )}
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

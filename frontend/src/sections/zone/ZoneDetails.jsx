import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Autocomplete,
    Dialog, DialogContent,
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
    const [openConfirmDialog, setopenConfirmDialog] = useState(false);
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
            rangeZipCodes: [],
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
            setValue('rangeZipCodes', selectedZoneRowDetails?.ranges || []);
            setValue('notes', selectedZoneRowDetails?.notes?.[0]?.messageText || '');
        }
    }, [selectedZoneRowDetails]);
    const handleCloseConfirmDialog = () => {
        setopenConfirmDialog(false);
    }
    const handleCheckZipCode = () => {
        setopenConfirmDialog(true);
    }

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Zone Details</Typography>
                    {type === 'View' && <Iconify icon="carbon:close" onClick={handleCloseConfirm} sx={{ cursor: 'pointer' }} />}
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
                            rules={{
                                required: 'Zone Name is required',
                                pattern: {
                                    value: /^[A-Z]{3}\d+$/,
                                    message: 'Must be 3 letters followed by numbers (e.g., MKE999)'
                                }
                            }}
                            render={({ field: { onChange, value, ...field } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value}
                                    label="Zone Name"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{
                                        width: '25%',
                                        // Red color logic for disabled state
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            WebkitTextFillColor: "black",
                                            color: "black",
                                        },
                                        "& .MuiInputLabel-root.Mui-disabled": {
                                            color: "black",
                                        }
                                    }}
                                    error={!!errors.zone}
                                    helperText={errors.zone?.message}
                                    disabled={type === 'View'}
                                    onChange={(e) => {
                                        let val = e.target.value.toUpperCase(); // Force uppercase

                                        // 1. Remove any characters that aren't letters or numbers
                                        val = val.replace(/[^A-Z0-9]/g, '');

                                        // 2. Enforce logic: First 3 must be letters, rest must be numbers
                                        if (val.length <= 3) {
                                            // While typing the first 3, remove any digits
                                            val = val.replace(/[0-9]/g, '');
                                        } else {
                                            // After the first 3, the remaining string must only be digits
                                            const prefix = val.substring(0, 3).replace(/[0-9]/g, '');
                                            const suffix = val.substring(3).replace(/[A-Z]/g, '');
                                            val = prefix + suffix;
                                        }

                                        onChange(val);
                                    }}
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

                                    // 2. Real-time Suffix Validation
                                    if (val.length === 11) {
                                        const parts = val.split('-');
                                        const s1 = parseInt(parts[0].substring(3));
                                        const s2 = parseInt(parts[1].substring(3));
                                        if (s2 <= s1) setLocalError(`Invalid: ${s2} must be > ${s1}`);
                                        else setLocalError("");
                                    } else if (val.length < 11) {
                                        setLocalError("");
                                    }

                                    if (val.length <= 11) setTypedText(val);
                                };

                                const handleKeyDown = (event) => {
                                    // CRITICAL: Prevent Enter from submitting the whole form/closing popup
                                    if (event.key === 'Enter' || event.key === ',') {
                                        event.preventDefault();

                                        const match = typedText.match(/^(\d{3})(\d{2})-(\d{3})(\d{2})$/);
                                        if (match) {
                                            const [, p1, s1, p2, s2] = match;
                                            if (p1 === p2 && parseInt(s2) > parseInt(s1)) {
                                                // Correctly update the RHF state array
                                                const currentArray = Array.isArray(value) ? value : [];
                                                if (!currentArray.includes(typedText)) {
                                                    onChange([...currentArray, typedText]);
                                                }
                                                setTypedText("");
                                                setLocalError("");
                                            } else {
                                                setLocalError(p1 !== p2 ? "Prefix mismatch!" : "Range Error");
                                            }
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
                                        // Syncs RHF when chips are deleted via the 'x' button
                                        onChange={(event, newValue) => onChange(newValue)}
                                        inputValue={typedText}
                                        onInputChange={(event, newInput, reason) => {
                                            if (reason === 'input') handleInputChange(newInput);
                                            else if (reason === 'clear') { setTypedText(""); setLocalError(""); }
                                        }}
                                        sx={{
                                            // 1. Style the Chips (Tags) when disabled
                                            "& .MuiChip-root.Mui-disabled": {
                                                color: "#00",
                                                borderColor: "#000",
                                                opacity: 1, // Remove default fading
                                                "& .MuiChip-deleteIcon": {
                                                    display: 'none' // Hide delete 'x' when disabled
                                                }
                                            },
                                            // 2. Style the Label when disabled
                                            "& .MuiInputLabel-root.Mui-disabled": {
                                                color: "#000",
                                            },
                                            // 3. Style the Input Text (if any) when disabled
                                            "& .MuiInputBase-input.Mui-disabled": {
                                                WebkitTextFillColor: "#000",
                                                color: "#000",
                                            },
                                            // 4. Style the border/underline when disabled
                                            "& .MuiInput-underline.Mui-disabled:before": {
                                                borderBottomColor: "#000 !important",
                                                borderBottomStyle: "solid",
                                            },
                                            // If using 'outlined' variant, use this instead:
                                            "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "#000",
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                multiline
                                                fullWidth
                                                rows={4}
                                                label="Range Zipcode"
                                                onKeyDown={handleKeyDown}
                                                error={!!localError || !!error}
                                                helperText={localError || error?.message || "Example: 45236-45296"}
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
                            onClick={handleCheckZipCode}
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
            <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleCloseConfirmDialog();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '800px',
                        height: 'auto',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <>
                        <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Alert!</Typography>
                            <Iconify icon="carbon:close" onClick={() => handleCloseConfirmDialog()} sx={{ cursor: 'pointer' }} />
                        </Stack>
                        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                        <Typography sx={{ mt: 3 }}>This zipcode is already registered on another zone. Do you still want to add to this zone?</Typography>
                    </>
                    {(type === 'Add' || type === 'Edit') && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={handleCloseConfirmDialog}
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
                </DialogContent>
            </Dialog>
        </>
    );
};

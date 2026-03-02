import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Typography,
    Stack,
    Divider,
    FormControlLabel,
    Dialog,
    DialogContent, CircularProgress, MenuItem,
    ListSubheader, Checkbox, ListItemText
} from '@mui/material';
// for date picker
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
import { setTableBeingViewed } from '../../redux/slices/customer';


TerminalDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCarrierTabRowDetails: PropTypes?.object
};

export default function TerminalDetails({ type, handleCloseConfirm, selectedCarrierTabRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.carrierdata?.operationalMessage);
    const isLoading = useSelector((state) => state?.carrierdata?.isLoading);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    // Define default values for the form
    const defaultValues = {
        terminalName: '',
        rmAccountNumber: '',
        airportCode: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        phoneNumber: '',
        faxNumber: '',
        openTime: '',
        closeTime: '',
        hours: '',
        terminalNotes: '',
    };
    const { control, handleSubmit, watch, getValues, setValue, formState: { errors }, } = useForm({ defaultValues });
    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);

        if (type === 'Add') {
            console.log('data')
        }
        if (type === 'Edit') {
            console.log('data', data)
        }
    };
    useEffect(() => {
        dispatch(setTableBeingViewed('personnel'));
    }, []);
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        console.log('Selected Carrier tab row Details:', selectedCarrierTabRowDetails);

    }, [selectedCarrierTabRowDetails]);
    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Terminal Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="terminalName"
                            control={control}
                            rules={{
                                required: 'Terminal Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Terminal Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Terminal Name cannot be only spaces'
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
                                    // Intercept onChange to prevent leading spaces
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // prevent only leading spaces while typing
                                        if (value.startsWith(' ')) {
                                            field.onChange(value.trimStart());
                                        } else {
                                            field.onChange(value);
                                        }
                                    }}
                                    label="Terminal Name *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View')}
                                />
                            )}
                        />
                        <Controller
                            name="rmAccountNumber"
                            control={control}
                            rules={{
                                required: 'RM Account Number is required',
                                maxLength: {
                                    value: 50,
                                    message: 'RM Account Number cannot exceed 50 characters'
                                },
                                // Alphanumeric regex allowing letters and digits
                                pattern: {
                                    value: /^[a-zA-Z0-9]+$/,
                                    message: 'RM Account Number must be alphanumeric (letters and numbers only)'
                                },
                                validate: (value) =>
                                    (value && value.trim().length > 0) || 'Account Number cannot be only spaces'
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    label="RM Account Number"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    // Integrated error state for UI feedback
                                    error={!!error}
                                    helperText={error?.message}
                                    disabled={(type === 'View')}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // prevent leading spaces while typing
                                        if (value.startsWith(' ')) {
                                            field.onChange(value.trimStart());
                                        } else {
                                            field.onChange(value);
                                        }
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="airportCode"
                            control={control}
                            rules={{
                                required: 'Airport Code is required',
                                maxLength: {
                                    value: 10,
                                    message: 'Airport Code cannot exceed 10 characters'
                                },
                                // Updated pattern to allow 3 to 10 letters
                                pattern: {
                                    value: /^[A-Z]{3,10}$/,
                                    message: 'Must be between 3 and 10 letters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Airport Code cannot be only spaces'
                            }}
                            render={({ field: { onChange, value, ...field } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;

                                        // 1. Prevent leading spaces
                                        if (val.startsWith(' ')) {
                                            return;
                                        }

                                        // 2. Remove non-letters, Convert to Uppercase, Limit to 10 chars
                                        const formatted = val
                                            .replace(/[^a-zA-Z]/g, '')
                                            .toUpperCase()
                                            .slice(0, 10);

                                        onChange(formatted);
                                    }}
                                    label="Airport Code"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    // 3. Set maxLength to 10 at the input level
                                    inputProps={{
                                        style: { textTransform: 'uppercase' },
                                        maxLength: 10
                                    }}
                                    error={!!errors.airportCode}
                                    helperText={errors.airportCode?.message}
                                    disabled={(type === 'View')}
                                />
                            )}
                        />
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                // Removed 'required' rule
                                pattern: {
                                    // Added ^$| to allow the field to be empty
                                    value: /^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                    message: 'Please enter a valid email address'
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.startsWith(' ')) {
                                            field.onChange(value.trimStart());
                                        } else {
                                            field.onChange(value);
                                        }
                                    }}
                                    // Removed asterisk from label
                                    label="Email ID"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View')}
                                />
                            )}
                        />
                    </Stack>

                    {/* Terminal Address Section */}
                    <fieldset style={{borderColor:'#000', borderRadius:'8px'}}>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Terminal Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="addressLine1"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 1" disabled={(type === 'View')}
                                        // Intercept onChange to prevent leading spaces
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }} error={!!error} inputProps={{ maxLength: 255 }} />
                                )}
                            />
                            <Controller
                                name="addressLine2"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 2 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 2 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 2" disabled={(type === 'View')}
                                        // Intercept onChange to prevent leading spaces
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        error={!!error} inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="city"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth label="City" disabled={(type === 'View')}
                                        error={!!error} inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="state"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth label="State" disabled={(type === 'View')}
                                        error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="zipCode"
                                control={control}
                                rules={{
                                    pattern: {
                                        value: /^\d{5}(-\d{4})?$/, // Validates ##### or #####-####
                                        message: 'Invalid Zip Code format'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, ''); // Remove non-digits
                                            let formatted = val;

                                            // Format as #####-####
                                            if (val.length > 5) {
                                                formatted = `${val.slice(0, 5)}-${val.slice(5, 9)}`;
                                            } else {
                                                formatted = val.slice(0, 5);
                                            }

                                            onChange(formatted);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        label="Zip Code"
                                        error={!!error}
                                        helperText={error?.message || ''}
                                        disabled={(type === 'View')}
                                        inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* Terminal Info Section */}
                    <fieldset style={{borderColor:'#000', borderRadius:'8px'}}>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Terminal Info &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
                            <Controller
                                name="phoneNumber"
                                control={control}
                                rules={{
                                    required: 'Phone number is required',
                                    maxLength: {
                                        value: 20,
                                        message: 'Phone number cannot exceed 20 characters'
                                    },
                                    pattern: {
                                        // Regex allows (XXX) XXX-XXXX followed by any extra digits/characters up to 20
                                        value: /^\(\d{3}\) \d{3}-\d{4}.*$/,
                                        message: 'Invalid phone format'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;

                                            // 1. Prevent initial empty space
                                            if (val.startsWith(' ')) return;

                                            // 2. Format and enforce 20-character string limit
                                            const formattedValue = formatPhoneNumber(val).slice(0, 20);
                                            onChange(formattedValue);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Phone Number *"
                                        // 3. Physical browser limit for the UI
                                        inputProps={{ maxLength: 20 }}
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View')}
                                    />
                                )}
                            />
                            <Controller
                                name="faxNumber"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 20,
                                        message: 'Fax number cannot exceed 20 characters'
                                    },
                                    pattern: {
                                        // Updated Regex: Validates (###) ###-#### and allows extra digits up to 20 chars total
                                        value: /^\(\d{3}\) \d{3}-\d{4}.*$/,
                                        message: 'Invalid fax format (###) ###-####'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;

                                            // 1. Prevent initial empty space
                                            if (val.startsWith(' ')) return;

                                            const input = val.replace(/[^\d]/g, ''); // Strip non-digits
                                            const len = input.length;
                                            let formatted = input;

                                            // 2. Apply formatting and allow extra digits beyond 10
                                            if (len <= 3) {
                                                formatted = input;
                                            } else if (len <= 6) {
                                                formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
                                            } else {
                                                // Removed the end slice (10) to allow the number to grow to 20 chars
                                                formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
                                            }

                                            // 3. Enforce 20 character string limit
                                            onChange(formatted.slice(0, 20));
                                        }}
                                        label="Fax Number"
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        error={!!error}
                                        helperText={error?.message || ''}
                                        disabled={(type === 'View')}
                                        // 4. Update physical browser limit to 20
                                        inputProps={{ maxLength: 20 }}
                                    />
                                )}
                            />
                            <Controller
                                name="openTime"
                                control={control}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        // Ensure value in state is displayed correctly (input type="time" expects HH:mm or HH:mm:ss)
                                        value={value || ''}
                                        label="Open Time"
                                        type="time"
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        InputLabelProps={{ shrink: true }}
                                        disabled={type === 'View'}
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => {
                                            const selectedTime = e.target.value; // Browser returns "HH:mm"
                                            if (selectedTime) {
                                                // Append :00 to satisfy API requirements for seconds
                                                onChange(`${selectedTime}:00`);
                                            } else {
                                                onChange('');
                                            }
                                        }}
                                        // Removing 'step: 1' hides seconds in many browsers; 
                                        // Setting 'step: 60' explicitly hides the seconds spinner/input.
                                        inputProps={{ step: 60 }}
                                    />
                                )}
                            />

                            <Controller
                                name="closeTime"
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        const openTime = watch('openTime');
                                        if (!value || !openTime) return true;
                                        // Since both now have ":00", a string comparison still works accurately
                                        return value > openTime || 'Close time must be later than open time';
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        label="Close Time"
                                        type="time"
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        InputLabelProps={{ shrink: true }}
                                        disabled={type === 'View'}
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => {
                                            const selectedTime = e.target.value; // Browser returns "HH:mm"
                                            if (selectedTime) {
                                                // Append :00 to send seconds to the API
                                                onChange(`${selectedTime}:00`);
                                            } else {
                                                onChange('');
                                            }
                                        }}
                                        // step: 60 hides the seconds input/spinner in the browser UI
                                        inputProps={{ step: 60 }}
                                    />
                                )}
                            />
                            <Controller
                                name="hours"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'Hours cannot exceed 100 characters'
                                    },
                                    pattern: {
                                        value: /^[0-9]*$/,
                                        message: 'Only numbers are allowed'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        type="text"
                                        label="Hours"
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        InputLabelProps={{ shrink: true }}
                                        disabled={type === 'View'}
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        // Physical restriction for 100 characters
                                        inputProps={{ maxLength: 100 }}
                                        onChange={(e) => {
                                            const val = e.target.value;

                                            // 1. Prevent leading/initial spaces
                                            if (val.startsWith(' ')) return;

                                            // 2. Allow only numeric digits (removes letters, spaces, etc.)
                                            const onlyNums = val.replace(/[^0-9]/g, '');

                                            // 3. Apply the 100 character slice
                                            onChange(onlyNums.slice(0, 100));
                                        }}
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>



                    {/* terminal notes */}
                    <Controller
                        name="terminalNotes"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: {
                                value: 2000,
                                message: 'Terminal Notes cannot exceed 2000 characters'
                            },
                            validate: (value) => value.trim().length > 0 || 'Terminal Notes cannot be only spaces'
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Terminal Notes *" error={!!error}
                                helperText={error ? 'Terminal Notes is required' : ''}
                                // Intercept onChange to prevent leading spaces
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // prevent only leading spaces while typing
                                    if (value.startsWith(' ')) {
                                        field.onChange(value.trimStart());
                                    } else {
                                        field.onChange(value);
                                    }
                                }}
                                disabled={(type === 'View')}
                                inputProps={{ maxLength: 2000 }}
                                />
                        )}
                    />

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
                                mb: 1,
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
                                    mb: 1
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
                        width: '500px',
                        height: 'auto',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    Dialog
                </DialogContent>
            </Dialog>

        </>
    );
}
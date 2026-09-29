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
    DialogContent, CircularProgress,
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import { postAirlineData, putAirlineData } from '../../redux/slices/airline';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
// ----------------------------------------------------------------------


AirlineDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedAirlineRowDetails: PropTypes?.object
};

export default function AirlineDetails({ type, handleCloseConfirm, selectedAirlineRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.airlinedata?.operationalMessage);
    const isLoading = useSelector((state) => state?.airlinedata?.isLoading);
    // Define default values for the form
    const defaultValues = {
        airlineName: '',
        iataCode: '',
        airlineCode: '',
        rmAccountNumber: '',

        website: '',
        importAddressLine1: '',
        importAddressLine2: '',
        importCity: '',
        importState: '',
        importZip: '',
        importEmail: '',
        importphoneNumber: '',

        sameAsCorporate: false,
        exportAddressLine1: '',
        exportAddressLine2: '',
        exportCity: '',
        exportState: '',
        exportZipCode: '',
        exportEmail: '',
        exportphoneNumber: '',
        customerNotes: '',
        customerStatus: '',
        reasonForStatus: ''
    };
    const [readOnly, setReadOnly] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const { control, handleSubmit, watch, getValues, setValue } = useForm({ defaultValues });

    // Watch the checkbox value to conditionally render billing address
    const sameAsCorporate = watch('sameAsCorporate');

    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);
        if (data.sameAsCorporate && (data.importAddressLine1 !== data.exportAddressLine1 || data.importAddressLine2 !== data.exportAddressLine2 ||
            data.importCity !== data.exportCity || data.importState !== data.exportState ||
            data.importZip !== data.exportZipCode || data.importEmail !== data.exportEmail || data.importphoneNumber !== data.exportphoneNumber)) {
            setOpenConfirmDialog(true);
            return;

        }
        let obj = {
            "airlineName": data?.airlineName?.trim(),
            "iataCode": data?.iataCode,
            "airlineCode": data?.airlineCode,
            "corporateBillingSame": data.sameAsCorporate ? 'Y' : 'N',
            "addresses": [
                {
                    "line1": data?.importAddressLine1,
                    "line2": data?.importAddressLine2,
                    "city": data?.importCity,
                    "state": data?.importState,
                    "zipCode": data?.importZip,
                    "email": data?.importEmail,
                    "phoneNumber": data?.importphoneNumber,
                    "addressRole": "Corporate"
                },
                {
                    "line1": (data.sameAsCorporate) ? data?.importAddressLine1 : data?.exportAddressLine1,
                    "line2": (data.sameAsCorporate) ? data?.importAddressLine2 : data?.exportAddressLine2,
                    "city": (data.sameAsCorporate) ? data?.importCity : data?.exportCity,
                    "state": (data.sameAsCorporate) ? data?.importState : data?.exportState,
                    "zipCode": (data.sameAsCorporate) ? data?.importZip : data?.exportZipCode,
                    "email": (data.sameAsCorporate) ? data?.importEmail : data?.exportEmail,
                    "phoneNumber": (data.sameAsCorporate) ? data?.importphoneNumber : data?.exportphoneNumber,
                    "addressRole": "Billing"
                }
            ],
        }
        if (type === 'Add') {
            dispatch(postAirlineData(obj));
        }
        if (type === 'Edit') {
            obj.addresses[0].addressId = (selectedAirlineRowDetails.addresses[0].addressRole === 'Import') ? selectedAirlineRowDetails.addresses[0].addressId : selectedAirlineRowDetails.addresses[1].addressId;
            obj.addresses[1].addressId = (selectedAirlineRowDetails.addresses[1].addressRole === 'Export') ? selectedAirlineRowDetails.addresses[1].addressId : selectedAirlineRowDetails.addresses[0].addressId;
            dispatch(putAirlineData(obj, selectedAirlineRowDetails?.customerId));
        }
    };

    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        console.log('Selected Customer Details:', selectedAirlineRowDetails);
        setValue('airlineName', selectedAirlineRowDetails?.airlineName || '');
        setValue('importAddressLine1', selectedAirlineRowDetails?.addresses?.[0]?.line1 || '');
        setValue('importAddressLine2', selectedAirlineRowDetails?.addresses?.[0]?.line2 || '');
        setValue('importCity', selectedAirlineRowDetails?.addresses?.[0]?.city || '');
        setValue('importState', selectedAirlineRowDetails?.addresses?.[0]?.state || '');
        setValue('importZip', selectedAirlineRowDetails?.addresses?.[0]?.zipCode || '');
        setValue('importEmail', selectedAirlineRowDetails?.addresses?.[0]?.email || '');
        setValue('importphoneNumber', selectedAirlineRowDetails?.addresses?.[0]?.phoneNumber || '');
        setValue('sameAsCorporate', selectedAirlineRowDetails?.corporateBillingSame === 'Y' ? true : false);
        setReadOnly(selectedAirlineRowDetails?.corporateBillingSame === 'Y' ? true : false);
        setValue('exportAddressLine1', selectedAirlineRowDetails?.addresses?.[1]?.line1 || '');
        setValue('exportAddressLine2', selectedAirlineRowDetails?.addresses?.[1]?.line2 || '');
        setValue('exportCity', selectedAirlineRowDetails?.addresses?.[1]?.city || '');
        setValue('exportState', selectedAirlineRowDetails?.addresses?.[1]?.state || '');
        setValue('exportZipCode', selectedAirlineRowDetails?.addresses?.[1]?.zipCode || '');
        setValue('exportEmail', selectedAirlineRowDetails?.addresses?.[1]?.email || '');
        setValue('exportphoneNumber', selectedAirlineRowDetails?.addresses?.[1]?.phoneNumber || '');
    }, [selectedAirlineRowDetails]);
    useEffect(() => {
        if (type === 'View') {
            setReadOnly(true);
        } else {
            setReadOnly(false);
        }
    }, [type]);
    // dialog actions and functions
    const handleAlert = () => {
        setOpenConfirmDialog(false);
    };

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Airline Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="airlineName"
                            control={control}
                            rules={{
                                required: 'Airline Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Airline Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Airline Name cannot be only spaces'
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
                                    label="Airline Name *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
                                />
                            )}
                        />

                        <Controller
                            name="iataCode"
                            control={control}
                            rules={{
                                required: 'IATA Code is required',
                                maxLength: {
                                    value: 2,
                                    message: 'IATA Code cannot exceed 2 characters'
                                },
                                minLength: {
                                    value: 2,
                                    message: 'IATA Code must be exactly 2 characters'
                                },
                                pattern: {
                                    value: /^[A-Z0-9]{2}$/i,
                                    message: 'IATA Code must be alphanumeric (letters/numbers)'
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
                                    // Intercept onChange to format as uppercase and restrict length/spaces
                                    onChange={(e) => {
                                        let value = e.target.value.toUpperCase().replace(/\s/g, ''); // Uppercase & remove spaces
                                        if (value.length <= 2) {
                                            field.onChange(value);
                                        }
                                    }}
                                    label="IATA Code *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 2 // Hard browser-level constraint
                                        }
                                    }}
                                />
                            )}
                        />

                        <Controller
                            name="airlineCode"
                            control={control}
                            rules={{
                                required: 'Airline Code is required',
                                maxLength: {
                                    value: 3,
                                    message: 'Airline Code cannot exceed 3 characters'
                                },
                                minLength: {
                                    value: 3,
                                    message: 'Airline Code must be exactly 3 characters'
                                },
                                pattern: {
                                    value: /^[A-Z0-9]{3}$/i,
                                    message: 'Airline Code must be alphanumeric (letters/numbers)'
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
                                    // Intercept onChange to format as uppercase and restrict length/spaces
                                    onChange={(e) => {
                                        let value = e.target.value.toUpperCase().replace(/\s/g, ''); // Uppercase & remove spaces
                                        if (value.length <= 3) {
                                            field.onChange(value);
                                        }
                                    }}
                                    label="Airline Code *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 3 // Hard browser-level constraint to block 4th character
                                        }
                                    }}
                                />
                            )}
                        />

                    </Stack>

                    {/* Import Address Section */}
                    <fieldset style={{ borderColor: '#000', borderRadius: '8px' }}>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Import Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="importAddressLine1"
                                control={control}
                                rules={{
                                    required: 'Address Line 1 is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        sx={{ width: '20%' }}
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        label="Address Line 1*" // Added asterisk to visually mark it required
                                        disabled={(type === 'View') ? readOnly : false}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays validation or required error text
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />

                            <Controller
                                name="importAddressLine2"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 2 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 2 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 2" disabled={(type === 'View') ? readOnly : false}
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
                                name="importCity"
                                control={control}
                                rules={{
                                    required: 'City is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        sx={{ width: '20%' }}
                                        variant="standard"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth
                                        label="City*" // Added asterisk to visually mark it required
                                        disabled={(type === 'View') ? readOnly : false}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays the required or validation error messages
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />

                            <Controller
                                name="importState"
                                control={control}
                                rules={{
                                    required: 'State is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        sx={{ width: '20%' }}
                                        variant="standard"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth
                                        label="State*" // Added asterisk to visually mark it required
                                        disabled={(type === 'View') ? readOnly : false}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays validation error text underneath the input
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />

                            <Controller
                                name="importZip"
                                control={control}
                                rules={{
                                    required: 'Zipcode is required', // NEW: Enforces the required rule
                                    validate: (value) => {
                                        // Empty strings are intercepted cleanly by the required property above
                                        if (!value) return true;

                                        // 1. Block "all zeros"
                                        const rawDigits = value.replace(/[^\d]/g, '');
                                        if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

                                        // 2. Strict Length/Format check
                                        // Check if it matches exactly 5 digits OR exactly 5-5 digits (11 total characters)
                                        const zipRegex = /(^\d{5}$)|(^\d{5}-\d{5}$)/;
                                        if (!zipRegex.test(value)) {
                                            return 'Zip Code must be exactly 5 digits or a range (#####-#####)';
                                        }

                                        // 3. Range-specific constraints (only if a range is present)
                                        if (value.includes('-')) {
                                            const parts = value.split('-');
                                            const firstZip = parts[0];
                                            const secondZip = parts[1];

                                            // Ensure the first 3 digits of both segments match perfectly
                                            if (firstZip.slice(0, 3) !== secondZip.slice(0, 3)) {
                                                return `End range prefix must match '${firstZip.slice(0, 3)}'`;
                                            }

                                            // Ensure the last 2 digits of the second segment are strictly greater
                                            const startSuffix = parseInt(firstZip.slice(-2), 10);
                                            const endSuffix = parseInt(secondZip.slice(-2), 10);

                                            if (endSuffix === startSuffix) return 'End range cannot be equal to start';
                                            if (endSuffix < startSuffix) return 'End range must be greater than start';
                                        }

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const input = e.target.value;
                                            // Allow only digits and a single dash character
                                            let raw = input.replace(/[^\d-]/g, '');

                                            // Detect backspacing/deletion
                                            const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

                                            if (!isDeleting && raw.length === 5 && !raw.includes('-')) {
                                                // Auto-append dash only when typing forwards past the 5th digit
                                                raw = `${raw}-`;
                                            }

                                            // Prevent typing more than 11 characters (#####-#####)
                                            onChange(raw.slice(0, 11));
                                        }}
                                        inputProps={{ maxLength: 11, inputMode: 'numeric' }}
                                        label="Zip Code*" // Added asterisk to visually mark it required
                                        error={!!error}
                                        helperText={error?.message || 'Ex: 12345 or 12345-12346'}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="importphoneNumber"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 20,
                                        message: 'Import Phone number cannot exceed 20 characters'
                                    },
                                    validate: (value) => {
                                        if (!value) return true; // Allow empty

                                        // 1. Check for all zeros (strips formatting and checks if only 0s remain)
                                        const digitsOnly = value.replace(/\D/g, '');
                                        const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);

                                        if (isAllZeros) return 'Import Phone number cannot be all zeros';

                                        // 2. Format validation (Optional: adjust regex if you want a specific pattern for 20 chars)
                                        // If you just want to allow any 20 chars, the maxLength rule above handles it.

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith(' ')) return;

                                            // Keeps your existing formatting, allowing up to 20 characters
                                            const formattedValue = formatPhoneNumber(val).slice(0, 20);
                                            onChange(formattedValue);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Import Phone Number *"
                                        // 3. Physical browser limit for the UI
                                        inputProps={{ maxLength: 20 }}
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />
                            <Controller
                                name="importEmail"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Email cannot exceed 255 characters'
                                    },
                                    validate: (value) => {
                                        // If the field is empty, blank, or undefined, bypass validation (since it is not required)
                                        if (!value || value.trim() === '') {
                                            return true;
                                        }
                                        // Standard RFC 5322 email validation regex pattern
                                        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                        return emailRegex.test(value.trim()) || 'Invalid email address format';
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        variant="standard"
                                        fullWidth
                                        sx={{
                                            width: '25%',
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Prevent leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="Import Email" // No asterisk (*) because it's optional
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                        </Stack>
                    </fieldset>

                    {/* Checkbox for Billing Address */}
                    <Box sx={{ width: '50%' }}>
                        <Controller
                            name="sameAsCorporate"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <FormControlLabel
                                    sx={{
                                        display: 'flex', alignItems: 'flex-end',
                                        // 1. Target the Label specifically when disabled
                                        "& .MuiFormControlLabel-label.Mui-disabled": {
                                            color: 'black', // Change to '#00194c' if you want it to match the checkbox
                                            opacity: 1,      // Removes the "light/faded" look
                                            WebkitTextFillColor: 'black', // Fix for Safari/Chrome
                                        },
                                        // 2. Ensure the Checkbox within the label is also red when disabled
                                        "& .MuiCheckbox-root.Mui-disabled": {
                                            color: 'rgba(0, 25, 76, 1)',
                                            opacity: 1,
                                        }
                                    }}
                                    control={
                                        <StyledCheckbox
                                            checked={!!value}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;

                                                // 1. Update React Hook Form state
                                                onChange(isChecked);
                                                setReadOnly(isChecked);
                                                if (isChecked) {
                                                    setValue('exportAddressLine1', getValues('importAddressLine1') || '');
                                                    setValue('exportAddressLine2', getValues('importAddressLine2') || '');
                                                    setValue('exportCity', getValues('importCity') || '');
                                                    setValue('exportState', getValues('importState') || '');
                                                    setValue('exportZipCode', getValues('importZip') || '');
                                                    setValue('exportEmail', getValues('importEmail') || '');
                                                    setValue('exportphoneNumber', getValues('importphoneNumber') || '');
                                                } else {
                                                    setValue('exportAddressLine1', '');
                                                    setValue('exportAddressLine2', '');
                                                    setValue('exportCity', '');
                                                    setValue('exportState', '');
                                                    setValue('exportZipCode', '');
                                                    setValue('exportEmail', '');
                                                    setValue('exportphoneNumber', '');
                                                }
                                            }}
                                            disabled={(type === 'View') ? readOnly : false}
                                        />
                                    }
                                    label="Check if above Import Address is same for Export Address"
                                />
                            )}
                        />
                    </Box>

                    {/* Export Address Section - Conditionally rendered */}
                    <fieldset style={{ borderColor: '#000', borderRadius: '8px' }}>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Export Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
                            <Controller
                                name="exportAddressLine1"
                                control={control}
                                rules={{
                                    required: 'Address Line 1 is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="Address Line 1*" // Added asterisk to visually mark it required
                                        disabled={readOnly}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays validation or required error text
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />

                            <Controller
                                name="exportAddressLine2"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 2 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 2 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
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
                                        label="Address Line 2" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="exportCity"
                                control={control}
                                rules={{
                                    required: 'City is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="City*" // Added asterisk to visually mark it required
                                        disabled={readOnly}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays the required or validation error messages
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />

                            <Controller
                                name="exportState"
                                control={control}
                                rules={{
                                    required: 'State is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="State*" // Added asterisk to visually mark it required
                                        disabled={readOnly}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays validation error text underneath the input
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />


                            <Controller
                                name="exportZipCode"
                                control={control}
                                rules={{
                                    required: 'Zipcode is required', // NEW: Enforces the required rule
                                    validate: (value) => {
                                        // Empty strings are intercepted cleanly by the required property above
                                        if (!value) return true;

                                        // 1. Block "all zeros"
                                        const rawDigits = value.replace(/[^\d]/g, '');
                                        if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

                                        // 2. Strict Length/Format check
                                        // Check if it matches exactly 5 digits OR exactly 5-5 digits (11 total characters)
                                        const zipRegex = /(^\d{5}$)|(^\d{5}-\d{5}$)/;
                                        if (!zipRegex.test(value)) {
                                            return 'Zip Code must be exactly 5 digits or a range (#####-#####)';
                                        }

                                        // 3. Range-specific constraints (only if a range is present)
                                        if (value.includes('-')) {
                                            const parts = value.split('-');
                                            const firstZip = parts[0];
                                            const secondZip = parts[1];

                                            // Ensure the first 3 digits of both segments match perfectly
                                            if (firstZip.slice(0, 3) !== secondZip.slice(0, 3)) {
                                                return `End range prefix must match '${firstZip.slice(0, 3)}'`;
                                            }

                                            // Ensure the last 2 digits of the second segment are strictly greater
                                            const startSuffix = parseInt(firstZip.slice(-2), 10);
                                            const endSuffix = parseInt(secondZip.slice(-2), 10);

                                            if (endSuffix === startSuffix) return 'End range cannot be equal to start';
                                            if (endSuffix < startSuffix) return 'End range must be greater than start';
                                        }

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const input = e.target.value;
                                            // Allow only digits and a single dash character
                                            let raw = input.replace(/[^\d-]/g, '');

                                            // Detect backspacing/deletion
                                            const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

                                            if (!isDeleting && raw.length === 5 && !raw.includes('-')) {
                                                // Auto-append dash only when typing forwards past the 5th digit
                                                raw = `${raw}-`;
                                            }

                                            // Prevent typing more than 11 characters (#####-#####)
                                            onChange(raw.slice(0, 11));
                                        }}
                                        inputProps={{ maxLength: 11, inputMode: 'numeric' }}
                                        label="Zip Code*" // Added asterisk to visually mark it required
                                        error={!!error}
                                        helperText={error?.message || 'Ex: 12345 or 12345-12346'}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        disabled={readOnly}
                                    />
                                )}
                            />


                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="exportphoneNumber"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 20,
                                        message: 'Export Phone number cannot exceed 20 characters'
                                    },
                                    validate: (value) => {
                                        if (!value) return true; // Allow empty

                                        // 1. Check for all zeros (strips formatting and checks if only 0s remain)
                                        const digitsOnly = value.replace(/\D/g, '');
                                        const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);

                                        if (isAllZeros) return 'Import Phone number cannot be all zeros';

                                        // 2. Format validation (Optional: adjust regex if you want a specific pattern for 20 chars)
                                        // If you just want to allow any 20 chars, the maxLength rule above handles it.

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith(' ')) return;

                                            // Keeps your existing formatting, allowing up to 20 characters
                                            const formattedValue = formatPhoneNumber(val).slice(0, 20);
                                            onChange(formattedValue);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Export Phone Number *"
                                        // 3. Physical browser limit for the UI
                                        inputProps={{ maxLength: 20 }}
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />
                            <Controller
                                name="exportEmail"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Email cannot exceed 255 characters'
                                    },
                                    validate: (value) => {
                                        // Bypass validation if the field is empty or contains only spaces (since it is not required)
                                        if (!value || value.trim() === '') {
                                            return true;
                                        }
                                        // Standard email validation regex pattern
                                        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                        return emailRegex.test(value.trim()) || 'Invalid email address format';
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        variant="standard"
                                        fullWidth
                                        sx={{
                                            width: '25%',
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Prevent leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="Export Email" // Optional field (no asterisk)
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                        </Stack>
                    </fieldset>

                    

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
                        {!isLoading && <Button
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
                        }
                        {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                    </Box>
                </Stack>}
                {/* {type === 'View' && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                    <Button
                        variant="outlined"
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
                        Save
                    </Button>
                </Stack>} */}
            </Box>
            
            <Dialog open={openConfirmDialog} onClose={handleAlert} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleAlert();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '500px',
                        height: '150px',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <>
                        <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Alert!</Typography>
                            <Iconify icon="carbon:close" onClick={() => handleAlert()} sx={{ cursor: 'pointer' }} />
                        </Stack>
                        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                    </>
                    <Box sx={{ pt: 2 }}>
                        Export Address must match Import Address when "same as Import" is checked.
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}

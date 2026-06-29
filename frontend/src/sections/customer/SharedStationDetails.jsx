import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller, set } from 'react-hook-form';
import {
    Button,
    Box,
    FormControlLabel,
    CircularProgress,
    Stack,
    Typography,
    Divider, Autocomplete
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import StationTabs from './StationTabs';
import { setTableBeingViewed, postStationData, putStationData } from '../../redux/slices/customer';
import { useDispatch, useSelector } from '../../redux/store';
import formatPhoneNumber from '../../utils/formatPhoneNumber';

SharedStationDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCustomerStationDetails: PropTypes?.object,
    customerId: PropTypes.any,
};

export default function SharedStationDetails({ type, handleCloseConfirm, selectedCustomerStationDetails, customerId }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const isLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [warehouseFlag, setWarehouseFlag] = useState(false);
    const [hasWarehouseService, setHasWarehouseServiceFlag] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
        watch,
        setValue,
    } = useForm({
        defaultValues: {
            stationName: '',
            rmAccountNumber: '',
            airportCode: '',
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
            warehouse: 'N',
            warehouseDetails: '',
            stationNotes: '',
            hasWarehouseService: 'N',
            warehouseEmails: [],
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        let obj = {
            "customerId": parseInt(localStorage.getItem('customerId'), 10),
            "stationName": data.stationName,
            "rmAccountNumber": data.rmAccountNumber,
            "airportCode": data.airportCode,
            "phoneNumber": data.phoneNumber,
            "faxNumber": data.faxNumber,
            "openTime": data.openTime || "00:00:00",
            "closeTime": data.closeTime || "00:00:00",
            "hours": data.hours,
            "warehouse": (data.warehouse) ? 'Y' : 'N',
            "warehouseDetail": data.warehouseDetails,
            "hasWarehouseService": (data.hasWarehouseService) ? 'Y' : 'N',
            "warehouseEmails": data.hasWarehouseService ? data.warehouseEmails : [],
            "addresses": [
                {
                    "line1": data.addressLine1,
                    "line2": data.addressLine2,
                    "city": data.city,
                    "state": data.state,
                    "zipCode": data.zipCode,
                    "addressRole": "Primary"
                }
            ],
            "note": {
                "messageText": data.stationNotes
            }
        }
        if (type === 'Add') {
            // dispatch post
            dispatch(postStationData(obj));

        }
        if (type === 'Edit') {
            obj.addresses[0].addressId = selectedCustomerStationDetails?.addresses?.[0].addressId;
            delete obj.note;
            // dispatch put
            dispatch(putStationData(selectedCustomerStationDetails?.stationId, obj));
        }
    };

    useEffect(() => {
        dispatch(setTableBeingViewed('Department'));
    }, []);
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (type === 'View') {
            setReadOnly(true);
        } else {
            setReadOnly(false);
        }
    }, [type]);

    useEffect(() => {
        if (selectedCustomerStationDetails) {
            // Populate form with selected station details  
            setValue('stationName', selectedCustomerStationDetails.stationName || '');
            setValue('rmAccountNumber', selectedCustomerStationDetails.rmAccountNumber || '');
            setValue('airportCode', selectedCustomerStationDetails.airportCode || '');
            setValue('addressLine1', selectedCustomerStationDetails.addresses?.[0]?.line1 || '');
            setValue('addressLine2', selectedCustomerStationDetails.addresses?.[0]?.line2 || '');
            setValue('city', selectedCustomerStationDetails.addresses?.[0]?.city || '');
            setValue('state', selectedCustomerStationDetails.addresses?.[0]?.state || '');
            setValue('zipCode', selectedCustomerStationDetails.addresses?.[0]?.zipCode || '');
            setValue('phoneNumber', selectedCustomerStationDetails.phoneNumber || '');
            setValue('faxNumber', selectedCustomerStationDetails.faxNumber || '');
            setValue('openTime', (selectedCustomerStationDetails.openTime === "00:00:00" ? "" : selectedCustomerStationDetails.openTime) || '');
            setValue('closeTime', (selectedCustomerStationDetails.closeTime === "00:00:00" ? "" : selectedCustomerStationDetails.closeTime) || '');
            setValue('hours', selectedCustomerStationDetails.hours || '');
            setWarehouseFlag(selectedCustomerStationDetails.warehouse === 'Y' ? true : false);
            setValue('warehouse', selectedCustomerStationDetails.warehouse === 'Y' ? true : false);
            setValue('warehouseDetails', selectedCustomerStationDetails.warehouseDetail || "");
            // for hasWarehouseService
            setHasWarehouseServiceFlag(selectedCustomerStationDetails?.hasWarehouseService === 'Y' ? true : false);
            setValue('hasWarehouseService', selectedCustomerStationDetails?.hasWarehouseService === 'Y' ? true : false);
            if (selectedCustomerStationDetails?.warehouseEmails) {
                // 1. Get the raw value from the backend
                const rawEmails = selectedCustomerStationDetails?.warehouseEmails;

                // 2. If it's a string, clean up the literal escaped outer quotes. Otherwise, fallback to ""
                const cleanedEmails = typeof rawEmails === 'string'
                    ? rawEmails.replace(/^"|"$/g, '').trim()
                    : "";

                // 3. Set the form value as a clean string
                setValue('warehouseEmails', cleanedEmails);
            }
        }
    }, [selectedCustomerStationDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 'normal' }}>{(selectedCustomerStationDetails?.stationName && type === 'View') ? selectedCustomerStationDetails?.stationName : ''} Station Details</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="stationName"
                            control={control}
                            rules={{
                                required: 'Station Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Station Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || ' StationName cannot be only spaces'
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Station Name"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.stationName} helperText={errors.stationName?.message}
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
                                />
                            )}
                        />
                        <Controller
                            name="addressLine1"
                            control={control}
                            rules={{
                                required: 'Address Line 1 is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Address Line 1 cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Address Line 1"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.addressLine1} helperText={errors.addressLine1?.message}
                                    disabled={readOnly}
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
                                />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
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
                                <StyledTextField {...field} label="Address Line 2" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} disabled={readOnly} error={!!error}
                                    inputProps={{ maxLength: 255 }}
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
                                />
                            )}
                        />
                        <Controller
                            name="city"
                            control={control}
                            rules={{
                                required: 'City is required',
                                maxLength: {
                                    value: 100,
                                    message: 'City cannot exceed 100 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'City cannot be only spaces'
                            }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="City" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} required error={!!errors.city} helperText={errors.city?.message} disabled={readOnly}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // prevent only leading spaces while typing
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
                            name="state"
                            control={control}
                            rules={{
                                required: 'State is required',
                                maxLength: {
                                    value: 100,
                                    message: 'State cannot exceed 100 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'State cannot be only spaces'
                            }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="State" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} required error={!!errors.state}
                                    helperText={errors.state?.message} disabled={readOnly}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // prevent only leading spaces while typing
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
                            name="zipCode"
                            control={control}
                            rules={{
                                required: 'Zipcode is required',
                                validate: (value) => {
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
                                    label="Zip Code"
                                    error={!!error}
                                    helperText={error?.message || 'Ex: 12345 or 12345-12346'}
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    disabled={readOnly}
                                    required
                                />
                            )}
                        />

                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{
                                required: 'Phone number is required',
                                maxLength: {
                                    value: 20,
                                    message: 'Phone number cannot exceed 20 characters'
                                },
                                validate: (value) => {
                                    if (!value) return true; // Allow empty

                                    // 1. Check for all zeros (strips formatting and checks if only 0s remain)
                                    const digitsOnly = value.replace(/\D/g, '');
                                    const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);

                                    if (isAllZeros) return 'Phone number cannot be all zeros';

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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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

                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
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
                                    disabled={readOnly}
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

                        <Controller
                            name="warehouse"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <FormControlLabel
                                    sx={{
                                        width: '30%',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        pointerEvents: 'none', // Keeps the "Warehouse" text unclickable
                                        "& .MuiFormControlLabel-label.Mui-disabled": {
                                            color: 'black',
                                            opacity: 1,
                                            WebkitTextFillColor: 'black',
                                        },
                                        "& .MuiCheckbox-root.Mui-disabled": {
                                            color: 'black',
                                            opacity: 1,
                                        }
                                    }}
                                    control={
                                        <StyledCheckbox
                                            sx={{
                                                pointerEvents: 'auto',
                                                padding: 0, // 1. Removes the invisible clickable padding
                                                marginRight: '8px' // 2. Adds back space between box and label
                                            }}
                                            disableRipple // 3. Removes the circular highlight when clicked
                                            checked={!!value}
                                            disabled={readOnly}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                onChange(isChecked);
                                                setWarehouseFlag(isChecked);
                                            }}
                                        />
                                    }
                                    label="Does the customer station have a warehouse?"
                                />
                            )}
                        />



                        {warehouseFlag && <Controller
                            name="warehouseDetails"
                            control={control}
                            rules={{
                                maxLength: {
                                    value: 250,
                                    message: 'Warehouse details cannot exceed 250 characters'
                                },
                                validate: (value) => !value || value.trim().length > 0 || 'Warehouse details cannot be only spaces'
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField {...field} label="Warehouse details" variant="standard" fullWidth sx={{
                                    width: '40%',
                                }} disabled={readOnly} error={!!error}
                                    inputProps={{ maxLength: 250 }}
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
                                />
                            )}
                        />}
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="hasWarehouseService"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <FormControlLabel
                                    sx={{
                                        width: '40%',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        pointerEvents: 'none', // Keeps the "Warehouse" text unclickable
                                        "& .MuiFormControlLabel-label.Mui-disabled": {
                                            color: 'black',
                                            opacity: 1,
                                            WebkitTextFillColor: 'black',
                                        },
                                        "& .MuiCheckbox-root.Mui-disabled": {
                                            color: 'black',
                                            opacity: 1,
                                        }
                                    }}
                                    control={
                                        <StyledCheckbox
                                            sx={{
                                                pointerEvents: 'auto',
                                                padding: 0, // 1. Removes the invisible clickable padding
                                                marginRight: '8px' // 2. Adds back space between box and label
                                            }}
                                            disableRipple // 3. Removes the circular highlight when clicked
                                            checked={!!value}
                                            disabled={readOnly}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                onChange(isChecked);
                                                setHasWarehouseServiceFlag(isChecked);
                                            }}
                                        />
                                    }
                                    label="Requires R&M Warehouse Services"
                                />
                            )}
                        />



                        {hasWarehouseService && <Controller
                            name="warehouseEmails"
                            control={control}
                            defaultValue="" // 1. Ensures the field starts as a string, not undefined
                            rules={{
                                validate: (value) => {
                                    if (!value || typeof value !== 'string') return true; // 2. Guard clause
                                    const emails = value.split(',').map(e => e.trim()).filter(Boolean);
                                    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                    const allValid = emails.every(email => emailRegex.test(email));
                                    return allValid || "One or more emails are invalid";
                                }
                            }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => {
                                // 3. Robust string conversion check to prevent the .split error
                                const stringValue = typeof value === 'string' ? value : '';
                                const selectedEmailsArray = stringValue.split(',').map(e => e.trim()).filter(Boolean);

                                return (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={[]}
                                        value={selectedEmailsArray}
                                        fullWidth
                                        onChange={(event, newValue) => {
                                            const processedEmails = newValue
                                                .flatMap(item => (typeof item === 'string' ? item.split(',') : []))
                                                .map(e => e.trim())
                                                .filter(Boolean);

                                            onChange(processedEmails.join(', '));
                                        }}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                variant="standard"
                                                label="Additional Email"
                                                placeholder={selectedEmailsArray.length === 0 ? "Type emails..." : ""}
                                                InputLabelProps={{ shrink: true }}
                                                error={!!error}
                                                helperText={error ? error.message : "Press Enter after each email to add it"}
                                            />
                                        )}
                                        sx={{ mt: 2 }}
                                    />
                                );
                            }}
                        />

                        }
                    </Stack>

                    {/* customer notes */}
                    {type === 'Add' && <Controller
                        name="stationNotes"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: {
                                value: 2000,
                                message: 'Station Notes cannot exceed 2000 characters'
                            },
                            validate: (value) => value.trim().length > 0 || 'Station Notes cannot be only spaces'
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Station Notes *" error={!!error}
                                helperText={error ? 'Station notes is required' : ''} disabled={readOnly}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // prevent only leading spaces while typing
                                    if (value.startsWith(' ')) {
                                        field.onChange(value.trimStart());
                                    } else {
                                        field.onChange(value);
                                    }
                                }}
                            />
                        )}
                    />}
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
                {
                    type === 'View' && <StationTabs />
                }
            </Box>
        </>
    );
};

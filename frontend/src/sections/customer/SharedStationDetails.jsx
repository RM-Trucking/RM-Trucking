import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller, set } from 'react-hook-form';
import {
    Button,
    Box,
    FormControlLabel,
    Checkbox,
    Stack,
    Typography,
    Divider
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
    const [warehouseFlag, setWarehouseFlag] = useState(false);
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
            "openTime": data.openTime,
            "closeTime": data.closeTime,
            "hours": data.hours,
            "warehouse": (data.warehouse) ? 'Y' : 'N',
            "warehouseDetail": data.warehouseDetails,
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
        handleCloseConfirm();
    };

    useEffect(() => {
        dispatch(setTableBeingViewed('Department'));
    }, []);
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
            setValue('openTime', selectedCustomerStationDetails.openTime || '');
            setValue('closeTime', selectedCustomerStationDetails.closeTime || '');
            setValue('hours', selectedCustomerStationDetails.hours || '');
            setWarehouseFlag(selectedCustomerStationDetails.warehouse === 'Y' ? true : false);
            setValue('warehouse', selectedCustomerStationDetails.warehouse === 'Y' ? true : false);
            setValue('warehouseDetails', selectedCustomerStationDetails.warehouseDetail || "");
        }
    }, [selectedCustomerStationDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>{(selectedCustomerStationDetails?.stationName && type === 'View') ? selectedCustomerStationDetails?.stationName : ''} Station Details</Typography>
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
                                pattern: {
                                    value: /^\d{5}(-\d{4})?$/, // Validates ##### or #####-####
                                    message: 'Invalid Zip Code format'
                                }
                            }}
                            render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    required
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
                                    sx={{ width: '25%' }}
                                    label="Zip Code"
                                    error={!!error}
                                    helperText={error?.message || ''}
                                    disabled={readOnly}
                                    inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
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
                                        width: '25%',
                                        display: 'flex', alignItems: 'flex-end',
                                    }}
                                    control={<StyledCheckbox checked={!!value}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;

                                            // 1. Update React Hook Form state
                                            onChange(isChecked);

                                            // 2. Update your local state variable
                                            setWarehouseFlag(isChecked);
                                            console.log("New warehouse state:", isChecked);
                                        }} disabled={readOnly} />}
                                    label="Warehouse"
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
                                    width: '25%',
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
                </Stack>}
                {
                    type === 'View' && <StationTabs />
                }
            </Box>
        </>
    );
};

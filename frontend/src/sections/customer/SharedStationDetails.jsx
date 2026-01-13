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
                            rules={{ required: 'Station Name is required' }}
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
                                />
                            )}
                        />
                        <Controller
                            name="rmAccountNumber"
                            control={control}
                            rules={{ required: 'RM Account Number is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="RM Account Number"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.rmAccountNumber} helperText={errors.rmAccountNumber?.message}
                                    disabled={readOnly}
                                />
                            )}
                        />
                        <Controller
                            name="airportCode"
                            control={control}
                            rules={{
                                required: 'Airport Code is required',
                                pattern: {
                                    value: /^[A-Z]{3}$/,
                                    message: 'Must be a 3-letter IATA code'
                                }
                            }}
                            render={({ field: { onChange, value, ...field } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => {
                                        // 1. Remove non-letters, 2. Convert to Uppercase, 3. Limit to 3 chars
                                        const formatted = e.target.value
                                            .replace(/[^a-zA-Z]/g, '')
                                            .toUpperCase()
                                            .slice(0, 3);
                                        onChange(formatted);
                                    }}
                                    label="Airport Code"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    // Apply CSS to force uppercase display while typing
                                    inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 3 }}
                                    error={!!errors.airportCode}
                                    helperText={errors.airportCode?.message}
                                    disabled={readOnly}
                                />
                            )}
                        />

                        <Controller
                            name="addressLine1"
                            control={control}
                            rules={{ required: 'Address Line 1 is required' }}
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
                                />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="addressLine2"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Address Line 2" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} disabled={readOnly} />
                            )}
                        />
                        <Controller
                            name="city"
                            control={control}
                            rules={{ required: 'City is required' }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="City" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} required error={!!errors.city} helperText={errors.city?.message} disabled={readOnly} />
                            )}
                        />
                        <Controller
                            name="state"
                            control={control}
                            rules={{ required: 'State is required' }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="State" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} required error={!!errors.state}
                                    helperText={errors.state?.message} disabled={readOnly} />
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
                                required: true,
                                pattern: {
                                    value: /^\(\d{3}\) \d{3}-\d{4}$/, // Ensures full format is valid
                                    message: 'Invalid phone format'
                                }
                            }}
                            render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value}
                                    onChange={(e) => {
                                        const formattedValue = formatPhoneNumber(e.target.value);
                                        onChange(formattedValue); // Update form state with formatted value
                                    }}
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    label="Phone Number *"
                                    error={!!error}
                                    helperText={error ? 'Phone number is required' : ''}
                                    disabled={readOnly}
                                />
                            )}
                        />
                        <Controller
                            name="faxNumber"
                            control={control}
                            rules={{
                                pattern: {
                                    value: /^\(\d{3}\) \d{3}-\d{4}$/, // Optional: validates full format
                                    message: 'Invalid fax format (###) ###-####'
                                }
                            }}
                            render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    onChange={(e) => {
                                        const input = e.target.value.replace(/[^\d]/g, ''); // Strip non-digits
                                        const len = input.length;
                                        let formatted = input;

                                        // Apply formatting: (###) ###-####
                                        if (len <= 3) {
                                            formatted = input;
                                        } else if (len <= 6) {
                                            formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
                                        } else {
                                            formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6, 10)}`;
                                        }

                                        onChange(formatted);
                                    }}
                                    label="Fax Number"
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    error={!!error}
                                    helperText={error?.message || ''}
                                    disabled={readOnly}
                                    inputProps={{ maxLength: 14 }} // (xxx) xxx-xxxx is 14 chars
                                />
                            )}
                        />

                        <Controller
                            name="openTime"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    label="Open Time"
                                    type="time"
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={readOnly}
                                    error={!!error}
                                    helperText={error?.message}
                                    inputProps={{ step: 1 }}
                                />
                            )}
                        />
                        <Controller
                            name="closeTime"
                            control={control}
                            rules={{
                                validate: (value) => {
                                    const openTime = watch('openTime');
                                    if (!value || !openTime) return true; // Don't validate if one is missing
                                    return value > openTime || 'Close time must be later than open time';
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    label="Close Time"
                                    type="time"
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={readOnly}
                                    inputProps={{ step: 1 }}
                                    error={!!error}
                                    helperText={error?.message} // Displays the validation error
                                />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="hours"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} type='number' label="Hours" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} InputLabelProps={{ shrink: true }} disabled={readOnly} />
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
                            render={({ field }) => (
                                <StyledTextField {...field} label="Warehouse details" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} disabled={readOnly} />
                            )}
                        />}
                    </Stack>

                    {/* customer notes */}
                    {type === 'Add' && <Controller
                        name="stationNotes"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Station Notes *" error={!!error}
                                helperText={error ? 'Station notes is required' : ''} disabled={readOnly} />
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

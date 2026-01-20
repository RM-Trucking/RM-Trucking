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
    MenuItem,
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import CustomerViewStationTable from './CustomerViewStationTable';
import { setTableBeingViewed, postCustomerData, putCustomerData } from '../../redux/slices/customer';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
// ----------------------------------------------------------------------


SharedCustomerDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCustomerRowDetails: PropTypes?.object
};

export default function SharedCustomerDetails({ type, handleCloseConfirm, selectedCustomerRowDetails }) {
    const dispatch = useDispatch();
    // Define default values for the form
    const defaultValues = {
        customerName: '',
        rmAccountNumber: '',
        phoneNumber: '',
        website: '',
        corpAddressLine1: '',
        corpAddressLine2: '',
        corpCity: '',
        corpState: '',
        corpZipCode: '',
        sameAsCorporate: false,
        billAddressLine1: '',
        billAddressLine2: '',
        billCity: '',
        billState: '',
        billZipCode: '',
        customerNotes: '',
        customerStatus: '',
        reasonForStatus: ''
    };
    const [readOnly, setReadOnly] = useState(false);

    const { control, handleSubmit, watch, getValues, setValue } = useForm({ defaultValues });

    // Watch the checkbox value to conditionally render billing address
    const sameAsCorporate = watch('sameAsCorporate');

    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);
        let obj = {
            "customerName": data?.customerName?.trim(),
            "rmAccountNumber": data?.rmAccountNumber,
            "phoneNumber": data?.phoneNumber,
            "website": data?.website,
            "corporateBillingSame": data.sameAsCorporate ? 'Y' : 'N',
            "addresses": [
                {
                    "line1": data?.corpAddressLine1,
                    "line2": data?.corpAddressLine2,
                    "city": data?.corpCity,
                    "state": data?.corpState,
                    "zipCode": data?.corpZipCode,
                    "addressRole": "Corporate"
                },
                {
                    "line1": data?.billAddressLine1,
                    "line2": data?.billAddressLine2,
                    "city": data?.billCity,
                    "state": data?.billState,
                    "zipCode": data?.billZipCode,
                    "addressRole": "Billing"
                }
            ],
            "note": {
                "messageText": data?.customerNotes
            }
        }
        if (type === 'Add') {
            dispatch(postCustomerData(obj));
        }
        if (type === 'Edit') {
            obj.activeStatusReason = data.reasonForStatus || '';
            // obj.activeStatus = data.customerStatus || '';
            obj.addresses[0].addressId = (selectedCustomerRowDetails.addresses[0].addressRole === 'Corporate') ? selectedCustomerRowDetails.addresses[0].addressId : selectedCustomerRowDetails.addresses[1].addressId;
            obj.addresses[1].addressId = (selectedCustomerRowDetails.addresses[1].addressRole === 'Billing') ? selectedCustomerRowDetails.addresses[1].addressId : selectedCustomerRowDetails.addresses[0].addressId;;
            delete obj.note;
            dispatch(putCustomerData(obj, selectedCustomerRowDetails?.customerId));
        }
        handleCloseConfirm();
    };
    useEffect(() => {
        dispatch(setTableBeingViewed('station'));
    }, []);
    useEffect(() => {
        console.log('Selected Customer Details:', selectedCustomerRowDetails);
        setValue('customerName', selectedCustomerRowDetails?.customerName || '');
        setValue('rmAccountNumber', selectedCustomerRowDetails?.rmAccountNumber || '');
        setValue('phoneNumber', selectedCustomerRowDetails?.phoneNumber || '');
        setValue('website', selectedCustomerRowDetails?.website || '');
        setValue('corpAddressLine1', selectedCustomerRowDetails?.addresses?.[0]?.line1 || '');
        setValue('corpAddressLine2', selectedCustomerRowDetails?.addresses?.[0]?.line2 || '');
        setValue('corpCity', selectedCustomerRowDetails?.addresses?.[0]?.city || '');
        setValue('corpState', selectedCustomerRowDetails?.addresses?.[0]?.state || '');
        setValue('corpZipCode', selectedCustomerRowDetails?.addresses?.[0]?.zipCode || '');
        setValue('sameAsCorporate', selectedCustomerRowDetails?.corporateBillingSame === 'Y' ? true : false);
        setReadOnly(selectedCustomerRowDetails?.corporateBillingSame === 'Y' ? true : false);
        setValue('billAddressLine1', selectedCustomerRowDetails?.addresses?.[1]?.line1 || '');
        setValue('billAddressLine2', selectedCustomerRowDetails?.addresses?.[1]?.line2 || '');
        setValue('billCity', selectedCustomerRowDetails?.addresses?.[1]?.city || '');
        setValue('billState', selectedCustomerRowDetails?.addresses?.[1]?.state || '');
        setValue('billZipCode', selectedCustomerRowDetails?.addresses?.[1]?.zipCode || '');
    }, [selectedCustomerRowDetails]);
    useEffect(() => {
        if (type === 'View') {
            setReadOnly(true);
        } else {
            setReadOnly(false);
        }
    }, [type]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="customerName"
                            control={control}
                            rules={{
                                required: 'Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Customer Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Customer Name cannot be only spaces'
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
                                    label="Customer Name *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
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
                                    label="Customer Phone Number *"
                                    // 3. Physical browser limit for the UI
                                    inputProps={{ maxLength: 20 }}
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={readOnly}
                                />
                            )}
                        />

                        <Controller
                            name="website"
                            control={control}
                            rules={{
                                required: 'Website is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Website cannot exceed 255 characters'
                                },
                                pattern: {
                                    value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
                                    message: 'Please enter a valid URL'
                                },
                                // Prevents submitting if the field is only spaces
                                validate: (val) => val?.trim().length > 0 || 'Website cannot be empty'
                            }}
                            render={({ field: { onChange, onBlur, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    label="Customer website *"
                                    placeholder="example.com"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
                                    inputProps={{ maxLength: 255 }} // Hard limit at the input level
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Remove all whitespace characters as they type
                                        onChange(val.replace(/\s/g, ''));
                                    }}
                                    onBlur={(e) => {
                                        let val = e.target.value.trim(); // Trim extra spaces on blur
                                        if (val && !/^https?:\/\//i.test(val)) {
                                            onChange(`https://${val}`);
                                        }
                                        onBlur();
                                    }}
                                />
                            )}
                        />
                    </Stack>

                    {/* Corporate Address Section */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Corporate Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="corpAddressLine1"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 1" disabled={(type === 'View') ? readOnly : false}
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
                                name="corpAddressLine2"
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
                                name="corpCity"
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
                                        fullWidth label="City" disabled={(type === 'View') ? readOnly : false}
                                        error={!!error} inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="corpState"
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
                                        fullWidth label="State" disabled={(type === 'View') ? readOnly : false}
                                        error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="corpZipCode"
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
                                        disabled={(type === 'View') ? readOnly : false}
                                        inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* Checkbox for Billing Address */}
                    <Controller
                        name="sameAsCorporate"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={!!value}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;

                                            // 1. Update React Hook Form state
                                            onChange(isChecked);
                                            setReadOnly(isChecked);
                                            if (isChecked) {
                                                setValue('billAddressLine1', getValues('corpAddressLine1') || '');
                                                setValue('billAddressLine2', getValues('corpAddressLine2') || '');
                                                setValue('billCity', getValues('corpCity') || '');
                                                setValue('billState', getValues('corpState') || '');
                                                setValue('billZipCode', getValues('corpZipCode') || '');
                                            } else {
                                                setValue('billAddressLine1', '');
                                                setValue('billAddressLine2', '');
                                                setValue('billCity', '');
                                                setValue('billState', '');
                                                setValue('billZipCode', '');
                                            }
                                        }}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                }
                                label="Check if above Corporate Address is same for Billing Address"
                            />
                        )}
                    />

                    {/* Billing Address Section - Conditionally rendered */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Billing Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
                            <Controller
                                name="billAddressLine1"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
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
                                        label="Address Line 1" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="billAddressLine2"
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
                                name="billCity"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="City" disabled={readOnly} error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="billState"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="State" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />

                            <Controller
                                name="billZipCode"
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
                                        disabled={readOnly}
                                        inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* customer notes */}
                    {type === 'Add' && <Controller
                        name="customerNotes"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: {
                                value: 2000,
                                message: 'Customer Notes cannot exceed 2000 characters'
                            },
                            validate: (value) => value.trim().length > 0 || 'Customer Notes cannot be only spaces'
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Customer Notes *" error={!!error}
                                helperText={error ? 'Customer notes is required' : ''}
                                // Intercept onChange to prevent leading spaces
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // prevent only leading spaces while typing
                                    if (value.startsWith(' ')) {
                                        field.onChange(value.trimStart());
                                    } else {
                                        field.onChange(value);
                                    }
                                }} />
                        )}
                    />}

                    {/* status section  */}
                    {/* {type === 'View' && <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Status &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} sx={{ mb: 2 }}>
                            <Controller
                                name="customerStatus"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        select // This turns the TextField into a Select
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Customer Status*"
                                        error={!!error}
                                        helperText={error ? 'Customer status is required' : ''}
                                    >
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                            <Controller
                                name="reasonForStatus"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        select // This turns the TextField into a Select
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Reason For Status*"
                                        error={!!error}
                                        helperText={error ? 'Reason is required' : ''}
                                    >
                                        <MenuItem value="payment_defaulter">Payment Defaulter</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                        </Stack>
                    </fieldset>} */}

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
            {/* station table */}
            {
                type === 'View' && <CustomerViewStationTable />
            }
        </>
    );
}

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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

SharedStationDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCustomerStationDetails: PropTypes?.object
};

export default function SharedStationDetails({ type, handleCloseConfirm, selectedCustomerStationDetails }) {
    const [warehouseFlag, setWarehouseFlag] = useState(false);
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues
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
            openTime: '11:00',
            closeTime: '20:00',
            hours: '08:00',
            warehouse: false,
            warehouseDetails: '',
            customerNotes: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        alert('Form submitted successfully! Check console for data.');
    };

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
                <Stack spacing={4}>
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
                                />
                            )}
                        />
                        <Controller
                            name="airportCode"
                            control={control}
                            rules={{ required: 'Airport Code is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Airport Code"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.airportCode} helperText={errors.airportCode?.message}
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
                                }} />
                            )}
                        />
                        <Controller
                            name="city"
                            control={control}
                            rules={{ required: 'City is required' }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="City" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} required error={!!errors.city} helperText={errors.city?.message} />
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
                                    helperText={errors.state?.message} />
                            )}
                        />
                        <Controller
                            name="zipCode"
                            control={control}
                            rules={{ required: 'Zip Code is required' }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Zip Code" variant="standard" fullWidth required sx={{
                                    width: '25%',
                                }} error={!!errors.zipCode} helperText={errors.zipCode?.message} />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{ required: 'Phone Number is required' }}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Phone Number" variant="standard" fullWidth required sx={{
                                    width: '25%',
                                }} error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} />
                            )}
                        />
                        <Controller
                            name="faxNumber"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Fax Number" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} />
                            )}
                        />
                        <Controller
                            name="openTime"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Open Time" type="time" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} InputLabelProps={{ shrink: true }} />
                            )}
                        />
                        <Controller
                            name="closeTime"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Close Time" type="time" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} InputLabelProps={{ shrink: true }} />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="hours"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} label="Hours" variant="standard" fullWidth sx={{
                                    width: '25%',
                                }} InputLabelProps={{ shrink: true }} />
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
                                        }} />}
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
                                }} />
                            )}
                        />}
                    </Stack>

                    {/* customer notes */}
                    <Controller
                        name="customerNotes"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Customer Notes *" error={!!error}
                                helperText={error ? 'Customer notes is required' : ''} />
                        )}
                    />
                </Stack>
                {type === 'Add' && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
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
                        Add
                    </Button>
                </Stack>}
            </Box>
        </>
    );
};

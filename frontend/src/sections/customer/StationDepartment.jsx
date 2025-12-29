import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    MenuItem,
    Stack,
    Typography,
    Divider
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';

StationDepartment.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedStationTabRowDetails: PropTypes.object,
};

export default function StationDepartment({ type, handleCloseConfirm, selectedStationTabRowDetails }) {
    const dispatch = useDispatch();
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
        setValue
    } = useForm({
        defaultValues: {
            stationName: '',
            department: '',
            emailID: '',
            phoneNumber: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        alert('Form submitted successfully! Check console for data.');
    };
    useEffect(() => {
        if (selectedStationTabRowDetails) {
            setValue('stationName', selectedStationTabRowDetails.stationName || '');
            setValue('department', selectedStationTabRowDetails.departmentName || '');
            setValue('emailID', selectedStationTabRowDetails.email || '');
            setValue('phoneNumber', selectedStationTabRowDetails.phoneNo || '');
        }}, [selectedStationTabRowDetails]);
    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Department Details</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{p:3}}>
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
                            name="department"
                            control={control}
                            rules={{ required: 'Department is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Department"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.department} helperText={errors.department?.message}
                                >
                                    <MenuItem value="air-export">Air Export</MenuItem>
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="emailID"
                            control={control}
                            rules={{ required: 'Email ID is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Email ID"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.emailID} helperText={errors.emailID?.message}
                                />
                            )}
                        />
                        <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{ required: 'Phone Number is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Phone Number"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message}
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
                </Stack>}
            </Box>
        </>
    );
};

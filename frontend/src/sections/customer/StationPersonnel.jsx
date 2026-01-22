import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    MenuItem,
    Stack,
    Typography,
    Divider,
    CircularProgress
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
import { postStationPersonnelData, putStationPersonnelData } from '../../redux/slices/customer';

StationPersonnel.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedStationTabRowDetails: PropTypes.object,
};

export default function StationPersonnel({ type, handleCloseConfirm, selectedStationTabRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const isLoading = useSelector((state) => state?.customerdata?.isLoading);
    const departmentData = useSelector((state) => state.customerdata.departmentData);
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
    } = useForm({
        defaultValues: {
            firstName: '',
            department: '',
            emailID: '',
            officePhoneNumber: '',
            cellPhoneNumber: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        let obj =
        {
            "stationId": parseInt(localStorage.getItem('stationId'), 10),
            "departmentId": data.department || selectedStationTabRowDetails?.departmentId,
            "name": data.firstName,
            "email": data.emailID,
            "officePhoneNumber": data.officePhoneNumber,
            "cellPhoneNumber": data.cellPhoneNumber
        }

        if (type === 'Add') {
            obj.note = { messageText: '' };
            dispatch(postStationPersonnelData(obj));
        }
        if (type === 'Edit') {
            dispatch(putStationPersonnelData(selectedStationTabRowDetails.personnelId, obj));
        }
    };
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (selectedStationTabRowDetails) {
            setValue('firstName', selectedStationTabRowDetails.name || '');
            setValue('department', selectedStationTabRowDetails.departmentId || '');
            setValue('emailID', selectedStationTabRowDetails.email || '');
            setValue('officePhoneNumber', selectedStationTabRowDetails.officePhoneNumber || '');
            setValue('cellPhoneNumber', selectedStationTabRowDetails.cellPhoneNumber || '');
        }
    }, [selectedStationTabRowDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Personnel Details</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="firstName"
                            control={control}
                            rules={{
                                required: 'First Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'First Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'First Name cannot be only spaces'
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="First Name"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.firstName} helperText={errors.firstName?.message}
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
                            name="department"
                            control={control}
                            rules={{
                                required: 'Department is required',
                                maxLength: {
                                    value: 100,
                                    message: 'Department cannot exceed 100 characters'
                                },
                                // Updated validation: Check if value exists and only trim if it's a string
                                validate: (val) => {
                                    if (val === null || val === undefined) return 'Selection cannot be empty';
                                    const stringVal = String(val).trim();
                                    return stringVal.length > 0 || 'Selection cannot be empty';
                                }
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    // Ensure value is never undefined to prevent uncontrolled component warnings
                                    value={field.value ?? ''}
                                    select
                                    label="Department"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    error={!!errors.department}
                                    helperText={errors.department?.message}
                                    SelectProps={{
                                        inputProps: { maxLength: 100 }
                                    }}
                                >
                                    {departmentData.map((data) => (
                                        <MenuItem key={data.departmentId} value={data.departmentId}>
                                            {data.departmentName}
                                        </MenuItem>
                                    ))}
                                </StyledTextField>
                            )}
                        />

                        <Controller
                            name="emailID"
                            control={control}
                            rules={{
                                required: 'Email ID is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Email cannot exceed 255 characters'
                                },
                                pattern: {
                                    // Updated for modern 2026 standards (RFC 5322)
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address format'
                                },
                                validate: (value) => value.trim().length > 0 || 'Email cannot be only spaces'
                            }}
                            render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    label="Email ID"
                                    variant="standard"
                                    fullWidth
                                    required
                                    type="email"
                                    sx={{ width: '25%' }}
                                    error={!!error}
                                    helperText={error?.message}
                                    // 1. Physically restrict browser input to 255 characters
                                    inputProps={{ maxLength: 255 }}
                                    onChange={(e) => {
                                        const val = e.target.value;

                                        // 2. Prevent leading spaces
                                        if (val.startsWith(' ')) {
                                            return;
                                        }

                                        // 3. Optional: Remove all spaces (emails should not contain spaces)
                                        const noSpaces = val.replace(/\s/g, '');

                                        onChange(noSpaces.slice(0, 255));
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="officePhoneNumber"
                            control={control}
                            rules={{
                                required: 'Office Phone number is required',
                                maxLength: {
                                    value: 20,
                                    message: ' Office Phone number cannot exceed 20 characters'
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
                                    label="Office Phone Number *"
                                    // 3. Physical browser limit for the UI
                                    inputProps={{ maxLength: 20 }}
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                />
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Controller
                            name="cellPhoneNumber"
                            control={control}
                            rules={{
                                required: 'Cell Phone number is required',
                                maxLength: {
                                    value: 20,
                                    message: ' Cell Phone number cannot exceed 20 characters'
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
                                    label="Cell Phone Number *"
                                    // 3. Physical browser limit for the UI
                                    inputProps={{ maxLength: 20 }}
                                    error={!!error}
                                    helperText={error ? error.message : ''}
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

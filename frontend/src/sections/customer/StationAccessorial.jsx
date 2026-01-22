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
import { postStationAccessorialData, putStationAccessorialData } from '../../redux/slices/customer';

StationAccessorial.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedStationTabRowDetails: PropTypes.object,
};

export default function StationAccessorial({ type, handleCloseConfirm, selectedStationTabRowDetails }) {
    const dispatch = useDispatch();
    const [chargeValue, setChargeValue] = useState(null);
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const selectedCustomerStationDetails = useSelector((state) => state?.customerdata?.selectedCustomerStationDetails);
    const accessorialData = useSelector((state) => state?.customerdata?.accessorialData);
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues
    } = useForm({
        defaultValues: {
            accessorial: null,
            chargesType: '',
            charges: '',
            notes: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        let obj = {
            "entityId": selectedCustomerStationDetails?.entityId,
            "accessorialId": data.accessorial,
            "chargeType": data.chargesType,
            "chargeValue": parseFloat(data.charges),
            "note": {
                "messageText": data.notes
            }
        }
        if (type === 'Add') {
            dispatch(postStationAccessorialData(obj));
        } else if (type === 'Edit') {
            delete obj.entityId; // Remove entityId for edit
            delete obj.accessorialId; // Remove accessorialId for edit
            console.log(obj)
            dispatch(putStationAccessorialData(selectedStationTabRowDetails?.entityAccessorialId, obj));
        }
    };
    useEffect(() => {
            if (operationalMessage && handleCloseConfirm) {
                handleCloseConfirm();
            }
        }, [operationalMessage]);
    useEffect(() => {
        if (selectedStationTabRowDetails) {
            setValue('accessorial', selectedStationTabRowDetails.accessorialId || '');
            setValue('chargesType', selectedStationTabRowDetails.chargeType || '');
            setValue('charges', selectedStationTabRowDetails.chargeValue || '');
            setChargeValue(selectedStationTabRowDetails.chargeValue || '');
            setValue('notes', selectedStationTabRowDetails.notes?.[0]?.messageText || '');
        }
    }, [selectedStationTabRowDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Accessorial Details</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="accessorial"
                            control={control}
                            rules={{
                                required: 'Accessorial is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Accessorial cannot exceed 255 characters'
                                },
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Accessorial"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.accessorial} helperText={errors.accessorial?.message}
                                    disabled={type === 'Edit'}
                                    SelectProps={{
                                        inputProps: { maxLength: 255 }
                                    }}
                                >
                                    {accessorialData.map((data) => (
                                        <MenuItem key={data.accessorialId} value={data.accessorialId}>{data.accessorialName}</MenuItem>
                                    ))}
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="chargesType"
                            control={control}
                            rules={{
                                required: 'Charges Type is required',
                                maxLength: {
                                    value: 50,
                                    message: 'Charges Type cannot exceed 50 characters'
                                },
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Charges Type"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.chargesType} helperText={errors.chargesType?.message}
                                    SelectProps={{
                                        inputProps: { maxLength: 50 }
                                    }}
                                >
                                    <MenuItem value="HOURLY">Hourly</MenuItem>
                                    <MenuItem value="FLAT_RATE">Flat Rate</MenuItem>
                                    <MenuItem value="PER_POUND">Per Pound</MenuItem>
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="charges"
                            control={control}
                            rules={{
                                required: 'Charges is required',
                                min: {
                                    value: 0,
                                    message: 'Value cannot be below 0'
                                },
                                pattern: {
                                    // Regex for decimal(12,2): up to 10 digits before dot, optional dot, up to 2 after
                                    value: /^\d{1,10}(\.\d{0,2})?$/,
                                    message: 'Invalid format (max 10 digits before and 2 after decimal)'
                                },
                                validate: (value) => {
                                    if (value && value.toString().length > 13) return 'Total length exceeded';
                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    value={value || ''}
                                    label="Charges"
                                    // Use type="text" to gain better control over formatting and maxLength
                                    type="text"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    error={!!error}
                                    helperText={error?.message}
                                    // 13 characters allows for 10 digits + 1 dot + 2 decimal digits
                                    inputProps={{ maxLength: 13 }}
                                    onChange={(e) => {
                                        let val = e.target.value;

                                        // 1. Prevent initial empty space
                                        if (val.startsWith(' ')) return;

                                        // 2. Allow only numbers and a single decimal point
                                        val = val.replace(/[^0-9.]/g, '');

                                        // 3. Prevent multiple decimal points
                                        const parts = val.split('.');
                                        if (parts.length > 2) return;

                                        // 4. Enforce 2 decimal places restriction while typing
                                        if (parts[1] && parts[1].length > 2) return;

                                        // 5. Enforce 10 digit limit for the integer part (before decimal)
                                        if (parts[0] && parts[0].length > 10) return;

                                        onChange(val);
                                        if (setChargeValue) setChargeValue(val);
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="notes"
                            control={control}
                            rules={{
                                required: parseInt(chargeValue, 10) === 0 ? true : false,
                                maxLength: {
                                    value: 255,
                                    message: 'Notes cannot exceed 255 characters'
                                },
                                validate: (value) => !value || value.trim().length > 0 || 'Notes cannot be only spaces'
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    label={`Notes`}
                                    required={parseInt(chargeValue, 10) === 0 ? true : false}
                                    variant="standard" fullWidth
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
                                    error={!!error}
                                    inputProps={{ maxLength: 255 }}
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

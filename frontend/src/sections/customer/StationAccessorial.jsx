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
        handleCloseConfirm();
    };
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
                            rules={{ required: 'Accessorial is required' }}
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
                            rules={{ required: 'Charges Type is required' }}
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
                                    value: /^\d*\.?\d*$/,
                                    message: 'Invalid number format'
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    label="Charges"
                                    type='number' // Standard for numeric inputs
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '25%' }}
                                    inputProps={{ min: 0, step: "0.01" }} // Blocks negative steps in UI
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        // Prevent negative numbers from being processed
                                        if (value !== "" && Number(value) < 0) return;

                                        field.onChange(value);
                                        setChargeValue(value);
                                    }}
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label={`Notes`}
                                    required={parseInt(chargeValue, 10) === 0 ? true : false}
                                    variant="standard" fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
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

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

StationAccessorial.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedStationTabRowDetails: PropTypes.object,
};

export default function StationAccessorial({ type, handleCloseConfirm, selectedStationTabRowDetails }) {
    const dispatch = useDispatch();
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues
    } = useForm({
        defaultValues: {
            accessorial: '',
            chargesType: '',
            charges: '',
            notes: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        alert('Form submitted successfully! Check console for data.');
    };
    useEffect(() => {
        if (selectedStationTabRowDetails) {
            setValue('accessorial', selectedStationTabRowDetails.accessorialName || '');    
            setValue('chargesType', selectedStationTabRowDetails.chargeType || '');
            setValue('charges', selectedStationTabRowDetails.charges || '');
            setValue('notes', selectedStationTabRowDetails.notes || '');
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
                <Stack spacing={4} sx={{p:3}}>
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
                                >
                                    <MenuItem value="lift-gate">Lift Gate</MenuItem>
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
                                    <MenuItem value="hourly">Hourly</MenuItem>
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="charges"
                            control={control}
                            rules={{ required: 'Charges is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Charges"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '25%',
                                    }}
                                    error={!!errors.charges} helperText={errors.charges?.message}
                                />
                            )}
                        />
                        <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Notes"
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

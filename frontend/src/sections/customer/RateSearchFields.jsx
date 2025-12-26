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
import { setRateSearchObj } from '../../redux/slices/rate';

RateSearchFields.propTypes = {
    padding: PropTypes.number
};

export default function RateSearchFields({ padding}) {
    const dispatch = useDispatch();
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues
    } = useForm({
        defaultValues: {
            origin: '',
            originZipCode: '',
            destination: '',
            destinationZipCode: '',
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        dispatch(setRateSearchObj(data));
        alert('Form submitted successfully! Check console for data.');
    };
    const handleCLear = () => {
        console.log('Clear clicked');
        // reset form fields    
        dispatch(setRateSearchObj({}));
    };

    return (
        <>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: padding }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={5} alignItems={'flex-end'}>
                        <Controller
                            name="origin"
                            control={control}
                            rules={{ required: 'Origin is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Origin"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '20%',
                                    }}
                                    error={!!errors.origin} helperText={errors.origin?.message}
                                >
                                    <MenuItem value="MKE - Zone1">MKE - Zone1</MenuItem>
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="originZipCode"
                            control={control}
                            rules={{ required: 'Origin Zip Code is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Origin Zip Code"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '20%',
                                    }}
                                    error={!!errors.originZipCode} helperText={errors.originZipCode?.message}
                                />
                            )}
                        />
                        <Controller
                            name="destination"
                            control={control}
                            rules={{ required: 'Destination is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Destination"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '20%',
                                    }}
                                    error={!!errors.destination} helperText={errors.destination?.message}
                                >
                                    <MenuItem value="MKE - Zone1">MKE - Zone1</MenuItem>
                                </StyledTextField>
                            )}
                        />
                        <Controller
                            name="destinationZipCode"
                            control={control}
                            rules={{ required: 'Destination Zip Code is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Destination Zip Code"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '20%',
                                    }}
                                    error={!!errors.destinationZipCode} helperText={errors.destinationZipCode?.message}
                                />
                            )}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            // on click clear the values
                            onClick={() => handleCLear()}
                            sx={{
                                '&.MuiButton-outlined': {
                                    borderRadius: '4px',
                                    color: '#000',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#fff',
                                    fontWeight: 'normal',
                                    ml: 2,
                                    mr: 1,
                                    borderColor: '#000',
                                    height: 30,
                                },
                            }}
                        >
                            Clear
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
                                    height: 30,
                                },
                            }}
                        >
                            Search
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </>
    );
};

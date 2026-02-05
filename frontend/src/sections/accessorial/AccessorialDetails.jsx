import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Autocomplete,
    Chip,
    Stack,
    Typography,
    Divider,
    CircularProgress
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import { postAccessorialData, putAccessorialData } from '../../redux/slices/accessorial';

AccessorialDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedAccessorialRowDetails: PropTypes.object,
};

export default function AccessorialDetails({ type, handleCloseConfirm, selectedAccessorialRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.accessorialdata?.operationalMessage);
    const isLoading = useSelector((state) => state?.accessorialdata?.isLoading);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm({
        defaultValues: {
            accessorialName: ''
        }
    });

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        let obj = {
            "accessorialName": data.zone,
        }
        if (type === 'Add') {
            dispatch(postAccessorialData(obj));
        } else if (type === 'Edit') {
            dispatch(putAccessorialData(selectedAccessorialRowDetails.accessorialId, obj));
        }
    };
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (selectedAccessorialRowDetails) {
            setValue('accessorialName', selectedAccessorialRowDetails?.accessorialName || '');
        }
    }, [selectedAccessorialRowDetails]);

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
                <Stack spacing={4} sx={{ pt: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="accessorialName"
                            control={control}
                            rules={{ required: 'Accessorial Name is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    label="Accessorial Name"
                                    variant="standard" fullWidth required
                                    sx={{
                                        width: '30%',
                                    }}
                                    error={!!errors.accessorialName} helperText={errors.accessorialName?.message}
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

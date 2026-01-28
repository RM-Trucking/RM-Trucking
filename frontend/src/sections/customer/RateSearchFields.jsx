import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    MenuItem,
    Stack,
    CircularProgress,
    Divider
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import {
    setRateSearchObj, getRateDashboardData, postWarehouseRate,
    putWarehouseRate
} from '../../redux/slices/rate';
import RateFieldAndChargeTableWarehouse from '../rate/RateFieldAndChargeTableWarehouse';

RateSearchFields.propTypes = {
    padding: PropTypes.number,
    type: PropTypes.string,
    currentTab: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCurrentRateRow: PropTypes.object,
};

export default function RateSearchFields({ padding, type, currentTab, handleCloseConfirm, selectedCurrentRateRow }) {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state?.ratedata?.isLoading);
    const operationalMessage = useSelector((state) => state?.ratedata?.operationalMessage);
    const rateFieldChargeDataWarehouse = useSelector((state) => state?.ratedata?.rateFieldChargeDataWarehouse);
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
        setValue,
    } = useForm({
        defaultValues: {
            origin: '',
            originZipCode: '',
            destination: '',
            destinationZipCode: '',
            warehouse: '',
            department: '',
        }
    });

    useEffect(() => {
        if (type === 'Edit' && selectedCurrentRateRow && currentTab === 'warehouse') {
            setValue('warehouse', selectedCurrentRateRow.warehouse || '');
            setValue('department', selectedCurrentRateRow.department || '');
        }
    }, [selectedCurrentRateRow])
    useEffect(() => {
            if (operationalMessage && handleCloseConfirm) {
                handleCloseConfirm();
            }
        }, [operationalMessage]);

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        dispatch(setRateSearchObj(data));
        if (type === 'Search' && currentTab === 'warehouse') {
            dispatch(getRateDashboardData({ pageNo: 1, pageSize: 10, searchStr: data.warehouse }));
        }
        if (type === 'Add' && currentTab === 'warehouse') {
            const obj = {
                "minRate": parseFloat(rateFieldChargeDataWarehouse[0]?.charge),
                "ratePerPound": parseFloat(rateFieldChargeDataWarehouse[1]?.charge),
                "maxRate": parseFloat(rateFieldChargeDataWarehouse[2]?.charge),
                "department": data.department,
                "warehouse": data.warehouse
            };
            dispatch(postWarehouseRate(obj));
        }
        if (type === 'Edit' && currentTab === 'warehouse') {
            const obj = {
                "minRate": parseFloat(rateFieldChargeDataWarehouse[0]?.charge),
                "ratePerPound": parseFloat(rateFieldChargeDataWarehouse[1]?.charge),
                "maxRate": parseFloat(rateFieldChargeDataWarehouse[2]?.charge),
                "department": data.department,
                "warehouse": data.warehouse
            };
            dispatch(putWarehouseRate(selectedCurrentRateRow?.rateId, obj));
        }
    };
    const handleCLear = () => {
        console.log('Clear clicked');
        // reset form fields    
        setValue('origin', '');
        setValue('originZipCode', '');
        setValue('destination', '');
        setValue('destinationZipCode', '');
        setValue('warehouse', '');
        dispatch(setRateSearchObj({}));
    };

    return (
        <>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: padding }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={5} alignItems={'flex-end'} justifyContent={type === 'Search' ? 'flex-end' : '"flex-start"'}>
                        {currentTab === 'transportation' && <Controller
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
                        />}
                        {currentTab === 'transportation' && <Controller
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
                        />}
                        {currentTab === 'transportation' && <Controller
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
                        />}
                        {currentTab === 'transportation' && <Controller
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
                        />}
                        {
                            currentTab === 'warehouse' && (type === 'Add' || type === 'Edit') && <Controller
                                name="department"
                                control={control}
                                rules={{
                                    required: 'Department is required',
                                    maxLength: {
                                        value: 100,
                                        message: 'Department cannot exceed 100 characters'
                                    },
                                    // Ensures the value isn't just whitespace if manual input is ever enabled
                                    validate: (val) => val?.trim().length > 0 || 'Selection cannot be empty'
                                }}
                                render={({ field: { onChange, value, ...field } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        select
                                        label="Department"
                                        variant="standard"
                                        fullWidth
                                        required
                                        sx={{ width: '25%' }}
                                        error={!!errors.department}
                                        helperText={errors.department?.message}
                                        // 1. Prevent selecting/inputting strings starting with a space
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith(' ')) {
                                                return;
                                            }
                                            onChange(val.slice(0, 100)); // 2. Enforce 100 char limit
                                        }}
                                        // 3. Physical restriction for the underlying input
                                        SelectProps={{
                                            inputProps: { maxLength: 100 }
                                        }}
                                    >
                                        <MenuItem value="Air Export">Air Export</MenuItem>
                                        <MenuItem value="Ocean Export">Ocean Export</MenuItem>
                                        <MenuItem value="Air Import">Air Import</MenuItem>
                                        <MenuItem value="Ocean Import">Ocean Import</MenuItem>
                                        <MenuItem value="Domestic">Domestic</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                        }
                        {
                            currentTab === 'warehouse' && <Controller
                                name="warehouse"
                                control={control}
                                rules={{
                                    required: 'Warehouse is required',
                                    maxLength: {
                                        value: 100,
                                        message: 'Warehouse cannot exceed 100 characters'
                                    },
                                    validate: (value) => (value && value.trim().length > 0) || 'Warehouse cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => {
                                    const hasValue = field.value && field.value.trim().length > 0;
                                    const shouldShowError = !!error && hasValue;
                                    return (<StyledTextField
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
                                        label="Warehouse *"
                                        error={shouldShowError}
                                        helperText={shouldShowError ? error.message : ''}
                                    />)
                                }}
                            />
                        }
                        {type === 'Search' && <Button
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
                        </Button>}
                        {type === 'Search' && <Button
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
                        </Button>}
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                        {((type === 'Add' || type === 'Edit') && currentTab === 'warehouse') && <RateFieldAndChargeTableWarehouse />}
                    </Box>
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
                </Stack>
            </Box>
        </>
    );
};

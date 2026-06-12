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
    CircularProgress, TextField
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import {
    postFuelSurchargeData, putFuelSurchargeData, getCustomerList, getStationList,
    postCustomerFuelSurchargeData,
    putCustomerFuelSurchargeData
} from '../../redux/slices/fuel';

FuelSurchargeDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedFuelSurchargeRowDetails: PropTypes.object,
};

export default function FuelSurchargeDetails({ type, handleCloseConfirm, selectedFuelSurchargeRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.fueldata?.operationalMessage);
    const isLoading = useSelector((state) => state?.fueldata?.isLoading);
    const currentFuelSurchargeTab = useSelector((state) => state?.fueldata?.currentFuelSurchargeTab);
    const customerList = useSelector((state) => state?.fueldata?.customerList);
    const stationList = useSelector((state) => state?.fueldata?.stationList);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
    } = useForm({
        defaultValues: {
            customer: '',
            stationList: '',
            fuelsurchargePercentage: '',
            effectiveDate: null,
            effectiveTime: null,
        }
    });

    const onSubmit = (data) => {
        if (currentFuelSurchargeTab === 'active') {
            console.log('Form Submitted:', data);
            let obj = {
                "fuelPercentage": data.fuelsurchargePercentage,
                "effectiveDate": data.effectiveDate,
                "effectiveTime": data.effectiveTime,
                "expireDate": data.expireDate,
                "expireTime": data.expireTime
            };
            if (type === 'Add') {
                dispatch(postFuelSurchargeData(obj));
            } else if (type === 'Edit') {
                dispatch(putFuelSurchargeData(selectedFuelSurchargeRowDetails.fuelSurchargeId, obj));
            }
        } else if (currentFuelSurchargeTab === 'customer') {
            console.log('Form Submitted:', data);
            let obj = {
                "customerId": data.customer.customerId,
                "customerName": data.customer.customerName,
                "fuelPercentage": data.fuelsurchargePercentage,
                "effectiveDate": data.effectiveDate,
                "effectiveTime": data.effectiveTime,
                "expireDate": data.expireDate,
                "expireTime": data.expireTime,
                "stations": data.stationList
            }
            if (type === 'Add') {
                dispatch(postCustomerFuelSurchargeData(obj));
            } else if (type === 'Edit') {
                dispatch(putCustomerFuelSurchargeData(selectedFuelSurchargeRowDetails.customerFuelSurchargeId, obj));
            }
        }
    };
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (selectedFuelSurchargeRowDetails) {
            setValue('fuelsurchargePercentage', selectedFuelSurchargeRowDetails?.fuelPercentage || '');
            setValue('effectiveDate', selectedFuelSurchargeRowDetails?.effectiveDate || null);
            setValue('effectiveTime', selectedFuelSurchargeRowDetails?.effectiveTime || null);
            setValue('expireDate', selectedFuelSurchargeRowDetails?.expireDate || null);
            setValue('expireTime', selectedFuelSurchargeRowDetails?.expireTime || null);
            setValue('customer', customerList.find(customer => customer.customerId === selectedFuelSurchargeRowDetails?.customerId) || null);
            setValue('stationList', selectedFuelSurchargeRowDetails?.stations || null);
        }
    }, [selectedFuelSurchargeRowDetails]);

    return (

        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Fuel Surcharge Details</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ pt: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        {
                            currentFuelSurchargeTab === 'customer' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ width: '100%' }}>
                                <Controller
                                    name="customer"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { onChange, value, ref } }) => (
                                        <Autocomplete
                                            freeSolo
                                            options={customerList}
                                            value={value || null}

                                            onChange={(event, newValue) => {
                                                onChange(newValue);
                                                console.log('Selected Customer:', newValue);
                                                dispatch(getStationList(newValue?.customerId, ""));
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === 'input') {
                                                    dispatch(getCustomerList(newInputValue));
                                                    onChange(newInputValue);
                                                }
                                            }}

                                            // 1. Updated: Ensures the input field displays both names when a selection is active
                                            getOptionLabel={(option) => {
                                                if (typeof option === 'string') return option;
                                                if (option.inputValue) return option.inputValue;

                                                const name = option.customerName || '';
                                                return `${name}`;
                                            }}

                                            // 2. Added: Customizes how options look inside the popup dropdown list
                                            renderOption={(props, option) => {
                                                // Safe destructuring of key to prevent React list warnings
                                                const { key, ...optionProps } = props;

                                                return (
                                                    <Box component="li" key={key} {...optionProps}>
                                                        {option.customerName}
                                                    </Box>
                                                );
                                            }}

                                            isOptionEqualToValue={(option, val) =>
                                                option.customerId === val?.customerId || option.customerName === val?.customerName
                                            }

                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref}
                                                    fullWidth
                                                    label={`Customer List *`}
                                                    variant="standard"
                                                    error={!!errors['customer']}
                                                    helperText={errors['customer'] ? 'This field is required' : ''}
                                                />
                                            )}
                                            sx={{ width: '100%', mb: 2 }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="stationList"
                                    control={control}
                                    rules={{ required: true }}
                                    // Initialize standard value to an empty array for multi-select
                                    defaultValue={[]}
                                    render={({ field: { onChange, value, ref } }) => (
                                        <Autocomplete
                                            multiple // 1. Added: Enables multi-select behavior
                                            freeSolo
                                            options={stationList || []}
                                            // 2. Updated: Multi-select value must always resolve to an array
                                            value={Array.isArray(value) ? value : []}

                                            onChange={(event, newValue) => {
                                                onChange(newValue); // newValue is now an array of selected objects
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === 'input') {
                                                    dispatch(getStationList(getValues('customer')?.customerId, newInputValue));
                                                    // 3. Removed: Do NOT call onChange(newInputValue) here. 
                                                    // Typing in the box shouldn't overwrite your selected array state.
                                                }
                                            }}

                                            getOptionLabel={(option) => {
                                                if (typeof option === 'string') return option;
                                                if (option.inputValue) return option.inputValue;
                                                return option.stationName || '';
                                            }}

                                            renderOption={(props, option) => {
                                                const { key, ...optionProps } = props;
                                                return (
                                                    <Box component="li" key={key} {...optionProps}>
                                                        {option.stationName}
                                                    </Box>
                                                );
                                            }}

                                            isOptionEqualToValue={(option, val) =>
                                                option.stationId === val?.stationId || option.stationName === val?.stationName
                                            }

                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref}
                                                    fullWidth
                                                    label={`Station List *`}
                                                    variant="standard"
                                                    // 4. Updated: Multi-select validation error handling
                                                    error={!!errors.stationList}
                                                    helperText={errors.stationList ? 'This field is required' : ''}
                                                />
                                            )}
                                            sx={{ width: '100%', mb: 2 }}
                                        />
                                    )}
                                />

                            </Stack>
                        }
                        <Controller
                            name="fuelsurchargePercentage"
                            control={control}
                            rules={{
                                required: 'Fuel Surcharge Percentage is required',
                                validate: (value) => {
                                    if (value === undefined || value === null || value === '') return true;

                                    // Parse numerical value to block negative numbers or impossible percentages
                                    const num = parseFloat(value);
                                    if (isNaN(num)) return "Please enter a valid numeric percentage";
                                    if (num < 0) return "Percentage cannot be negative";
                                    if (num > 100) return "Percentage cannot exceed 100%"; // Remove if over 100% is allowed

                                    return true;
                                }
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    value={field.value || ''} // Prevents controlled vs uncontrolled warnings
                                    label="Fuel Surcharge Percentage"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '70%' }}
                                    error={!!errors.fuelsurchargePercentage}
                                    helperText={errors.fuelsurchargePercentage?.message || ""}

                                    // Instantly filters keystrokes as the user types
                                    onChange={(e) => {
                                        let val = e.target.value;

                                        // Strip everything that isn't a digit or a single decimal point
                                        val = val.replace(/[^0-9.]/g, '');

                                        // Prevent typing multiple decimal points (e.g., '12.5.5' becomes '12.55')
                                        const splitValue = val.split('.');
                                        if (splitValue.length > 2) {
                                            val = `${splitValue[0]}.${splitValue.slice(1).join('')}`;
                                        }

                                        field.onChange(val);
                                    }}

                                    // Hints mobile devices to pull up a decimal number-pad layout instantly
                                    inputProps={{ inputMode: 'decimal' }}
                                />
                            )}
                        />

                        <Controller
                            name="effectiveDate"
                            control={control}
                            rules={{ required: 'Effective date is required' }}
                            render={({ field: { value, onChange, ...field } }) => (
                                <DatePicker
                                    {...field}
                                    label="Effective Date"
                                    // 1. Convert string from form state into a Day.js object for the picker [cite: 1.3.19]
                                    value={value ? dayjs(value) : null}
                                    // 2. Format it back to a clean string when saving into form state [cite: 1.3.19]
                                    onChange={(newValue) => {
                                        onChange(newValue && dayjs(newValue).isValid() ? dayjs(newValue).format('YYYY-MM-DD') : null);
                                    }}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            variant: 'standard',
                                            fullWidth: true,
                                            error: !!errors.effectiveDate,
                                            helperText: errors.effectiveDate?.message || ''
                                        }
                                    }}
                                    sx={{ width: '50%' }}
                                />
                            )}
                        />

                        <Controller
                            name="effectiveTime"
                            control={control}
                            rules={{ required: 'Effective time is required' }}
                            render={({ field: { value, onChange, ...field } }) => (
                                <TimePicker
                                    {...field}
                                    label="Effective Time"
                                    ampm={false}
                                    // 3. Convert time string (e.g. "14:30") into a Day.js object for the picker [cite: 1.3.19]
                                    value={value ? dayjs(value, 'HH:mm') : null}
                                    // 4. Format it back to 24-hour time format string ("HH:mm") for your API payload [cite: 1.3.19]
                                    onChange={(newValue) => {
                                        onChange(newValue && dayjs(newValue).isValid() ? dayjs(newValue).format('HH:mm') : null);
                                    }}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            variant: 'standard',
                                            fullWidth: true,
                                            error: !!errors.effectiveTime,
                                            helperText: errors.effectiveTime?.message || ''
                                        }
                                    }}
                                    sx={{ width: '50%' }}
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
                        {!isLoading && <Button
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
                        }
                        {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                    </Box>
                </Stack>}
            </Box>
        </LocalizationProvider>

    );
};

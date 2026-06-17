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
    CircularProgress, TextField, Checkbox, Snackbar, Alert,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import {
    postFuelSurchargeData, putFuelSurchargeData, getCustomerList, getStationList, setStationList,
    postCustomerFuelSurchargeData,
    putCustomerFuelSurchargeData,
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
    const [errorVisible, setErrorVisible] = useState(false);
    const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
    const checkedIcon = <CheckBoxIcon fontSize="small" />;

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
            if (data.customer.customerId) {
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
            } else {
                setErrorVisible(true);
            }
        }
    };
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (customerList && selectedFuelSurchargeRowDetails && Object.keys(selectedFuelSurchargeRowDetails).length > 0) {
            setValue('customer', customerList.find(customer => customer.customerId === selectedFuelSurchargeRowDetails?.customerId) || null);
        }
    }, [customerList]);
    useEffect(() => {
        if (selectedFuelSurchargeRowDetails && Object.keys(selectedFuelSurchargeRowDetails).length > 0) {
            setValue('fuelsurchargePercentage', selectedFuelSurchargeRowDetails?.fuelPercentage || '');
            setValue('effectiveDate', selectedFuelSurchargeRowDetails?.effectiveDate || null);
            setValue('effectiveTime', selectedFuelSurchargeRowDetails?.effectiveTime || null);
            setValue('expireDate', selectedFuelSurchargeRowDetails?.expireDate || null);
            setValue('expireTime', selectedFuelSurchargeRowDetails?.expireTime || null);
            setValue('stationList', selectedFuelSurchargeRowDetails?.stations || null);
            if (type === 'Edit' && selectedFuelSurchargeRowDetails?.customerId) {
                dispatch(getStationList(selectedFuelSurchargeRowDetails?.customerId, ""));
            }
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
                                            forcePopupIcon={true} // 💡 CRUCIAL: This forces the dropdown arrow icon to show up with freeSolo
                                            options={customerList}
                                            value={value || null}
                                            disabled = {type === 'Edit'}

                                            onChange={(event, newValue) => {
                                                onChange(newValue);
                                                console.log('Selected Customer:', newValue);
                                                if (newValue?.customerId) {
                                                    dispatch(getStationList(newValue?.customerId, ""));
                                                    setValue('stationList', []);
                                                } else {
                                                    dispatch(getCustomerList(""));
                                                    dispatch(setStationList([]));
                                                }
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === 'input') {
                                                    dispatch(getCustomerList(newInputValue));
                                                    onChange(newInputValue);
                                                    if (newInputValue === "") {
                                                        dispatch(getCustomerList(""));
                                                        dispatch(setStationList([]));
                                                    }
                                                }
                                                if (reason === 'clear') {
                                                    dispatch(getCustomerList(""));
                                                    dispatch(setStationList([]));
                                                }
                                            }}

                                            getOptionLabel={(option) => {
                                                if (typeof option === 'string') return option;
                                                if (option.inputValue) return option.inputValue;

                                                const name = option.customerName || '';
                                                return `${name}`;
                                            }}

                                            renderOption={(props, option) => {
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
                                    defaultValue={[]}
                                    render={({ field: { onChange, value, ref } }) => {
                                        const selectedArray = Array.isArray(value) ? value : [];

                                        // Convert selected array objects into a clean comma-separated text string
                                        const displayValue = selectedArray
                                            .map((opt) => (typeof opt === 'string' ? opt : opt.stationName || ''))
                                            .filter(Boolean)
                                            .join(', ');

                                        return (
                                            <Autocomplete
                                                multiple
                                                freeSolo
                                                disableCloseOnSelect
                                                forcePopupIcon={true}
                                                options={stationList || []}
                                                value={selectedArray}

                                                onChange={(event, newValue) => {
                                                    onChange(newValue);
                                                }}

                                                onInputChange={(event, newInputValue, reason) => {
                                                    if (reason === 'input') {
                                                        dispatch(getStationList(getValues('customer')?.customerId, newInputValue));
                                                    }
                                                    if (reason === 'clear') {
                                                        dispatch(getStationList(getValues('customer')?.customerId, newInputValue));
                                                    }
                                                }}

                                                // 1. Added: Overrides the default layout to hide the standard MUI chips
                                                renderTags={() => null}

                                                getOptionLabel={(option) => {
                                                    if (typeof option === 'string') return option;
                                                    if (option.inputValue) return option.inputValue;
                                                    return option.stationName || '';
                                                }}

                                                renderOption={(props, option, { selected }) => {
                                                    const { key, ...optionProps } = props;
                                                    return (
                                                        <Box component="li" key={key} {...optionProps}>
                                                            <Checkbox
                                                                icon={icon}
                                                                checkedIcon={checkedIcon}
                                                                style={{ marginRight: 8 }}
                                                                checked={selected}
                                                            />
                                                            {option.stationName}
                                                        </Box>
                                                    );
                                                }}

                                                isOptionEqualToValue={(option, val) =>
                                                    option.stationId === val?.stationId || option.stationName === val?.stationName
                                                }

                                                renderInput={(params) => {
                                                    // 2. Extracted: Capture input props safely to override value presentation
                                                    const { inputProps, ...restParams } = params;

                                                    return (
                                                        <TextField
                                                            {...restParams}
                                                            inputRef={ref}
                                                            fullWidth
                                                            label={`Station List *`}
                                                            variant="standard"
                                                            error={!!errors.stationList}
                                                            helperText={errors.stationList ? 'This field is required' : ''}
                                                            // 3. Injected: Display comma-separated text string directly in the input box
                                                            inputProps={{
                                                                ...inputProps,
                                                                value: inputProps.value ? displayValue : displayValue,
                                                                readOnly: true // Optional: Makes input read-only to preserve the comma format smoothly
                                                            }}
                                                        />
                                                    );
                                                }}
                                                sx={{ width: '100%', mb: 2 }}
                                            />
                                        );
                                    }}
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

                                    const num = parseFloat(value);
                                    if (isNaN(num)) return "Please enter a valid numeric percentage";
                                    if (num < 0) return "Percentage cannot be negative";

                                    // 1. Updated: Adjusted maximum value bound allowed by 5,2 precision
                                    if (num > 999.99) return "Percentage cannot exceed 999.99%";

                                    // 2. Added: Explicit structural verification for 5,2 regex constraint
                                    const is52Format = /^\d{1,3}(\.\d{1,2})?$/.test(String(value));
                                    if (!is52Format) return "Max 5 total digits and 2 decimal places allowed (e.g., 123.45)";

                                    return true;
                                }
                            }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    value={field.value || ''}
                                    label="Fuel Surcharge Percentage"
                                    variant="standard"
                                    fullWidth
                                    required
                                    sx={{ width: '50%' }}
                                    error={!!errors.fuelsurchargePercentage}
                                    helperText={errors.fuelsurchargePercentage?.message || ""}

                                    onChange={(e) => {
                                        let val = e.target.value;

                                        // Strip everything that isn't a digit or a single decimal point
                                        val = val.replace(/[^0-9.]/g, '');

                                        // Prevent typing multiple decimal points
                                        const splitValue = val.split('.');
                                        if (splitValue.length > 2) {
                                            val = `${splitValue[0]}.${splitValue.slice(1).join('')}`;
                                        }

                                        // 3. Added: Proactive input restriction to physically block typing past 5,2 limits
                                        if (val.includes('.')) {
                                            const [integerPart, decimalPart] = val.split('.');
                                            // Truncate integer to 3 digits and decimal to 2 digits
                                            val = `${integerPart.slice(0, 3)}.${decimalPart.slice(0, 2)}`;
                                        } else {
                                            // Truncate integer to 3 digits if no decimal exists yet
                                            val = val.slice(0, 3);
                                        }

                                        field.onChange(val);
                                    }}
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
                                    // 1. Added: Limits the user interface to pick Hours and Minutes only
                                    views={['hours', 'minutes']}
                                    value={value ? dayjs(value, 'HH:mm') : null}
                                    onChange={(newValue) => {
                                        // 2. Updated: Hardcodes ':00' for seconds or formats as 'HH:mm:00'
                                        const isValid = newValue && dayjs(newValue).isValid();
                                        onChange(isValid ? dayjs(newValue).format('HH:mm:00') : null);
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
                <Snackbar open={errorVisible} autoHideDuration={3000} onClose={() => setErrorVisible(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <Alert severity="error" variant="filled">Please select valid customer.</Alert>
                </Snackbar>
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

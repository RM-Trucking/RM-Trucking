import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Typography,
    Stack,
    Divider,
    FormControlLabel,
    Dialog,
    DialogContent, CircularProgress, MenuItem,
    ListSubheader, Checkbox, ListItemText
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
// ----------------------------------------------------------------------


CarrierDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCarrierRowDetails: PropTypes?.object
};

export default function CarrierDetails({ type, handleCloseConfirm, selectedCarrierRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.carrierdata?.operationalMessage);
    const isLoading = useSelector((state) => state?.carrierdata?.isLoading);
    // Define default values for the form
    const defaultValues = {
        carrierName: '',
        carrierType: [],
        carrierStatus: '',
        corpAddressLine1: '',
        corpAddressLine2: '',
        corpCity: '',
        corpState: '',
        corpZipCode: '',
        sameAsCorporate: false,
        billAddressLine1: '',
        billAddressLine2: '',
        billCity: '',
        billState: '',
        billZipCode: '',
        tsa: false,
        ustDotNo: '',
        mcNo: '',
        insuranceExpiryDate: '',
        salesRepName: '',
        salesRepPhoneNumber: '',
        salesRepEmailId: '',
        carrierNotes: '',
    };
    const [readOnly, setReadOnly] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [alertDialog, setAlertDialog] = useState(false);
    const [warning, setWarning] = useState(false);

    const { control, handleSubmit, watch, getValues, setValue } = useForm({ defaultValues });

    // Watch the checkbox value to conditionally render billing address
    const sameAsCorporate = watch('sameAsCorporate');

    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);
        if (data.sameAsCorporate && (data.corpAddressLine1 !== data.billAddressLine1 || data.corpAddressLine2 !== data.billAddressLine2 ||
            data.corpCity !== data.billCity || data.corpState !== data.billState ||
            data.corpZipCode !== data.billZipCode)) {
            setOpenConfirmDialog(true);
            return;
        }

        if (type === 'Add') {
            console.log('data')
        }
        if (type === 'Edit') {
            console.log('data')
        }
    };
    useEffect(() => {
        // dispatch(setTableBeingViewed('terminal'));
    }, []);
    useEffect(() => {
        if (warning) setAlertDialog(true);
    }, [warning]);
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        console.log('Selected Customer Details:', selectedCarrierRowDetails);

    }, [selectedCarrierRowDetails]);
    useEffect(() => {
        if (type === 'View') {
            setReadOnly(true);
        } else {
            setReadOnly(false);
        }
    }, [type]);
    // dialog actions and functions
    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };
    const handleAlertDialog = () => {
        setAlertDialog(false);
        setWarning(false);
    }

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Carrier Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="carrierName"
                            control={control}
                            rules={{
                                required: 'Carrier Name is required',
                                maxLength: {
                                    value: 255,
                                    message: 'Carrier Name cannot exceed 255 characters'
                                },
                                validate: (value) => value.trim().length > 0 || 'Carrier Name cannot be only spaces'
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '30%',
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
                                    label="Carrier Name *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    disabled={(type === 'View') ? readOnly : false}
                                />
                            )}
                        />
                        <Controller
                            name="carrierType"
                            control={control}
                            rules={{ required: "Carrier type is required" }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => {

                                const groups = {
                                    ltl: ["LTL Carrier", "Truck Load Carriers", "Dedicated Carriers"],
                                    airport: ["Airport Carrier", "Airport Agent"]
                                };

                                const handleGroupChange = (event) => {
                                    const newValue = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
                                    const lastSelected = newValue[newValue.length - 1];

                                    if (!lastSelected) {
                                        setWarning(false);
                                        onChange([]);
                                        return;
                                    }

                                    const isLTL = groups.ltl.includes(lastSelected);
                                    const isAirport = groups.airport.includes(lastSelected);

                                    const previouslyHadLTL = value?.some(v => groups.ltl.includes(v));
                                    const previouslyHadAirport = value?.some(v => groups.airport.includes(v));

                                    if (isLTL) {
                                        if (previouslyHadAirport) setWarning(true);
                                        else setWarning(false);
                                        onChange(newValue.filter(val => groups.ltl.includes(val)));
                                    } else if (isAirport) {
                                        if (previouslyHadLTL) setWarning(true);
                                        else setWarning(false);
                                        onChange(newValue.filter(val => groups.airport.includes(val)));
                                    }
                                };

                                return (
                                    <StyledTextField
                                        select
                                        value={value || []}
                                        onChange={handleGroupChange}
                                        SelectProps={{
                                            multiple: true,
                                            renderValue: (selected) => selected.join(", "),
                                            MenuProps: { PaperProps: { sx: { maxHeight: 320 } } }
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: "30%" }}
                                        label="Carrier Type*"
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        FormHelperTextProps={{
                                            sx: { color: error ? "error.main" : "#ed6c02", fontWeight: 500 }
                                        }}
                                    >
                                        {/* --- LTL GROUP --- */}
                                        <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold' }}>
                                            LTL
                                        </ListSubheader>
                                        <Divider />
                                        {groups.ltl.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                <Checkbox checked={(value || []).indexOf(option) > -1} />
                                                <ListItemText primary={option} />
                                            </MenuItem>
                                        ))}

                                        {/* --- AIRPORT GROUP --- */}
                                        <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', mt: 1 }}>
                                            Airport
                                        </ListSubheader>
                                        <Divider />
                                        {groups.airport.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                <Checkbox checked={(value || []).indexOf(option) > -1} />
                                                <ListItemText primary={option} />
                                            </MenuItem>
                                        ))}
                                    </StyledTextField>
                                );
                            }}
                        />


                        <Controller
                            name="carrierStatus"
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    select // This turns the TextField into a Select
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '30%' }}
                                    label="Carrier Status*"
                                    error={!!error}
                                    helperText={error ? 'Carrier status is required' : ''}
                                >
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="active">Incomplete</MenuItem>
                                </StyledTextField>
                            )}
                        />
                    </Stack>

                    {/* Corporate Address Section */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Corporate Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="corpAddressLine1"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 1" disabled={(type === 'View') ? readOnly : false}
                                        // Intercept onChange to prevent leading spaces
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }} error={!!error} inputProps={{ maxLength: 255 }} />
                                )}
                            />
                            <Controller
                                name="corpAddressLine2"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 2 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 2 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 2" disabled={(type === 'View') ? readOnly : false}
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
                                        error={!!error} inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="corpCity"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth label="City" disabled={(type === 'View') ? readOnly : false}
                                        error={!!error} inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="corpState"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        fullWidth label="State" disabled={(type === 'View') ? readOnly : false}
                                        error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="corpZipCode"
                                control={control}
                                rules={{
                                    pattern: {
                                        value: /^\d{5}(-\d{4})?$/, // Validates ##### or #####-####
                                        message: 'Invalid Zip Code format'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, ''); // Remove non-digits
                                            let formatted = val;

                                            // Format as #####-####
                                            if (val.length > 5) {
                                                formatted = `${val.slice(0, 5)}-${val.slice(5, 9)}`;
                                            } else {
                                                formatted = val.slice(0, 5);
                                            }

                                            onChange(formatted);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        label="Zip Code"
                                        error={!!error}
                                        helperText={error?.message || ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                        inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* Checkbox for Billing Address */}
                    <Box sx={{ width: '50%' }}>
                        <Controller
                            name="sameAsCorporate"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <FormControlLabel
                                    sx={{ alignItems: 'flex-end' }}
                                    control={
                                        <StyledCheckbox
                                            checked={!!value}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;

                                                // 1. Update React Hook Form state
                                                onChange(isChecked);
                                                setReadOnly(isChecked);
                                                if (isChecked) {
                                                    setValue('billAddressLine1', getValues('corpAddressLine1') || '');
                                                    setValue('billAddressLine2', getValues('corpAddressLine2') || '');
                                                    setValue('billCity', getValues('corpCity') || '');
                                                    setValue('billState', getValues('corpState') || '');
                                                    setValue('billZipCode', getValues('corpZipCode') || '');
                                                } else {
                                                    setValue('billAddressLine1', '');
                                                    setValue('billAddressLine2', '');
                                                    setValue('billCity', '');
                                                    setValue('billState', '');
                                                    setValue('billZipCode', '');
                                                }
                                            }}
                                            disabled={(type === 'View') ? readOnly : false}
                                        />
                                    }
                                    label="Check if above Corporate Address is same for Billing Address"
                                />
                            )}
                        />
                    </Box>

                    {/* Billing Address Section - Conditionally rendered */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Billing Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
                            <Controller
                                name="billAddressLine1"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 1 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 1 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
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
                                        label="Address Line 1" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="billAddressLine2"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 255,
                                        message: 'Address Line 2 cannot exceed 255 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'Address Line 2 cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
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
                                        label="Address Line 2" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                            <Controller
                                name="billCity"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'City cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="City" disabled={readOnly} error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />
                            <Controller
                                name="billState"
                                control={control}
                                rules={{
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="State" disabled={readOnly}
                                        error={!!error}
                                        inputProps={{ maxLength: 100 }} />
                                )}
                            />

                            <Controller
                                name="billZipCode"
                                control={control}
                                rules={{
                                    pattern: {
                                        value: /^\d{5}(-\d{4})?$/, // Validates ##### or #####-####
                                        message: 'Invalid Zip Code format'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, ''); // Remove non-digits
                                            let formatted = val;

                                            // Format as #####-####
                                            if (val.length > 5) {
                                                formatted = `${val.slice(0, 5)}-${val.slice(5, 9)}`;
                                            } else {
                                                formatted = val.slice(0, 5);
                                            }

                                            onChange(formatted);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        label="Zip Code"
                                        error={!!error}
                                        helperText={error?.message || ''}
                                        disabled={readOnly}
                                        inputProps={{ maxLength: 10 }} // Account for 9 digits + 1 hyphen
                                    />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    <Stack flexDirection={{ xs: 'column', sm: 'row' }} alignItems={'center'}>
                        <fieldset>
                            <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Complaince &nbsp;</Typography></legend>
                            <Box sx={{ pt: 4, pb: 4, pr: 15 }}>
                                <Controller
                                    name="tsa"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <FormControlLabel
                                            sx={{ alignItems: 'flex-end' }}
                                            control={
                                                <StyledCheckbox
                                                    checked={!!value}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;

                                                        // 1. Update React Hook Form state
                                                        onChange(isChecked);
                                                        setReadOnly(isChecked);
                                                    }}
                                                    disabled={(type === 'View') ? readOnly : false}
                                                />
                                            }
                                            label="TSA"
                                        />
                                    )}
                                />
                            </Box>
                        </fieldset>
                        <fieldset style={{ width: '100%', height: '120px', marginLeft: '25px' }}>
                            <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Government Info &nbsp;</Typography></legend>
                            <Stack flexDirection={{ xs: 'column', sm: 'row' }} alignItems={'center'}>
                                <Controller
                                    name="ustDotNo"
                                    control={control}
                                    rules={{
                                        required: 'U.S. DOT Number is required',
                                        pattern: {
                                            value: /^\d{1,8}$/,
                                            message: 'Must be a numeric value up to 8 digits'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <StyledTextField
                                            {...field}
                                            variant="standard"
                                            fullWidth
                                            onChange={(e) => {
                                                // Prevent leading spaces and ensure only numbers are typed
                                                let val = e.target.value.trimStart();
                                                val = val.replace(/\D/g, ''); // Remove any non-numeric characters

                                                if (val.length <= 8) {
                                                    field.onChange(val);
                                                }
                                            }}
                                            label="U.S. DOT No. *"
                                            error={!!error}
                                            helperText={error ? error.message : "Example: 1234567"}
                                            disabled={type === 'View' ? readOnly : false}
                                        />
                                    )}
                                />
                                <Controller
                                    name="mcNo"
                                    control={control}
                                    rules={{
                                        // Removed 'required' rule
                                        pattern: {
                                            // Added ^$| to allow empty values, otherwise check the MC format
                                            value: /^$|^(MC|FF|MX)\d{5,7}$/i,
                                            message: 'Must start with MC, FF, or MX followed by 5-7 digits'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <StyledTextField
                                            {...field}
                                            variant="standard"
                                            fullWidth
                                            onChange={(e) => {
                                                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

                                                // Only auto-prefix if the user has actually started typing numbers
                                                if (val.length > 0 && /^\d/.test(val) && val.length <= 7) {
                                                    val = 'MC' + val;
                                                }

                                                field.onChange(val);
                                            }}
                                            // Removed asterisk from label since it is no longer required
                                            label="MC No"
                                            error={!!error}
                                            helperText={error ? error.message : "Example: MC123456 (Optional)"}
                                            disabled={type === 'View' ? readOnly : false}
                                            sx={{ ml: 2 }}
                                        />
                                    )}
                                />

                                <Controller
                                    name="insuranceExpiryDate"
                                    control={control}
                                    rules={{
                                        required: 'Insurance Expiry Date is required',
                                        validate: (value) => {
                                            const selectedDate = new Date(value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return selectedDate >= today || 'Date cannot be in the past';
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <StyledTextField
                                            {...field}
                                            type="date"
                                            variant="standard"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            // --- DISABLES PREVIOUS DATES IN PICKER ---
                                            inputProps={{
                                                min: new Date().toISOString().split('T')[0]
                                            }}
                                            label="Insurance Expiry Date*"
                                            error={!!error}
                                            helperText={error ? error.message : 'Select a current or future date'}
                                            disabled={(type === 'View') ? readOnly : false}
                                            sx={{ ml: 2 }}
                                        />
                                    )}
                                />
                            </Stack>
                        </fieldset>
                    </Stack>

                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Sales Rep Info &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pb: 2 }}>
                            <Controller
                                name="salesRepName"
                                control={control}
                                rules={{
                                    // Removed 'required' and 'validate' (no longer mandatory)
                                    maxLength: {
                                        value: 255,
                                        message: 'Sales rep name cannot exceed 255 characters'
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        variant="standard"
                                        fullWidth
                                        sx={{
                                            width: '30%',
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        // Removed "*" from the label
                                        label="Sales Rep Name"
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                            <Controller
                                name="salesRepPhoneNumber"
                                control={control}
                                rules={{
                                    // Removed 'required' rule
                                    maxLength: {
                                        value: 20,
                                        message: 'Sales Rep Phone number cannot exceed 20 characters'
                                    },
                                    pattern: {
                                        // Added ^$| to allow the field to be empty without triggering an error
                                        value: /^$|^\(\d{3}\) \d{3}-\d{4}.*$/,
                                        message: 'Invalid phone format'
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith(' ')) return;

                                            const formattedValue = formatPhoneNumber(val).slice(0, 20);
                                            onChange(formattedValue);
                                        }}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '30%' }}
                                        // Removed "*" from the label
                                        label="Sales rep Phone Number"
                                        inputProps={{ maxLength: 20 }}
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                            <Controller
                                name="salesRepEmailId"
                                control={control}
                                rules={{
                                    // Removed 'required' rule
                                    pattern: {
                                        // Added ^$| to allow the field to be empty
                                        value: /^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                        message: 'Please enter a valid email address'
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '30%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        // Removed asterisk from label
                                        label="Sales Rep Email ID"
                                        error={!!error}
                                        helperText={error ? error.message : ''}
                                        disabled={(type === 'View') ? readOnly : false}
                                    />
                                )}
                            />

                        </Stack>
                    </fieldset>

                    {/* Carrier notes */}
                    {type === 'Add' && <Controller
                        name="carrierNotes"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: {
                                value: 2000,
                                message: 'Carrier Notes cannot exceed 2000 characters'
                            },
                            validate: (value) => value.trim().length > 0 || 'Carrier Notes cannot be only spaces'
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Carrier Notes *" error={!!error}
                                helperText={error ? 'Carrier notes is required' : ''}
                                // Intercept onChange to prevent leading spaces
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // prevent only leading spaces while typing
                                    if (value.startsWith(' ')) {
                                        field.onChange(value.trimStart());
                                    } else {
                                        field.onChange(value);
                                    }
                                }} />
                        )}
                    />}

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
                                mb: 1,
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
                                    mb: 1
                                },
                            }}
                        >
                            {type === 'Add' ? 'Add' : 'Edit'}
                        </Button>
                        {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                    </Box>
                </Stack>}

            </Box>
            {/* station table */}
            {/* {
                type === 'View' && <CustomerViewStationTable />
            } */}
            <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleCloseConfirmDialog();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '500px',
                        height: '150px',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <>
                        <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Alert!</Typography>
                            <Iconify icon="carbon:close" onClick={() => handleCloseConfirmDialog()} sx={{ cursor: 'pointer' }} />
                        </Stack>
                        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                    </>
                    <Box sx={{ pt: 2 }}>
                        Billing Address must match Corporate Address when "same as Corporate" is checked.
                    </Box>
                </DialogContent>
            </Dialog>
            <Dialog open={alertDialog} onClose={handleAlertDialog} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleAlertDialog();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '500px',
                        height: '280px',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <>
                        <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Alert!</Typography>
                            <Iconify icon="carbon:close" onClick={() => handleAlertDialog()} sx={{ cursor: 'pointer' }} />
                        </Stack>
                        <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                    </>
                    <Stack flexDirection="column" alignItems={'center'}>
                        <Iconify icon="mingcute:alert-fill" sx={{ width: '78px', height: '78px' }} />
                        <Typography sx={{p:2, textAlign: 'center' }}>
                            Please select either LTL or Airport Service. Both cannot be selected at the same time.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleAlertDialog}
                            size="small"
                            sx={{
                                '&.MuiButton-contained': {
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#A22',
                                    fontWeight: 'normal',
                                    mt: 1,
                                },
                            }}
                        >
                            OK
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}

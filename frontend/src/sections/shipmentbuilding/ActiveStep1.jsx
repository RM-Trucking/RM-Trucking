import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import { useForm, Controller, useFieldArray, useWatch, set, get } from 'react-hook-form';

import {
    Box, Stepper, Step, StepLabel, Typography, TextField, MenuItem,
    Button, Paper, Alert, Snackbar, Checkbox, FormControlLabel, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, StepConnector, stepConnectorClasses, styled, Stack, Divider, Accordion,
    AccordionSummary, AccordionDetails, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, ListItemText, CircularProgress, InputAdornment, Autocomplete, createFilterOptions,
    ToggleButton, ToggleButtonGroup,

} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
import NotesTable from '../customer/NotesTable';
import ErrorFallback from '../shared/ErrorBoundary';
import NotesTableForAccessorials from './NotesTableForAccessorials';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import { PATH_DASHBOARD } from '../../routes/paths';
import {
    postStep1, getCustomerStationDropdown, getCarrierTerminalDropdown, searchCustomerStationDropdown,
    getShipperDropdown, getConsigneeDropdown, getShipperAirlineDropdown,
    getConsigneeAirlineDropdown, setPickupAccessorials,
    setLinehaulAccessorials,
    setDeliveryAccessorials,
    getPickupAccessorials,
    getLinehaulAccessorials,
    getDeliveryAccessorials,
    setAccessorialDropdown,
    getAccessorialDropdown,
    getStationAccessorialData,
    getZipToZipCarrierPickupRate,
    getZipToZipCarrierLinehaulRate,
    getZipToZipCarrierDeliveryRate, setError, setOperationalMessage,

} from '../../redux/slices/shipment';

const ActiveStep1 = ({ control,
    errors,
    customerStationDropdown,
    renderTextField,
    renderZipCodeField,
    renderPhoneField,
    watchedAirportPickupService,
    watchedAirportDeliveryService,
    shipperDropdown,
    watchedOriginAirport,
    shipperAirlineDropdown,
    consigneeDropdown,
    consigneeAirlineDropdown,
    watchedDestinationAirport,
    dispatch,
    navigate,
    location,
    setValue,
    clearErrors,
}) => {
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const filter = createFilterOptions();
    useEffect(() => {
        if (!watchedAirportPickupService) {
            clearErrors("originAirport");
            setValue('shipperName',"");
        }
    }, [watchedAirportPickupService, clearErrors]);
    useEffect(() => {
        if (!watchedAirportDeliveryService) {
            clearErrors("destinationAirport");
            setValue('consigneeName','');
        }
    }, [watchedAirportDeliveryService, clearErrors]);
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={() => {
                // Optional: reset app state here if necessary before retry
                console.log("Error boundary reset triggered");
            }}
        >
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: ' 1px solid rgba(143, 143, 143, 1)', pb: 1, mb: 3 }}>Customer Details</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, }}>
                    <Controller
                        name="billingCustomer"
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { onChange, value, ref } }) => (
                            <Autocomplete
                                freeSolo
                                options={customerStationDropdown}
                                value={value || null}

                                onChange={(event, newValue) => {
                                    dispatch(getStationAccessorialData(newValue?.stationEntityId));
                                    onChange(newValue);
                                    if (!newValue) {
                                        dispatch(searchCustomerStationDropdown(''));
                                    }
                                }}

                                onInputChange={(event, newInputValue, reason) => {
                                    if (reason === 'input') {
                                        dispatch(searchCustomerStationDropdown(newInputValue));
                                        onChange(newInputValue);
                                    }
                                }}

                                // 1. Updated: Ensures the input field displays both names when a selection is active
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    if (option.inputValue) return option.inputValue;

                                    const name = option.customerName || '';
                                    const station = option.stationName ? ` | ${option.stationName}` : '';
                                    return `${name}${station}`;
                                }}

                                // 2. Added: Customizes how options look inside the popup dropdown list
                                renderOption={(props, option) => {
                                    // Safe destructuring of key to prevent React list warnings
                                    const { key, ...optionProps } = props;

                                    return (
                                        <Box component="li" key={`${option.customerEntityId}-${option.stationEntityId} `} {...optionProps}>
                                            {option.customerName} {option.stationName ? ` | ${option.stationName}` : ''}
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
                                        label={`Billing Customer *`}
                                        variant="standard"
                                        error={!!errors['billingCustomer']}
                                        helperText={errors['billingCustomer'] ? 'Billing Customer is required' : ''}
                                    />
                                )}
                                sx={{ width: '30%', mb: 2 }}
                            />
                        )}
                    />


                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Controller
                                    name="carrierInfo.airportPickupService"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            {...field}
                                            checked={field.value}
                                            size="small"
                                            sx={{ color: '#A22', '&.Mui-checked': { color: '#A22' } }}
                                        />
                                    )}
                                />
                            }
                            label={<Typography variant="body2">Airport Pickup Service</Typography>}
                        />
                    </Box>

                    {renderTextField('originAirport', 'Origin Airport Code', watchedAirportPickupService)}

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Controller
                                    name="carrierInfo.airportDeliveryService"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            {...field}
                                            checked={field.value}
                                            size="small"
                                            sx={{ color: '#A22', '&.Mui-checked': { color: '#A22' } }}
                                        />
                                    )}
                                />
                            }
                            label={<Typography variant="body2">Airport Delivery Service</Typography>}
                        />
                    </Box>

                    {renderTextField('destinationAirport', 'Destination Airport Code', watchedAirportDeliveryService)}

                </Box>


                {/* Shipper Section */}

                <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 4, position: 'relative' }}>

                    <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Shipper {watchedAirportPickupService ? "Airline" : ''} Details</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>

                        {!watchedAirportPickupService && (
                            <Controller
                                name="shipperName"
                                control={control}
                                rules={{
                                    required: 'Shipper is required',
                                    validate: (value) => {
                                        const isRequired = true;
                                        const currentText = value?.shipperName || "";
                                        const hasText = !!currentText.trim();

                                        // 1. Mandatory structural baseline check
                                        if (isRequired && !hasText) {
                                            return "Shipper Name is required";
                                        }

                                        // 2. FIXED: Validation rule checking for strings exceeding 100 characters
                                        if (currentText.length > 100) {
                                            return "Shipper Name cannot exceed 100 characters";
                                        }
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ref } }) => (
                                    <Autocomplete
                                        freeSolo
                                        options={shipperDropdown}
                                        value={value || null}

                                        renderOption={(props, option, state) => {
                                            const uniqueKey = option.shipperId
                                                ? `shipper-${option.shipperId}`
                                                : `custom-${option.shipperName}-${state.index}`;

                                            return (
                                                <li {...props} key={uniqueKey}>
                                                    {option.inputValue ? `Add "${option.inputValue}"` : option.shipperName}
                                                </li>
                                            );
                                        }}

                                        onChange={(event, newValue) => {
                                            if (typeof newValue === 'string') {
                                                // Slice incoming values to strictly match 100 chars
                                                onChange({ shipperId: null, shipperName: newValue.slice(0, 100) });
                                            } else if (newValue && newValue.inputValue) {
                                                onChange({ shipperId: null, shipperName: newValue.inputValue.slice(0, 100) });
                                            } else if (newValue) {
                                                onChange(newValue);
                                                if (Object.keys(newValue).length > 0) {
                                                    setValue('shipperAddr1', newValue?.addressLine1 || '');
                                                    setValue('shipperAddr2', newValue?.addressLine2 || '');
                                                    setValue('shipperCity', newValue?.city || '');
                                                    setValue('shipperState', newValue?.state || '');
                                                    setValue('shipperZip', newValue?.zipCode || '');
                                                    setValue('shipperContact', newValue?.contactPersonName || '');
                                                    setValue('shipperPhone', newValue?.phoneNumber || '');
                                                }
                                            } else {
                                                onChange(null);
                                                setValue('shipperAddr1', '');
                                                setValue('shipperAddr2', '');
                                                setValue('shipperCity', '');
                                                setValue('shipperState', '');
                                                setValue('shipperZip', '');
                                                setValue('shipperContact', '');
                                                setValue('shipperPhone', '');
                                            }
                                        }}

                                        onInputChange={(event, newInputValue, reason) => {
                                            if (reason === 'input') {
                                                // Slice layout text inputs to block long text loops
                                                onChange({ shipperId: null, shipperName: newInputValue.slice(0, 100) });
                                                setValue('shipperAddr1', '');
                                                setValue('shipperAddr2', '');
                                                setValue('shipperCity', '');
                                                setValue('shipperState', '');
                                                setValue('shipperZip', '');
                                                setValue('shipperContact', '');
                                                setValue('shipperPhone', '');
                                            }
                                        }}

                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);
                                            const { inputValue } = params;

                                            const isExisting = options.some(
                                                (option) => inputValue.toLowerCase() === option.shipperName.toLowerCase()
                                            );

                                            if (inputValue !== '' && !isExisting) {
                                                filtered.unshift({
                                                    inputValue: inputValue.slice(0, 100),
                                                    shipperName: `${inputValue.slice(0, 100)}`,
                                                });
                                            }

                                            return filtered;
                                        }}

                                        getOptionLabel={(option) => {
                                            if (typeof option === 'string') {
                                                return option;
                                            }
                                            if (option.inputValue) {
                                                return option.inputValue;
                                            }
                                            return option.shipperName || '';
                                        }}

                                        isOptionEqualToValue={(option, val) =>
                                            option.shipperId === val?.shipperId || option.shipperName === val?.shipperName
                                        }

                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                inputRef={ref}
                                                fullWidth
                                                required
                                                label={`Shipper Name`}
                                                variant="standard"
                                                error={!!errors['shipperName']}
                                                helperText={errors['shipperName'] ? errors['shipperName'].message : ''}

                                                // 3. FIXED: UI barrier stopping user from typing past character 100
                                                inputProps={{
                                                    ...params.inputProps,
                                                    maxLength: 100
                                                }}
                                            />
                                        )}
                                        sx={{ width: '25%' }}
                                    />
                                )}
                            />
                        )}

                        {watchedAirportPickupService && (
                            <Controller
                                name="shipperName"
                                control={control}
                                rules={{
                                    required: watchedAirportPickupService ? 'Shipper is required' : false,
                                    validate: (value) => {
                                        if (!value) return true;

                                        if (typeof value === 'object' && value.airlineId) {
                                            return true;
                                        }

                                        const textToValidate = typeof value === 'object' ? (value.airlineName || '') : (value || '');
                                        const parts = textToValidate.split('-').map(p => p.trim());
                                        const numPart = parts[0] || '';
                                        const codePart = parts[1] || '';
                                        const namePart = parts[2] || '';

                                        // FIXED 1: Schema-level check ensuring the name segment alone doesn't pass 100 characters
                                        if (namePart.length > 100) {
                                            return 'Airline Name cannot exceed 100 characters';
                                        }

                                        const isPreExisting = shipperAirlineDropdown.some((opt) => {
                                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                                        });
                                        if (isPreExisting) return true;

                                        if (!/^\d{3}$/.test(numPart)) {
                                            return 'Airline Number must be exactly 3 digits (Ex: 001)';
                                        }

                                        if (!/^[A-Za-z]{2,3}$/.test(codePart)) {
                                            return 'Airline Code must be 2 or 3 letters (Ex: AA or AAA)';
                                        }

                                        if (!namePart) {
                                            return 'Please provide the Airline Name at the end';
                                        }

                                        const formatRegex = /^\d{3} - [A-Z]{2,3} - .+$/i;
                                        if (!formatRegex.test(textToValidate.trim())) {
                                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                                        }

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ref } }) => {
                                    // Helper function to safely crop only the name portion to 100 characters max
                                    const enforceNameLimit = (text) => {
                                        if (!text) return '';
                                        const sections = text.split(' - ');
                                        if (sections.length >= 3) {
                                            // Recombine everything after the second hyphen and cap it at 100 characters
                                            const prefix = `${sections[0]} - ${sections[1]} - `;
                                            const namePart = sections.slice(2).join(' - ');
                                            return prefix + namePart.slice(0, 100);
                                        }
                                        return text;
                                    };

                                    return (
                                        <Autocomplete
                                            freeSolo
                                            options={
                                                watchedOriginAirport
                                                    ? shipperAirlineDropdown.filter((item) => item.airportCode === watchedOriginAirport)
                                                    : shipperAirlineDropdown
                                            }
                                            value={value || null}
                                            onChange={(event, newValue) => {
                                                if (typeof newValue === 'string') {
                                                    // FIXED 2: Cap name segment on entry
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(newValue) });
                                                } else if (newValue && newValue.inputValue) {
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(newValue.inputValue) });
                                                } else if (newValue) {
                                                    onChange(newValue);
                                                } else {
                                                    onChange(null);
                                                }

                                                const isSelection = newValue && !newValue.inputValue && typeof newValue !== 'string';
                                                setValue('shipperAddr1', isSelection ? newValue?.addressLine1 || '' : '');
                                                setValue('shipperAddr2', isSelection ? newValue?.addressLine2 || '' : '');
                                                setValue('shipperCity', isSelection ? newValue?.city || '' : '');
                                                setValue('shipperState', isSelection ? newValue?.state || '' : '');
                                                setValue('shipperZip', isSelection ? newValue?.zipCode || '' : '');
                                                setValue('shipperContact', isSelection ? newValue?.contactPersonName || '' : '');
                                                setValue('shipperPhone', isSelection ? newValue?.phoneNumber || '' : '');
                                            }}
                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === 'input') {
                                                    const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                                                    let formatted = newInputValue;

                                                    if (!isDeleting) {
                                                        let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                                        if (/^\d{3}$/.test(clean)) {
                                                            formatted = `${clean} - `;
                                                        }

                                                        const match = clean.match(/^(\d{3})\s*-\s*([A-Za-z]{2,3})$/);
                                                        if (match) {
                                                            formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                                        }
                                                    }

                                                    // FIXED 3: Enforce strict 100-character cap on name segment while actively typing
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(formatted) });
                                                }
                                            }}
                                            getOptionLabel={(option) => {
                                                if (typeof option === 'string') return option;
                                                if (option.inputValue) return option.inputValue;
                                                if (option.airlineId) {
                                                    return `${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`;
                                                }
                                                return option.airlineName || '';
                                            }}
                                            isOptionEqualToValue={(option, val) =>
                                                option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                                            }
                                            renderOption={(props, option, state) => {
                                                const { key, ...optionProps } = props;
                                                const uniqueKey = option.airlineId
                                                    ? `airline-${option.airlineId}-${state.index}`
                                                    : `custom-airline-${state.index}`;

                                                if (option.inputValue) {
                                                    return (
                                                        <Box component="li" key={uniqueKey} {...optionProps} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                            Add : "{option.inputValue}"
                                                        </Box>
                                                    );
                                                }

                                                return (
                                                    <Box component="li" key={uniqueKey} {...optionProps}>
                                                        {`${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`}
                                                    </Box>
                                                );
                                            }}
                                            filterOptions={(options, params) => {
                                                const { inputValue } = params;
                                                const searchStr = (inputValue || '').toLowerCase().trim();

                                                const filtered = options.filter((option) => {
                                                    return (
                                                        String(option.airlineNumber || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airlineCode || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airlineName || '').toLowerCase().includes(searchStr) ||
                                                        String(option.city || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airportCode || '').toLowerCase().includes(searchStr)
                                                    );
                                                });

                                                const isExisting = options.some(
                                                    (option) => searchStr === String(option.airlineName || '').toLowerCase().trim()
                                                );

                                                if (inputValue !== '' && !isExisting) {
                                                    filtered.unshift({
                                                        // FIXED 4: Cap custom filtering suggestion text lengths
                                                        inputValue: enforceNameLimit(inputValue),
                                                        airlineName: enforceNameLimit(inputValue)
                                                    });
                                                }

                                                return filtered;
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref}
                                                    fullWidth
                                                    label={`Airline Name ${watchedAirportPickupService ? ' *' : ''}`}
                                                    variant="standard"
                                                    error={!!errors['shipperName']}
                                                    helperText={errors['shipperName']?.message || 'Format: Airline Number - Airline Code - Airline Name'}

                                                    // FIXED 5: Set hard layout barrier to 111 (Handles 11 prefix characters + 100 character custom name)
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        maxLength: 111
                                                    }}
                                                />
                                            )}
                                            sx={{ width: '25%' }}
                                        />
                                    );
                                }}
                            />

                        )}


                        {renderTextField('shipperAddr1', 'Address Line 1')}

                        {renderTextField('shipperAddr2', 'Address Line 2')}

                        {renderTextField('shipperCity', 'City')}

                        {renderTextField('shipperState', 'State')}

                        {renderZipCodeField('shipperZip')}

                        {renderTextField('shipperContact', 'Contact Person Name')}

                        {renderPhoneField('shipperPhone', 'Phone Number')}

                    </Box>

                </Box>



                {/* Consignee Section */}

                <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, position: 'relative' }}>

                    <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Consignee {watchedAirportDeliveryService ? "Airline" : ""} Details</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>


                        {!watchedAirportDeliveryService && (
                            <Controller
                                name="consigneeName"
                                control={control}
                                rules={{
                                    required: 'Consignee is required',
                                    validate: (value) => {
                                        const isRequired = true;
                                        const currentText = value?.consigneeName || "";
                                        const hasText = !!currentText.trim();

                                        // 1. Mandatory requirement check
                                        if (isRequired && !hasText) {
                                            return "Consignee Name is required";
                                        }

                                        // 2. FIXED: Validation rule checking for strings exceeding 100 characters
                                        if (currentText.length > 100) {
                                            return "Consignee Name cannot exceed 100 characters";
                                        }
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ref } }) => (
                                    <Autocomplete
                                        freeSolo
                                        options={consigneeDropdown}
                                        value={value || null}

                                        renderOption={(props, option, state) => {
                                            const uniqueKey = option.consigneeId
                                                ? `consignee-${option.consigneeId}`
                                                : `custom-${option.consigneeName}-${state.index}`;

                                            return (
                                                <li {...props} key={uniqueKey}>
                                                    {option.inputValue ? `Add "${option.inputValue}"` : option.consigneeName}
                                                </li>
                                            );
                                        }}

                                        onChange={(event, newValue) => {
                                            if (typeof newValue === 'string') {
                                                // Truncate manual entries to 100 characters max
                                                onChange({ consigneeId: null, consigneeName: newValue.slice(0, 100) });
                                            } else if (newValue && newValue.inputValue) {
                                                onChange({ consigneeId: null, consigneeName: newValue.inputValue.slice(0, 100) });
                                            } else if (newValue) {
                                                onChange(newValue);
                                                if (Object.keys(newValue).length > 0) {
                                                    setValue('consigneeAddr1', newValue?.addressLine1 || '');
                                                    setValue('consigneeAddr2', newValue?.addressLine2 || '');
                                                    setValue('consigneeCity', newValue?.city || '');
                                                    setValue('consigneeState', newValue?.state || '');
                                                    setValue('consigneeZip', newValue?.zipCode || '');
                                                    setValue('consigneeContact', newValue?.contactPersonName || '');
                                                    setValue('consigneePhone', newValue?.phoneNumber || '');
                                                }
                                            } else {
                                                onChange(null);
                                                setValue('consigneeAddr1', '');
                                                setValue('consigneeAddr2', '');
                                                setValue('consigneeCity', '');
                                                setValue('consigneeState', '');
                                                setValue('consigneeZip', '');
                                                setValue('consigneeContact', '');
                                                setValue('consigneePhone', '');
                                            }
                                        }}

                                        onInputChange={(event, newInputValue, reason) => {
                                            if (reason === 'input') {
                                                // Truncate characters to enforce the 100 limit during manual typing/copy-paste
                                                onChange({ consigneeId: null, consigneeName: newInputValue.slice(0, 100) });
                                                setValue('consigneeAddr1', '');
                                                setValue('consigneeAddr2', '');
                                                setValue('consigneeCity', '');
                                                setValue('consigneeState', '');
                                                setValue('consigneeZip', '');
                                                setValue('consigneeContact', '');
                                                setValue('consigneePhone', '');
                                            }
                                        }}

                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);
                                            const { inputValue } = params;

                                            const isExisting = options.some(
                                                (option) => inputValue.toLowerCase() === option.consigneeName.toLowerCase()
                                            );

                                            if (inputValue !== '' && !isExisting) {
                                                filtered.unshift({
                                                    inputValue: inputValue.slice(0, 100),
                                                    consigneeName: `${inputValue.slice(0, 100)}`,
                                                });
                                            }

                                            return filtered;
                                        }}

                                        getOptionLabel={(option) => {
                                            if (typeof option === 'string') {
                                                return option;
                                            }
                                            if (option.inputValue) {
                                                return option.inputValue;
                                            }
                                            return option.consigneeName || '';
                                        }}

                                        isOptionEqualToValue={(option, val) =>
                                            option.consigneeId === val?.consigneeId || option.consigneeName === val?.consigneeName
                                        }

                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                inputRef={ref}
                                                fullWidth
                                                label={`Consignee Name`}
                                                variant="standard"
                                                required
                                                error={!!errors['consigneeName']}
                                                helperText={errors['consigneeName'] ? errors['consigneeName'].message : ''}

                                                // 3. FIXED: Hard boundary blocking native keyboard strokes past 100 characters
                                                inputProps={{
                                                    ...params.inputProps,
                                                    maxLength: 100
                                                }}
                                            />
                                        )}
                                        sx={{ width: '25%' }}
                                    />
                                )}
                            />
                        )}

                        {watchedAirportDeliveryService && (
                            <Controller
                                name="consigneeName"
                                control={control}
                                rules={{
                                    required: watchedAirportDeliveryService ? 'Consignee is required' : false,
                                    validate: (value) => {
                                        if (!value) return true;

                                        const textToValidate = typeof value === 'object' ? (value.airlineName || '') : (value || '');
                                        const parts = textToValidate.split('-').map(p => p.trim());
                                        const numPart = parts[0] || '';
                                        const codePart = parts[1] || '';
                                        const namePart = parts[2] || '';

                                        // FIXED 1: Schema-level check ensuring the name segment alone doesn't pass 100 characters
                                        if (namePart.length > 100) {
                                            return 'Airline Name cannot exceed 100 characters';
                                        }

                                        if (typeof value === 'object' && value.airlineId) {
                                            return true;
                                        }

                                        const isPreExisting = consigneeAirlineDropdown.some((opt) => {
                                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                                        });
                                        if (isPreExisting) return true;

                                        if (!/^\d{3}$/.test(numPart)) {
                                            return 'Airline Number must be exactly 3 digits (Ex: 176)';
                                        }

                                        if (!/^[A-Za-z]{2,3}$/.test(codePart)) {
                                            return 'Airline Code must be 2 or 3 letters (Ex: EK or AAA)';
                                        }

                                        if (!namePart) {
                                            return 'Please provide the Airline Name at the end';
                                        }

                                        const formatRegex = /^\d{3} - [A-Z]{2,3} - .+$/i;
                                        if (!formatRegex.test(textToValidate.trim())) {
                                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                                        }

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ref } }) => {
                                    // Helper function to safely crop only the name portion to 100 characters max
                                    const enforceNameLimit = (text) => {
                                        if (!text) return '';
                                        const sections = text.split(' - ');
                                        if (sections.length >= 3) {
                                            const prefix = `${sections[0]} - ${sections[1]} - `;
                                            const namePart = sections.slice(2).join(' - ');
                                            return prefix + namePart.slice(0, 100);
                                        }
                                        return text;
                                    };

                                    return (
                                        <Autocomplete
                                            freeSolo
                                            options={
                                                watchedDestinationAirport ? consigneeAirlineDropdown.filter(
                                                    (item) => item.airportCode === watchedDestinationAirport
                                                ) : consigneeAirlineDropdown
                                            }
                                            value={value || null}
                                            onChange={(event, newValue) => {
                                                if (typeof newValue === 'string') {
                                                    // FIXED 2: Cap name segment on entry
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(newValue) });
                                                } else if (newValue && newValue.inputValue) {
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(newValue.inputValue) });
                                                } else if (newValue) {
                                                    onChange(newValue);
                                                } else {
                                                    onChange(null);
                                                }

                                                const isSelection = newValue && !newValue.inputValue && typeof newValue !== 'string';
                                                setValue('consigneeAddr1', isSelection ? newValue?.addressLine1 || '' : '');
                                                setValue('consigneeAddr2', isSelection ? newValue?.addressLine2 || '' : '');
                                                setValue('consigneeCity', isSelection ? newValue?.city || '' : '');
                                                setValue('consigneeState', isSelection ? newValue?.state || '' : '');
                                                setValue('consigneeZip', isSelection ? newValue?.zipCode || '' : '');
                                                setValue('consigneeContact', isSelection ? newValue?.contactPersonName || '' : '');
                                                setValue('consigneePhone', isSelection ? newValue?.phoneNumber || '' : '');
                                            }}
                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === 'input') {
                                                    const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                                                    let formatted = newInputValue;

                                                    if (!isDeleting) {
                                                        let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                                        if (/^\d{3}$/.test(clean)) {
                                                            formatted = `${clean} - `;
                                                        }

                                                        const match = clean.match(/^(\d{3})\s*-\s*([A-Za-z]{2,3})$/);
                                                        if (match) {
                                                            formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                                        }
                                                    }

                                                    // FIXED 3: Enforce strict 100-character cap on name segment while actively typing
                                                    onChange({ airlineId: null, airlineName: enforceNameLimit(formatted) });
                                                }
                                            }}
                                            getOptionLabel={(option) => {
                                                if (typeof option === 'string') return option;
                                                if (option.inputValue) return option.inputValue;
                                                if (option.airlineId) {
                                                    return `${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`;
                                                }
                                                return option.airlineName || '';
                                            }}
                                            isOptionEqualToValue={(option, val) =>
                                                option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                                            }
                                            renderOption={(props, option, state) => {
                                                const { key, ...optionProps } = props;
                                                const uniqueKey = option.airlineId
                                                    ? `consignee-airline-${option.airlineId}-${state.index}`
                                                    : `custom-consignee-airline-${state.index}`;

                                                if (option.inputValue) {
                                                    return (
                                                        <Box component="li" key={uniqueKey} {...optionProps} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                            Add :  "{option.inputValue}"
                                                        </Box>
                                                    );
                                                }

                                                const num = option.airlineNumber || '';
                                                const code = option.airlineCode || '';
                                                const name = option.airlineName || '';
                                                const city = option.city || '';
                                                const airCode = option.airportCode || '';

                                                return (
                                                    <Box component="li" key={uniqueKey} {...optionProps}>
                                                        {`${num} - ${code} - ${name} - ${city} - ${airCode}`}
                                                    </Box>
                                                );
                                            }}
                                            filterOptions={(options, params) => {
                                                const { inputValue } = params;
                                                const searchStr = (inputValue || '').toLowerCase().trim();

                                                const filtered = options.filter((option) => {
                                                    return (
                                                        String(option.airlineNumber || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airlineCode || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airlineName || '').toLowerCase().includes(searchStr) ||
                                                        String(option.city || '').toLowerCase().includes(searchStr) ||
                                                        String(option.airportCode || '').toLowerCase().includes(searchStr)
                                                    );
                                                });

                                                const isExisting = options.some(
                                                    (option) => searchStr === String(option.airlineName || '').toLowerCase().trim()
                                                );

                                                if (inputValue !== '' && !isExisting) {
                                                    filtered.unshift({
                                                        // FIXED 4: Cap custom filtering suggestion text lengths
                                                        inputValue: enforceNameLimit(inputValue),
                                                        airlineName: `${enforceNameLimit(inputValue)}`,
                                                    });
                                                }

                                                return filtered;
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref}
                                                    fullWidth
                                                    label={`Airline Name ${watchedAirportDeliveryService ? ' *' : ''}`}
                                                    variant="standard"
                                                    error={!!errors['consigneeName']}
                                                    helperText={errors['consigneeName']?.message || 'Format: Airline Number - Airline Code - Airline Name'}

                                                    // FIXED 5: Set hard layout barrier to 111 (Handles 11 prefix characters + 100 character custom name)
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        maxLength: 111
                                                    }}
                                                />
                                            )}
                                            sx={{ width: '25%' }}
                                        />
                                    );
                                }}
                            />



                        )}


                        {renderTextField('consigneeAddr1', 'Address Line 1')}

                        {renderTextField('consigneeAddr2', 'Address Line 2')}

                        {renderTextField('consigneeCity', 'City')}

                        {renderTextField('consigneeState', 'State')}

                        {renderZipCodeField('consigneeZip')}

                        {renderTextField('consigneeContact', 'Contact Person Name')}

                        {renderPhoneField('consigneePhone', 'Phone Number')}

                    </Box>

                </Box>

            </Paper>
        </ErrorBoundary>
    );
};

export default ActiveStep1; 
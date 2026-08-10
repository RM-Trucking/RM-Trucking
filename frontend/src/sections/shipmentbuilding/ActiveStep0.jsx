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
    getCustomerStationDropdown, getCarrierTerminalDropdown, searchCustomerStationDropdown,
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

const shipmentTypes = [
    {
        label: 'Air Import',
        value: 'AIR_IMPORT',
    },
    {
        label: 'Air Export',
        value: 'AIR_EXPORT',
    },
    {
        label: 'Ocean Import',
        value: 'OCEAN_IMPORT',
    },
    {
        label: 'Ocean Export',
        value: 'OCEAN_EXPORT',
    },
    {
        label: 'Domestic',
        value: 'DOMESTIC',
    },
    {
        label: 'Non-Forwarder Domestic',
        value: 'NON_FORWARDER_DOMESTIC',
    },
];

const serviceLevels = [

    'Regular',

    'Dedicated Truck',

    'Special Deliveries',

    'Conventions',

    'Weekend (Date Specific)',

    'Special Deliveries (Date Specific)',

    'Conventions (Date Specific)',

];



const ActiveStep0 = ({ control,
    errors,
    watchedServiceLevel, clearErrors, type }) => {
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };

    useEffect(() => {
        const isRequired = watchedServiceLevel?.includes('(Date Specific)');

        // If the service level no longer requires a date, wipe out any existing error message immediately
        if (!isRequired) {
            clearErrors("date");
            clearErrors("time");
        }
    }, [watchedServiceLevel, clearErrors]);

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={() => {
                // Optional: reset app state here if necessary before retry
                console.log("Error boundary reset triggered");
            }}
        >
            <Paper variant="outlined" sx={{ p: 3, mt: 2, borderRadius: 2 }}>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid rgba(143, 143, 143, 1)', pb: 1, mb: 3 }}>Shipment Details</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

                    <Box sx={{ flex: '1 1 22%' }}>
                        <Controller
                            name="shipmentType"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Type of Shipment *"
                                    variant="standard"
                                    error={!!errors.shipmentType}
                                    // Added: Fallback to an empty string if value is null/undefined to prevent UI errors
                                    value={field.value || ''}
                                    helperText={errors.shipmentType ? 'Shipment Type is required' : ''}
                                    disabled={type === "View"}
                                >
                                    {shipmentTypes.map((opt) => (
                                        // Fixed: Pass opt.value (the string) instead of the entire object
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </StyledTextField>
                            )}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 22%' }}>
                        <Controller
                            name="serviceLevel"
                            control={control}
                            // 1. FIXED: Pass the explicit string message instead of just 'true'
                            rules={{ required: "Service Level is required" }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Service Level *"
                                    variant="standard"
                                    error={!!errors.serviceLevel}
                                    // 2. FIXED: Displays the precise validation message when an error exists
                                    helperText={errors.serviceLevel ? errors.serviceLevel.message : ''}
                                    disabled={type === "View"}
                                >
                                    {serviceLevels.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </StyledTextField>
                            )}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 22%' }}>
                        <Controller
                            name="date"
                            control={control}
                            rules={{
                                // 1. Keeps your conditional required message contract intact
                                required: watchedServiceLevel?.includes('(Date Specific)') ? 'Date is required' : false,

                                validate: (value) => {
                                    const isRequired = watchedServiceLevel?.includes('(Date Specific)');

                                    // Check if the current value is structurally empty or blank
                                    const isEmpty = !value || value === '';
                                    const isInvalidDayjs = dayjs.isDayjs(value) && !value.isValid();

                                    // FIX: If the field is empty/invalid but NOT required, pass validation immediately
                                    if (isEmpty || isInvalidDayjs) {
                                        return isRequired ? "Date is required" : true;
                                    }

                                    const dateObj = dayjs(value);

                                    // 3. Throw an error for completely broken strings if a user typed something
                                    if (!dateObj.isValid()) {
                                        return "Please enter a valid date";
                                    }

                                    if (dateObj.year() < 1000) {
                                        return "Year is invalid";
                                    }

                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value, ...fieldParams } }) => (
                                <DatePicker
                                    {...fieldParams}
                                    value={value ? dayjs(value) : null}
                                    onChange={(newValue) => {
                                        if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                                            onChange(null);
                                        } else {
                                            onChange(newValue);
                                        }
                                    }}
                                    label={`Select Date ${watchedServiceLevel?.includes('(Date Specific)') ? '*' : ''}`}
                                    slotProps={{
                                        textField: {
                                            variant: 'standard',
                                            fullWidth: true,
                                            error: !!errors.date,
                                            helperText: errors.date ? errors.date.message : '',
                                            sx: {
                                                '& .MuiInputBase-input.Mui-disabled': {
                                                    WebkitTextFillColor: '#000000',
                                                    color: '#000000',
                                                },
                                                '& .MuiInputLabel-root.Mui-disabled': {
                                                    color: '#000000',
                                                },
                                                '& .MuiInput-root.Mui-disabled:before': {
                                                    borderBottomColor: '#000000',
                                                }
                                            }
                                        }
                                    }}
                                    disabled={type === "View"}
                                />

                            )}
                        />

                    </Box>

                    <Box sx={{ flex: '1 1 22%' }}>
                        <Controller
                            name="time"
                            control={control}
                            rules={{
                                required: watchedServiceLevel?.includes('(Date Specific)') ? 'Time is required' : false,
                                validate: (value) => {
                                    const isRequired = watchedServiceLevel?.includes('(Date Specific)');

                                    // Check for empty string, empty array, or null values safely
                                    const isEmpty = !value || value === '' || (Array.isArray(value) && value.length === 0);

                                    if (isEmpty) {
                                        return isRequired ? "Time is required" : true;
                                    }

                                    // Parse backend string or existing dayjs object to validate it
                                    const parsedValue = typeof value === 'string' ? dayjs(value, 'HH:mm:ss') : dayjs(value);
                                    if (!parsedValue.isValid()) {
                                        return isRequired ? "Time is required" : "Please enter a valid time";
                                    }

                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value, ...fieldParams } }) => {
                                // 1. Safely normalize incoming value to a dayjs object for the UI
                                let pickerValue = null;
                                if (value) {
                                    pickerValue = typeof value === 'string' ? dayjs(value, 'HH:mm:ss') : dayjs(value);
                                }

                                return (
                                    <TimePicker
                                        {...fieldParams}
                                        ampm={false}
                                        value={pickerValue && pickerValue.isValid() ? pickerValue : null}
                                        onChange={(newValue) => {
                                            if (!newValue || !dayjs(newValue).isValid()) {
                                                onChange(null);
                                            } else {
                                                // 2. Format it back to standard 24hr string for backend compliance
                                                onChange(dayjs(newValue).format('HH:mm:ss'));
                                            }
                                        }}
                                        label={`Select Time ${watchedServiceLevel?.includes('(Date Specific)') ? '*' : ''}`}
                                        slotProps={{
                                            textField: {
                                                variant: 'standard',
                                                fullWidth: true,
                                                error: !!errors.time,
                                                helperText: errors.time ? errors.time.message : '',
                                                sx: {
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        WebkitTextFillColor: '#000000',
                                                        color: '#000000',
                                                    },
                                                    '& .MuiInputLabel-root.Mui-disabled': {
                                                        color: '#000000',
                                                    },
                                                    '& .MuiInput-root.Mui-disabled:before': {
                                                        borderBottomColor: '#000000',
                                                    }
                                                }
                                            }
                                        }}
                                        disabled={type === "View"}
                                    />
                                );
                            }}
                        />


                    </Box>

                </Box>

            </Paper>
        </ErrorBoundary>
    );
};
export default ActiveStep0; 
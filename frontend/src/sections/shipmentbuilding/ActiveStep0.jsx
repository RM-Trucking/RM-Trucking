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
    watchedServiceLevel }) => {
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
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
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Type of Shipment *"
                                    variant="standard"
                                    error={!!errors.shipmentType}
                                    // Added: Fallback to an empty string if value is null/undefined to prevent UI errors
                                    value={field.value || ''}
                                    helperText={errors.shipmentType ? 'Shipment Type is required' : ''}
                                >
                                    {shipmentTypes.map((opt) => (
                                        // Fixed: Pass opt.value (the string) instead of the entire object
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
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
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Service Level *"
                                    variant="standard"
                                    error={!!errors.serviceLevel}
                                    // 2. FIXED: Displays the precise validation message when an error exists
                                    helperText={errors.serviceLevel ? errors.serviceLevel.message : ''}
                                >
                                    {serviceLevels.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </TextField>
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

                                    // 2. FIXED: If it is empty and required, return false to let the 'required' string error show up
                                    if (isEmpty) {
                                        return isRequired ? "Date is required" : true;
                                    }

                                    // If it is a Dayjs object structure but flagged invalid (like when a user clears a field manually)
                                    if (dayjs.isDayjs(value) && !value.isValid()) {
                                        return isRequired ? "Date is required" : true;
                                    }

                                    const dateObj = dayjs(value);

                                    // 3. Throw an error for '00/00/0000' strings
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
                                    // Allows user typing to display normally without locking or snapping back to blank midway
                                    value={value ? dayjs(value) : null}
                                    onChange={(newValue) => {
                                        // If the user cleared out the text field, explicitly push null to the state
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
                                            helperText: errors.date ? errors.date.message : ''
                                        }
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 22%' }}>
                        <Controller
                            name="time"
                            control={control}
                            rules={{
                                // 1. FIXED: Pass the explicit string message instead of a boolean value
                                required: watchedServiceLevel?.includes('(Date Specific)') ? 'Time is required' : false,

                                validate: (value) => {
                                    const isRequired = watchedServiceLevel?.includes('(Date Specific)');
                                    const isEmpty = !value || value === '';

                                    // 2. Handle empty conditions against requirement states
                                    if (isEmpty) {
                                        return isRequired ? "Time is required" : true;
                                    }

                                    // 3. Catch structural library validation failures (like typing 00:00 incorrectly or broken shapes)
                                    if (dayjs.isDayjs(value) && !value.isValid()) {
                                        return isRequired ? "Time is required" : "Please enter a valid time";
                                    }

                                    return true;
                                }
                            }}
                            render={({ field: { onChange, value, ...fieldParams } }) => (
                                <TimePicker
                                    {...fieldParams}
                                    ampm={false} // Maintains 24-hour military clock layout formatting
                                    value={value ? dayjs(value) : null}
                                    onChange={(newValue) => {
                                        // If the user manually backs out characters or clears it, pass a clean null state
                                        if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                                            onChange(null);
                                        } else {
                                            onChange(newValue);
                                        }
                                    }}
                                    label={`Select Time ${watchedServiceLevel?.includes('(Date Specific)') ? '*' : ''}`}
                                    slotProps={{
                                        textField: {
                                            variant: 'standard',
                                            fullWidth: true,
                                            error: !!errors.time,
                                            // 4. FIXED: Renders the precise validation string message underneath the input row
                                            helperText: errors.time ? errors.time.message : ''
                                        }
                                    }}
                                />
                            )}
                        />
                    </Box>

                </Box>

            </Paper>
        </ErrorBoundary>
    );
};
export default ActiveStep0; 
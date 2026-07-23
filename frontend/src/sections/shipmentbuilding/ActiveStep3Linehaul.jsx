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
import PickupAccessorialDialog from './PickupAccessorialDialog';
import AddAccessorialDialog from './AddAccessorialDialog';

const ActiveStep3Linehaul = ({
    dispatch,
    navigate,
    location,
    control,
    errors,
    selectedRouting,
    carrierTerminalDropdown,
    isSelectingCarrierLinehaulRef,
    setSelectCarrierLinehaulSearchValue,
    selectCarrierLinehaulSearchValue,
    watchedPickupAgentTerminal,
    watchedSelectedPickupCarrier,
    renderZipCodeFieldCarrierInfo,
    watchedLinehaulSelectRouting,
    watchedLinehaulToLocationType,
    isSelectingToCarrierLinehaulRef,
    setCarrierLinehaulSearchValue,
    carrierLinehaulSearchValue,
    watchedConsigneeName,
    watchedLinehaulToLocationFlag,
    watchedLinehaulAddAcc,
    setLineHaulAccModal,
    lineHaulAccFields,
    setActiveAccType,
    notesRefArray,
    notesRefArrayIndex,
    notesRefArrayObj,
    setOpenNotesDialogForShipmentAccs,
    setEditAccIndex,
    setActionType,
    setAddLineHaulAccModal,
    removeLineHaulAcc,
    lineHaulAccModal,
    replaceLineHaulAcc,
    addLineHaulAccModal,
    actionType,
    LINEHAUL_MASTER_ACCESSORIALS,
    setLINEHAUL_MASTER_Accessorials,
    appendLineHaulAccFields,
    lineHaulNotesArr,
    watchedLinehaulFromLocationFlag,
    onSaveOfEdit,
    editAccIndex,
    isLoading,
    setValue,
    watchedCarrierInfo,
    watchedToLocation,
}) => {
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
            {/* line haul details section  */}
            <Accordion defaultExpanded sx={{ mt: 3, boxShadow: 'none', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />} sx={{ borderBottom: '1px solid #ccc', px: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Line-haul</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 2 }}>

                    {/* linehaul details  */}
                    {(selectedRouting !== 'pickup_linehaul_delivery' && selectedRouting !== 'pickup_linehaul') && <>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 4, mt: 1, mb: 3 }}>
                            <Box sx={{ flex: '0 1 250px' }}>
                                <Controller
                                    name="carrierInfo.lineHaul.selectRouting"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            select
                                            fullWidth
                                            label="Select Routing *"
                                            variant="standard"
                                            {...field}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            <MenuItem value="linehaul_only">Line-haul only</MenuItem>
                                            <MenuItem value="linehaul_delivery">Line haul & Delivery</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </Box>
                        {/* TOP SECTION: Flexbox row for Carrier and Bill info */}
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.lineHaul.carrier"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                        <Autocomplete
                                            {...fieldProps} // Spreads ref and name from React Hook Form
                                            fullWidth
                                            options={carrierTerminalDropdown || []}

                                            // 1. ELIMINATES THE DUPLICATE KEY WARNINGS VIA UNIQUE STATE INDEX STRINGS
                                            renderOption={(props, option, state) => {
                                                const uniqueKey = `linehaul-carrier-${option.terminalId}-${option.carrierId}-${state.index}`;
                                                return (
                                                    <li {...props} key={uniqueKey}>
                                                        {option.carrierName && option.terminalName
                                                            ? `${option.carrierName} | ${option.terminalName}`
                                                            : ""}
                                                    </li>
                                                );
                                            }}

                                            // 2. PAIRS ACTIVE VALUES ACCURATELY BY INTERPRETING COMPOSITE VALUE TEXT STRINGS
                                            isOptionEqualToValue={(option, val) => {
                                                const optionKey = `${option?.terminalId}-${option?.carrierId}`;
                                                const valueKey = typeof val === 'string' ? val : `${val?.terminalId}-${val?.carrierId}`;
                                                return optionKey === valueKey;
                                            }}

                                            // Matches the combined string value logic from your previous MenuItem setup
                                            getOptionLabel={(option) => {
                                                if (option && option.carrierName && option.terminalName) {
                                                    return `${option.carrierName} | ${option.terminalName}`;
                                                }
                                                return "";
                                            }}

                                            // Finds the matching option object from carrierTerminalDropdown array based on the stored value
                                            value={carrierTerminalDropdown.find(opt => `${opt.terminalId}-${opt.carrierId}` === value) || null}

                                            // Updates React Hook Form state on change
                                            onChange={(event, newValue) => {
                                                dispatch(getLinehaulAccessorials(newValue?.terminalEntityId));
                                                isSelectingCarrierLinehaulRef.current = true;

                                                // Pass the structural string back to React Hook Form state, matching your old MenuItem structure
                                                const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                onChange(formValue);
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason !== "reset") {
                                                    setSelectCarrierLinehaulSearchValue(newInputValue);
                                                    // if (!newInputValue || newInputValue.trim() === "") {
                                                    //   dispatch(searchCarriers(""));
                                                    // }
                                                }
                                            }}
                                            loading={isLoading}
                                            loadingText="Searching carriers..."
                                            noOptionsText={selectCarrierLinehaulSearchValue ? "No carriers found" : "Type to search for carriers"}

                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref} // Keeps React Hook Form field validation focus scrolling intact
                                                    variant="standard"
                                                    label="Select Carrier *"
                                                    error={!!errors.carrierInfo?.toLocation} // Uses React Hook Form errors
                                                    helperText={errors.carrierInfo?.toLocation ? 'To Location is required' : ' '}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{
                                                        '& .MuiInputBase-input:disabled': {
                                                            color: '#000',
                                                            WebkitTextFillColor: '#000'
                                                        }
                                                    }}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                            // disabled={!watchedPickupAgentTerminal}
                                            disabled={!watchedPickupAgentTerminal && (watchedSelectedPickupCarrier?.split('-')[1] !== watchedToLocation?.split('-')[1])}
                                        />
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.lineHaul.billNumber"
                                    rules={{ required: true }}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Carrier's Bill Number"
                                            required
                                            variant="standard"
                                            // Natively restricts entry to 50 characters max
                                            inputProps={{ maxLength: 50 }}
                                        />
                                    )}
                                />

                            </Box>

                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                            {watchedPickupAgentTerminal && <Box>
                                <Controller
                                    name="carrierInfo.lineHaul.toggleAddress"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Address or From location
                                            </Typography>
                                            <ToggleButtonGroup
                                                value={value}
                                                exclusive
                                                // Strip the event argument and pass only the new string value
                                                onChange={(event, newValue) => {
                                                    if (newValue !== null) {
                                                        onChange(newValue);
                                                    }
                                                }}
                                                color="primary"
                                                aria-label="Address or From location"
                                            >
                                                <ToggleButton value="pickup" sx={{ textTransform: 'none', px: 3 }}>
                                                    Pickup agents dock
                                                </ToggleButton>
                                                <ToggleButton value="linehaul" sx={{ textTransform: 'none', px: 3, }}>
                                                    Line haul carriers terminal dock
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </>
                                    )}
                                />
                            </Box>}
                            <Box sx={{ flex: '2 1 300px', display: 'flex', gap: 1 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.manualFromLocation"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            sx={{ mt: '3%', whiteSpace: 'nowrap' }}
                                            control={<Checkbox {...field} checked={field.value} size="small" />}
                                            label={<Typography sx={{ fontSize: '0.8rem' }}>Edit From Location</Typography>}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>

                        {/* MANUAL LOCATION FIELDSET: Flexbox for address fields */}

                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1, position: 'relative', borderStyle: 'solid', borderColor: '#ccc' }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Manual From Location
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.lineHaul.manualFromLocationDetails.zip', !watchedLinehaulFromLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>

                        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3, mb: 3, alignItems: 'stretch' }}>
                            <Box sx={{ width: '20%' }}>
                                <Controller
                                    name="carrierInfo.lineHaul.toLocationType"
                                    control={control}
                                    defaultValue={[]}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Select To Type *"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            {watchedLinehaulSelectRouting === 'linehaul_only' && <MenuItem value="Carrier">
                                                Carrier
                                            </MenuItem>}

                                            {watchedLinehaulSelectRouting === 'linehaul_delivery' && <MenuItem value="Consignee">
                                                Consignee
                                            </MenuItem>}
                                        </TextField>
                                    )}
                                />
                            </Box>

                            <Box sx={{ width: '50%' }}>
                                {(watchedLinehaulToLocationType === 'Carrier' || watchedLinehaulToLocationType === '') &&
                                    <Controller
                                        name="carrierInfo.lineHaul.toLocation"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                            <Autocomplete
                                                {...fieldProps} // Spreads ref and name from React Hook Form
                                                options={carrierTerminalDropdown || []}

                                                // 1. ELIMINATES THE DUPLICATE KEY WARNING VIA UNIQUE RENDER INDEXES
                                                renderOption={(props, option, state) => {
                                                    const uniqueKey = `linehaul-tolocation-${option.terminalId}-${option.carrierId}-${state.index}`;
                                                    return (
                                                        <li {...props} key={uniqueKey}>
                                                            {option.carrierName && option.terminalName
                                                                ? `${option.carrierName} | ${option.terminalName}`
                                                                : ""}
                                                        </li>
                                                    );
                                                }}

                                                // 2. STOPS OPTION SELECTION GLITCHES BY MATCHING COMPOSITE STRING PAIRS Correctly
                                                isOptionEqualToValue={(option, val) => {
                                                    const optionKey = `${option?.terminalId}-${option?.carrierId}`;
                                                    const valueKey = typeof val === 'string' ? val : `${val?.terminalId}-${val?.carrierId}`;
                                                    return optionKey === valueKey;
                                                }}

                                                // Matches the combined string value logic from your previous MenuItem setup
                                                getOptionLabel={(option) => {
                                                    if (option && option.carrierName && option.terminalName) {
                                                        return `${option.carrierName} | ${option.terminalName}`;
                                                    }
                                                    return "";
                                                }}

                                                // Finds the matching option object from carrierTerminalDropdown array based on the stored value
                                                value={carrierTerminalDropdown.find(opt => `${opt.terminalId}-${opt.carrierId}` === value) || null}

                                                // Updates React Hook Form state on change
                                                onChange={(event, newValue) => {
                                                    isSelectingToCarrierLinehaulRef.current = true;
                                                    dispatch(getDeliveryAccessorials(newValue?.terminalEntityId));
                                                    // Pass the structural string back to React Hook Form state, matching your old MenuItem structure
                                                    const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                    onChange(formValue);
                                                }}

                                                onInputChange={(event, newInputValue, reason) => {
                                                    if (reason !== "reset") {
                                                        setCarrierLinehaulSearchValue(newInputValue);
                                                        // if (!newInputValue || newInputValue.trim() === "") {
                                                        //   dispatch(searchCarriers(""));
                                                        // }
                                                    }
                                                }}
                                                loading={isLoading}
                                                loadingText="Searching carriers..."
                                                noOptionsText={carrierLinehaulSearchValue ? "No carriers found" : "Type to search for carriers"}

                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        inputRef={ref} // Forwards validation focusing capabilities accurately to your React Hook Form setup
                                                        variant="standard"
                                                        label="To Location *"
                                                        error={!!errors.carrierInfo?.toLocation} // Uses React Hook Form errors
                                                        helperText={errors.carrierInfo?.toLocation ? 'To Location is required' : ' '}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{
                                                            '& .MuiInputBase-input:disabled': {
                                                                color: '#000',
                                                                WebkitTextFillColor: '#000'
                                                            }
                                                        }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />

                                }
                                {
                                    watchedLinehaulToLocationType === 'Consignee' && <Controller
                                        name="carrierInfo.toLocation"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field: { onChange, value, ...fieldProps } }) => (
                                            <TextField
                                                fullWidth
                                                variant="standard"
                                                label="To Location *"
                                                value={watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? ''}
                                                disabled // Visual indicator showing the user it cannot be changed manually
                                                InputLabelProps={{ shrink: true }}
                                                sx={{
                                                    '& .MuiInputBase-input:disabled': {
                                                        color: '#000', // Ensures high contrast visibility even when disabled
                                                        WebkitTextFillColor: '#000'
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                }
                            </Box>
                            <Box>
                                <Controller
                                    name="carrierInfo.lineHaul.manualToLocation"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            sx={{ mb: 0.5, whiteSpace: 'nowrap' }}
                                            control={<Checkbox {...field} checked={field.value} size="small" />}
                                            label={<Typography sx={{ fontSize: '0.8rem' }}>Edit To Location</Typography>}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>
                        {/* MANUAL LOCATION FIELDSET: Flexbox for address fields */}

                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1, position: 'relative', borderStyle: 'solid', borderColor: '#ccc' }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Manual To Location
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.lineHaul.manualToLocationDetails.zip', !watchedLinehaulToLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>

                        {/* ETA and Weight Section - Flexbox Layout */}
                        <Box sx={{ display: 'flex', gap: 4, mb: 4, mt: 2 }}>
                            {/* ETA Date */}
                            <Box sx={{ flex: 1 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.etaDate"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            if (!value || value === '') return true;

                                            const dateObj = dayjs(value);
                                            if (!dateObj.isValid()) {
                                                return "Please enter a valid date";
                                            }
                                            if (dateObj.year() < 1000) {
                                                return "Year is invalid";
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field: { onChange, value, ...fieldParams }, fieldState: { error } }) => (
                                        <DatePicker
                                            {...fieldParams}
                                            value={value && dayjs(value).isValid() ? dayjs(value) : null}
                                            onChange={(newValue) => {
                                                if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                                                    onChange(null);
                                                } else {
                                                    onChange(newValue);
                                                }
                                            }}
                                            label="ETA Date"
                                            slotProps={{
                                                textField: {
                                                    variant: 'standard',
                                                    fullWidth: true,
                                                    error: !!error,
                                                    helperText: error ? error.message : '',

                                                    // FIXED: Intercept keystrokes immediately to block "00/00/0000" layouts
                                                    onBeforeInput: (e) => {
                                                        const target = e.target;
                                                        const inputVal = target.value;
                                                        const insertedChar = e.data;

                                                        // 1. Block '0' if it is the very first character typed
                                                        if (insertedChar === '0' && (!inputVal || inputVal.trim() === '')) {
                                                            e.preventDefault();
                                                            return;
                                                        }

                                                        // 2. Block '0' if they are typing it directly after a slash (e.g., "12/0" for month/day filler)
                                                        // This stops patterns like "12/00/0000" or "01/00/2024"
                                                        if (insertedChar === '0' && inputVal.endsWith('/')) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                    }
                                                }
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Box>

                            {/* ETA time */}
                            <Box sx={{ flex: 1 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.etaTime"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState: { error, isTouched } }) => (
                                        <TimePicker
                                            {...field}
                                            label="ETA Time"
                                            ampm={false}
                                            slotProps={{
                                                textField: {
                                                    variant: 'standard',
                                                    fullWidth: true,
                                                    // FIX: Automatically extracts the correct field error state 
                                                    // and only displays it after a user interaction (isTouched)
                                                    error: !!error && isTouched
                                                }
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Box>


                            {/* Pcs / Wght */}
                            <Box sx={{ flex: 1.5 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.pcs"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="Pcs"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            // 1. Sets a hard maximum value of 10 nines (9,999,999,999) 
                                            // 2. Blocks the decimal point key "." from being pressed
                                            inputProps={{
                                                max: 9999999999
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            // 3. Optional: Extra insurance to slice text if pasted over 10 digits
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.length > 10) {
                                                    e.target.value = value.slice(0, 10);
                                                }
                                                field.onChange(e);
                                            }}
                                        />
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: 1.5 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.weight"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Weight"
                                            type="number"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            // 1. Enforces the hard maximum numeric value (8 digits before decimal)
                                            inputProps={{
                                                max: 99999999.99,
                                                step: "0.01" // Signals to browsers that 2 decimal places are expected
                                            }}
                                            // 2. Blocks exponent characters 'e', '+', or '-' from breaking the number
                                            onKeyDown={(e) => {
                                                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            // 3. Regex check: Enforces a maximum of 10 total digits and 2 decimal places
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                // Allows empty string, or any number that matches up to 8 digits and up to 2 decimals
                                                // Total maximum string length (including dot) will be 11 characters
                                                const isValidDecimal = /^\d{0,8}(\.\d{0,2})?$/.test(val);

                                                if (isValidDecimal || val === '') {
                                                    field.onChange(e);
                                                } else {
                                                    // If the typed character violates (10,2), block it by ignoring the change
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />

                            </Box>
                        </Box>

                    </>}

                    <Box sx={{ flex: '0 1 200px', mb: 3 }}>
                        <FormControlLabel
                            control={<Controller name="carrierInfo.lineHaul.lineHaulAddAcc" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                            label={<Typography variant="body2">Add Linehaul Accessorials</Typography>}
                        />
                    </Box>

                    {/* ACCESSORIALS: Flexbox for header */}
                    {watchedLinehaulAddAcc && <Accordion sx={{ mt: 3, boxShadow: 'none', '&:before': { display: 'none' }, mb: 6 }}>
                        <AccordionSummary
                            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                            sx={{ borderBottom: '1px solid #ccc', px: 0 }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">Linehaul Accessorial Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => setLineHaulAccModal(true)} // Opens the Dialog
                                    sx={{ bgcolor: '#a22', textTransform: 'none' }}
                                >
                                    Add Accessorial
                                </Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#eee' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Accessorial Name</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charge Type</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charges</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Notes</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {lineHaulAccFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.accessorialName}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeType}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeValue}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => {
                                                        setActiveAccType('LineHaul');
                                                        notesRefArray.current = field.notes;
                                                        notesRefArrayIndex.current = index;
                                                        notesRefArrayObj.current = field;
                                                        setOpenNotesDialogForShipmentAccs(true);
                                                    }}>
                                                        <Iconify icon="icon-park-solid:notes" sx={{ color: '#90caf9' }} />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {/* <IconButton size="small" onClick={() => {
                                      setActionType('View');
                                      setAddAccModal(true);
                                    }}><Iconify icon="carbon:view-filled" /></IconButton> */}
                                                        <IconButton size="small" onClick={() => {
                                                            setActiveAccType('LineHaul');
                                                            setEditAccIndex(index);
                                                            setActionType('Edit');
                                                            setAddLineHaulAccModal(true);
                                                        }}><Iconify icon="tabler:edit" /></IconButton>
                                                        <IconButton onClick={() => {
                                                            const selectedObj = watchedCarrierInfo?.lineHaul?.linehaulAccessorials[index];
                                                            const targetId = selectedObj?.entityAccessorialId;
                                                            // If there is no valid ID, stop the function early
                                                            if (!targetId) return;
                                                            const updatedMasterList = LINEHAUL_MASTER_ACCESSORIALS.map((item) => {
                                                                if (item.entityAccessorialId === targetId) {
                                                                    return {
                                                                        ...item,
                                                                        selected: false // Explicitly uncheck this item
                                                                    };
                                                                }
                                                                return item; // Leave all other items exactly as they are
                                                            });
                                                            // 4. Update the master accessorials state
                                                            setLINEHAUL_MASTER_Accessorials(updatedMasterList);
                                                            removeLineHaulAcc(index);
                                                            
                                                        }} size="small"><Iconify icon="material-symbols:delete-rounded" /></IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>}

                    <PickupAccessorialDialog
                        open={lineHaulAccModal}
                        onClose={() => {
                            setLineHaulAccModal(false);
                            setAddLineHaulAccModal(false);
                            setActionType('');
                        }}
                        onSave={(selectedData) => replaceLineHaulAcc(selectedData)}
                        setActionType={setActionType}
                        setAddAccModal={setAddLineHaulAccModal}
                        addAccModal={addLineHaulAccModal}
                        actionType={actionType}
                        MASTER_ACCESSORIALS={LINEHAUL_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setLINEHAUL_MASTER_Accessorials}
                        AccFields={lineHaulAccFields}
                    />
                    <AddAccessorialDialog
                        open={addLineHaulAccModal}
                        onClose={() => {
                            setAddLineHaulAccModal(false);
                            setActionType('');
                            setEditAccIndex(null);
                        }}
                        onSave={onSaveOfEdit}
                        setActionType={setActionType}
                        setAddAccModal={setAddLineHaulAccModal}
                        addAccModal={addLineHaulAccModal}
                        actionType={actionType}
                        accFields={lineHaulAccFields}
                        editableObj={lineHaulAccFields[editAccIndex]}
                        appendAccFields={appendLineHaulAccFields}
                        MASTER_ACCESSORIALS={LINEHAUL_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setLINEHAUL_MASTER_Accessorials}
                    />


                    {/* LINE-HAUL NOTES: Flexbox for chip gallery */}
                    <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative', mb: 3 }}>
                        <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                            Line-haul Notes
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {lineHaulNotesArr.map((note, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        bgcolor: '#e3f2fd',
                                        borderRadius: '16px',
                                        px: 1.5,
                                        py: 0.5,
                                        fontSize: '0.65rem',
                                        border: '1px solid #bbdefb'
                                    }}
                                    onClick={() => {
                                        setValue('carrierInfo.lineHaul.lineHaulNotes', note);
                                    }}
                                >
                                    {note}
                                    {/* <Box
                            component="span"
                            onClick={() => {
                              const updatedNotes = lineHaulNotes.filter((_, i) => i !== idx);
                              setValue('carrierInfo.lineHaul.lineHaulNotes', updatedNotes);
                            }}
                            sx={{ ml: 1, cursor: 'pointer', '&:hover': { color: 'red' } }}
                          >
                            &times;
                          </Box> */}
                                </Box>
                            ))}
                            {/* <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#a22', color: '#fff', borderRadius: '16px', px: 1.5, py: 0.5, fontSize: '0.65rem', cursor: 'pointer' }}>
                      More..
                    </Box> */}
                        </Box>

                        <Controller
                            name="carrierInfo.lineHaul.lineHaulNotes"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    label="Notes"
                                    variant="standard"
                                    placeholder="Type and press Enter"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ maxLength: 255 }}
                                />
                            )}
                        />
                    </Box>

                    {/* BOTTOM OPTIONS: Horizontal Flexbox */}
                    {/* <Box sx={{ display: 'flex', gap: 4 }}> */}
                    {/* <Controller
                      name="carrierInfo.lineHaul.deliveryIncluded"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          sx={{ mb: 0.5, whiteSpace: 'nowrap' }}
                          control={<Checkbox {...field} checked={field.value} size="small" />}
                          label={<Typography sx={{ fontSize: '0.8rem' }}>Delivery Included</Typography>}
                        />
                      )}
                    /> */}
                    {/* <Controller
                      name="carrierInfo.lineHaul.airportTransfer"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          sx={{ mb: 0.5, whiteSpace: 'nowrap' }}
                          control={<Checkbox {...field} checked={field.value} size="small" />}
                          label={<Typography sx={{ fontSize: '0.8rem' }}>Airport Transfer</Typography>}
                        />
                      )}
                    /> */}

                    {/* </Box> */}
                </AccordionDetails>
            </Accordion>
        </ErrorBoundary>
    );
};
export default ActiveStep3Linehaul; 
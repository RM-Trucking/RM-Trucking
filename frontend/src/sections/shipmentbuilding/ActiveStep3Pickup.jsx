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

const ActiveStep3Pickup = ({
    dispatch,
    navigate,
    location,
    control,
    errors,
    isPickupPending,
    carrierTerminalDropdown,
    setSelectCarrierPickupSearchValue,
    selectCarrierPickupSearchValue,
    watchedFromLocationFlag,
    renderZipCodeFieldCarrierInfo,
    watchedPickupAgentTerminal,
    selectedRouting,
    watchedToLocationType,
    isSelectingCarrierPickupRef,
    isSelectingCarrierLinehaulRef,
    isSelectingCarrierDeliveryRef,
    isSelectingToCarrierPickupRef,
    isSelectingToCarrierLinehaulRef,
    isSelectingToCarrierDeliveryRef,
    isLoading,
    watchedConsigneeName,
    watchedToLocationFlag,
    watchedAddPickupAccessorial,
    setPickupAccModal,
    pickupAccModal,
    pickupAccFields,
    setActiveAccType,
    notesRefArray,
    notesRefArrayIndex,
    notesRefArrayObj,
    setOpenNotesDialogForShipmentAccs,
    setEditAccIndex,
    editAccIndex,
    setActiveNotesIndex,
    setActionType,
    actionType,
    setAddPickUpAccModal,
    removePickupAcc,
    replacePickupAcc,
    PICKUP_MASTER_ACCESSORIALS,
    setPICKUP_MASTER_Accessorials,
    onSaveOfEdit,
    addPickUpAccModal,
    watchedPickupAlert,
    inboundNotes,
    setValue,
    watchedCarrierInfo,
    appendPickupAccFields,
    carrierTerminalSelectError,
    setCarrierTerminalSelectError,
    watchedLineHaulToggledAddress,
    watchedPickupAdditionalMails,

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
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                {/* Top Level Checkbox */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, borderBottom: ' 1px solid rgba(143, 143, 143, 1)' }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                        Carrier Information
                    </Typography>
                    <FormControlLabel
                        control={<Controller name="carrierInfo.orderReceivedPending" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                        label={<Typography variant="body2">Order Received Pickup Pending</Typography>}
                    />
                </Box>
                {isPickupPending === false && <>

                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, position: 'relative' }}>
                        <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                            Pickup Details
                        </Typography>

                        {/* Routing and Conditional Airport Transfer */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 1, mb: 3 }}>
                            <Box sx={{ flex: '0 1 250px' }}>
                                <Controller
                                    name="carrierInfo.selectRouting"
                                    control={control}
                                    render={({ field: { onChange, value, ...restField } }) => (
                                        <TextField
                                            select
                                            fullWidth
                                            label="Select Routing *"
                                            variant="standard"
                                            value={value || ""} // Prevents MUI out-of-range warnings if value is undefined
                                            {...restField} // Passes remaining properties like ref, name, and onBlur safely
                                            onChange={(e) => {
                                                const selectedValue = e.target.value;

                                                setValue('carrierInfo.lineHaul.selectRouting', '');
                                                setValue('carrierInfo.lineHaul.toggleAddress', '');

                                                // 2. Crucial: Update React Hook Form's state
                                                onChange(e);
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            <MenuItem value="pickup_only">Pickup only</MenuItem>
                                            <MenuItem value="pickup_linehaul">Pickup & Line haul</MenuItem>
                                            <MenuItem value="pickup_linehaul_delivery">Pickup, Line haul & Delivery</MenuItem>
                                        </TextField>
                                    )}
                                />

                            </Box>

                            {/* Conditional Checkbox */}
                            {/* {selectedRouting === "pickup_linehaul_delivery" && ( */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="carrierInfo.airportTransfer"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    {...field}
                                                    checked={field.value}
                                                    size="small"
                                                    sx={{ color: '#001a41', '&.Mui-checked': { color: '#001a41' } }}
                                                />
                                            )}
                                        />
                                    }
                                    label={<Typography variant="body2">Airport Transfer</Typography>}
                                />
                            </Box>
                            {/* )} */}
                        </Box>

                        {/* Row 1: Airport Pickup, Carrier, From Location, Manual Toggle */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3, alignItems: 'center' }}>
                            {/* <Box sx={{ flex: '0 1 150px' }}>
                    <FormControlLabel
                      control={<Controller name="carrierInfo.airportPickup" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                      label={<Typography variant="body2">Airport Pickup</Typography>}
                    />
                  </Box> */}
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.selectCarrier"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                        <Autocomplete
                                            {...fieldProps}
                                            fullWidth
                                            options={carrierTerminalDropdown || []}

                                            // 1. ADD THIS PROP TO GENERATE EXPLICIT, UNIQUE KEYS
                                            renderOption={(props, option, state) => {
                                                const uniqueKey = `carrier-terminal-${option.terminalId}-${option.carrierId}-${state.index}`;
                                                return (
                                                    <li {...props} key={uniqueKey}>
                                                        {option.carrierName && option.terminalName
                                                            ? `${option.carrierName} | ${option.terminalName}`
                                                            : ""}
                                                    </li>
                                                );
                                            }}

                                            // 2. ADD THIS PROP TO ENSURE PROPER COMPONENT HIGHLIGHTING
                                            isOptionEqualToValue={(option, val) => {
                                                const optionKey = `${option?.terminalId}-${option?.carrierId}`;
                                                const valueKey = typeof val === 'string' ? val : `${val?.terminalId}-${val?.carrierId}`;
                                                return optionKey === valueKey;
                                            }}

                                            filterOptions={(options, state) => {
                                                const inputValue = state.inputValue.trim().toLowerCase();
                                                if (!inputValue) return options;

                                                return options.filter((option) => {
                                                    const carrierName = (option.carrierName || '').toLowerCase();
                                                    const terminalName = (option.terminalName || '').toLowerCase();
                                                    const carrierId = String(option.carrierId || '');
                                                    const terminalId = String(option.terminalId || '');
                                                    const stateName = (option.address?.state || '').toLowerCase();
                                                    const mainEmail = (option.terminalEmail || '').toLowerCase();
                                                    const personnelEmails = (option.emails || []).map(e => (e.email || '').toLowerCase());

                                                    return (
                                                        carrierName.includes(inputValue) ||
                                                        terminalName.includes(inputValue) ||
                                                        carrierId.includes(inputValue) ||
                                                        terminalId.includes(inputValue) ||
                                                        stateName.includes(inputValue) ||
                                                        mainEmail.includes(inputValue) ||
                                                        personnelEmails.some(email => email.includes(inputValue))
                                                    );
                                                });
                                            }}

                                            getOptionLabel={(option) => {
                                                if (option && option.carrierName && option.terminalName) {
                                                    return `${option.carrierName} | ${option.terminalName}`;
                                                }
                                                return "";
                                            }}

                                            value={carrierTerminalDropdown.find(opt => `${opt.terminalId}-${opt.carrierId}` === value) || null}

                                            onChange={(event, newValue) => {
                                                dispatch(getPickupAccessorials(newValue?.terminalEntityId));
                                                isSelectingCarrierPickupRef.current = true;
                                                const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                onChange(formValue);
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason !== "reset") {
                                                    setSelectCarrierPickupSearchValue(newInputValue);
                                                }
                                                // if(reason === 'input'){
                                                //   dispatch(getCarrierTerminalDropdown(newInputValue));
                                                // }
                                            }}

                                            loading={isLoading}
                                            loadingText="Searching carriers..."
                                            noOptionsText={selectCarrierPickupSearchValue ? "No carriers found" : "Type to search for carriers"}

                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref} // Keeps React Hook Form validation focus operational
                                                    variant="standard"
                                                    label="Select Carrier *"
                                                    error={!!errors.carrierInfo?.toLocation}
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
                                            sx={{ width: '100% !important', mt: 2 }}
                                        />
                                    )}
                                />


                            </Box>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller name="carrierInfo.fromLocation" control={control} render={({ field }) => (
                                    <TextField {...field} fullWidth label="From Location *" variant="standard" InputLabelProps={{ shrink: true }} />
                                )} />
                            </Box>
                            <Box sx={{ flex: '0 1 200px' }}>
                                <FormControlLabel
                                    control={<Controller name="carrierInfo.isManualFromLocation" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                                    label={<Typography variant="body2">Edit From Location</Typography>}
                                />
                            </Box>
                        </Box>

                        {/* Nested Manual From Location Section */}

                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1, position: 'relative', borderStyle: 'solid', borderColor: '#ccc' }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Manual From Location
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller
                                        name="carrierInfo.manualAddress.line1"
                                        control={control}
                                        render={({ field }) => (
                                            <StyledTextField
                                                {...field}
                                                fullWidth
                                                label="Address Line 1"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                                // This enforces a hard limit of 255 characters at the HTML input element level
                                                inputProps={{ maxLength: 255 }}
                                            />
                                        )}
                                        disabled={!watchedFromLocationFlag}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller
                                        name="carrierInfo.manualAddress.line2"
                                        control={control}
                                        render={({ field }) => (
                                            <StyledTextField
                                                {...field}
                                                fullWidth
                                                label="Address Line 2"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                                disabled={!watchedFromLocationFlag}
                                                // This natively blocks typing beyond 255 characters
                                                inputProps={{ maxLength: 255 }}
                                            />
                                        )}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller
                                        name="carrierInfo.manualAddress.city"
                                        control={control}
                                        render={({ field }) => (
                                            <StyledTextField
                                                {...field}
                                                fullWidth
                                                label="City"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                                // Hard cap typing at 100 characters natively
                                                inputProps={{ maxLength: 100 }}
                                            />
                                        )}
                                        disabled={!watchedFromLocationFlag}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller
                                        name="carrierInfo.manualAddress.state"
                                        control={control}
                                        render={({ field }) => (
                                            <StyledTextField
                                                {...field}
                                                fullWidth
                                                label="State"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                                // Limits input length to 100 characters natively
                                                inputProps={{ maxLength: 100 }}
                                            />
                                        )}
                                        disabled={!watchedFromLocationFlag}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.manualAddress.zip', !watchedFromLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>

                        {/*  adding pickup agent terminal check box */}

                        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                            <Box sx={{ flex: '0 1 200px' }}>
                                <FormControlLabel
                                    control={<Controller name="carrierInfo.pickupAgentTerminal" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                                    label={<Typography variant="body2">Pickup Agent Terminal</Typography>}
                                />
                            </Box>
                        </Box>

                        {/* adding a condition such that when pickup agent terminal was checked we will not show location type  */}
                        {watchedPickupAgentTerminal === false && <>
                            {/* Row 3: To Location Type, To Location, Accessorial, Alert */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3, alignItems: 'center' }}>
                                <Box sx={{ flex: '1 1 200px' }}>
                                    <Controller
                                        name="carrierInfo.toLocationType"
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                select
                                                fullWidth
                                                label="Select To Location Type *"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                            >
                                                {(selectedRouting === 'pickup_only' || selectedRouting === 'pickup_linehaul') && <MenuItem value="Carrier">
                                                    Carrier
                                                </MenuItem>}

                                                {selectedRouting === 'pickup_linehaul_delivery' && <MenuItem value="Consignee">
                                                    Consignee
                                                </MenuItem>}
                                            </TextField>
                                        )}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 200px', }}>

                                    {(watchedToLocationType === 'Carrier' || watchedToLocationType === '') &&
                                        <Controller
                                            name="carrierInfo.toLocation"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                                <Autocomplete
                                                    {...fieldProps} // Spreads ref and name from React Hook Form
                                                    fullWidth
                                                    options={carrierTerminalDropdown || []}

                                                    // 1. FIXES THE KEY WARNING BY GENERATING EXPLICIT UNIQUE KEYS
                                                    renderOption={(props, option, state) => {
                                                        const uniqueKey = `to-location-${option.terminalId}-${option.carrierId}-${state.index}`;
                                                        return (
                                                            <li {...props} key={uniqueKey}>
                                                                {option.carrierName && option.terminalName
                                                                    ? `${option.carrierName} | ${option.terminalName}`
                                                                    : ""}
                                                            </li>
                                                        );
                                                    }}

                                                    // 2. ENSURES CORRECT HIGHLIGHTING AND VALUE SELECTION MATCHING
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
                                                        isSelectingToCarrierPickupRef.current = true;
                                                        dispatch(getLinehaulAccessorials(newValue?.terminalEntityId));
                                                        // Pass the structural string back to React Hook Form state, matching your old MenuItem structure
                                                        const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                        onChange(formValue);
                                                    }}

                                                    onInputChange={(event, newInputValue, reason) => {
                                                        if (reason !== "reset") {
                                                            setCarrierPickupSearchValue(newInputValue);
                                                            // if (!newInputValue || newInputValue.trim() === "") {
                                                            //   dispatch(searchCarriers(""));
                                                            // }
                                                        }
                                                    }}
                                                    loading={isLoading}
                                                    loadingText="Searching carriers..."
                                                    noOptionsText={carrierPickupSearchValue ? "No carriers found" : "Type to search for carriers"}

                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            inputRef={ref} // Forwards validation focus accurately back to React Hook Form
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
                                                    sx={{ width: '100% !important', mt: 2 }}
                                                />
                                            )}
                                        />
                                    }
                                    {watchedToLocationType === 'Consignee' && <Controller
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
                                    />}
                                </Box>
                                <Box sx={{ flex: '0 1 200px' }}>
                                    <FormControlLabel
                                        control={<Controller name="carrierInfo.isManualToLocation" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                                        label={<Typography variant="body2">Edit To Location</Typography>}
                                    />
                                </Box>

                            </Box>
                            {/* Nested Manual To Location Section */}

                            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1, position: 'relative', borderStyle: 'solid', borderColor: '#ccc' }}>
                                <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                    Manual To Location
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ flex: '1 1 18%' }}>
                                        <Controller
                                            name="carrierInfo.manualToAddress.line1"
                                            control={control}
                                            render={({ field }) => (
                                                <StyledTextField
                                                    {...field}
                                                    fullWidth
                                                    label="Address Line 1"
                                                    variant="standard"
                                                    InputLabelProps={{ shrink: true }}
                                                    // Hard cap typing at 255 characters natively
                                                    inputProps={{ maxLength: 255 }}
                                                />
                                            )}
                                            disabled={!watchedToLocationFlag}
                                        />

                                    </Box>
                                    <Box sx={{ flex: '1 1 18%' }}>
                                        <Controller
                                            name="carrierInfo.manualToAddress.line2"
                                            control={control}
                                            render={({ field }) => (
                                                <StyledTextField
                                                    {...field}
                                                    fullWidth
                                                    label="Address Line 2"
                                                    variant="standard"
                                                    InputLabelProps={{ shrink: true }}
                                                    // Hard cap typing at 255 characters natively
                                                    inputProps={{ maxLength: 255 }}
                                                />
                                            )}
                                            disabled={!watchedToLocationFlag}
                                        />

                                    </Box>
                                    <Box sx={{ flex: '1 1 18%' }}>
                                        <Controller
                                            name="carrierInfo.manualToAddress.city"
                                            control={control}
                                            render={({ field }) => (
                                                <StyledTextField
                                                    {...field}
                                                    fullWidth
                                                    label="City"
                                                    variant="standard"
                                                    InputLabelProps={{ shrink: true }}
                                                    // Hard cap typing at 100 characters natively
                                                    inputProps={{ maxLength: 100 }}
                                                />
                                            )}
                                            disabled={!watchedToLocationFlag}
                                        />

                                    </Box>
                                    <Box sx={{ flex: '1 1 18%' }}>
                                        <Controller
                                            name="carrierInfo.manualToAddress.state"
                                            control={control}
                                            render={({ field }) => (
                                                <StyledTextField
                                                    {...field}
                                                    fullWidth
                                                    label="State"
                                                    variant="standard"
                                                    InputLabelProps={{ shrink: true }}
                                                    // Hard cap typing at 100 characters natively
                                                    inputProps={{ maxLength: 100 }}
                                                />
                                            )}
                                            disabled={!watchedToLocationFlag}
                                        />

                                    </Box>
                                    <Box sx={{ flex: '1 1 18%' }}>
                                        {renderZipCodeFieldCarrierInfo('carrierInfo.manualToAddress.zip', !watchedToLocationFlag)}
                                    </Box>
                                </Box>
                            </Paper>
                        </>}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3, alignItems: 'center' }}>
                            <Box sx={{ flex: '0 1 200px' }}>
                                <FormControlLabel
                                    control={<Controller name="carrierInfo.addPickupAccessorial" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                                    label={<Typography variant="body2">Add Pickup Accessorial</Typography>}
                                />
                            </Box>
                            <Box sx={{ flex: '0 1 150px' }}>
                                <FormControlLabel
                                    control={<Controller name="carrierInfo.pickupAlert" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                                    label={<Typography variant="body2">Pickup Alert</Typography>}
                                />
                            </Box>
                        </Box>

                    </Paper>

                    {/* pickup accessorials section  */}

                    {watchedAddPickupAccessorial && <Accordion sx={{ mt: 3, boxShadow: 'none', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                        <AccordionSummary
                            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                            sx={{ borderBottom: '1px solid #ccc', px: 0 }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">Pickup Accessorial Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => setPickupAccModal(true)} // Opens the Dialog
                                    sx={{ bgcolor: '#a22', textTransform: 'none' }}
                                >
                                    Add Pickup Accessorial
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
                                        {pickupAccFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.accessorialName}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeType}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeValue}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => {
                                                        setActiveAccType('Pickup');
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
                                                            setEditAccIndex(index);
                                                            setActiveNotesIndex(index);
                                                            setActiveAccType('Pickup');
                                                            setActionType('Edit');
                                                            setAddPickUpAccModal(true);
                                                        }}><Iconify icon="tabler:edit" /></IconButton>
                                                        <IconButton onClick={() => removePickupAcc(index)} size="small"><Iconify icon="material-symbols:delete-rounded" /></IconButton>
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
                        open={pickupAccModal}
                        onClose={() => {
                            setPickupAccModal(false);
                            setAddPickUpAccModal(false);
                            setActionType('');
                        }}
                        onSave={(selectedData) => replacePickupAcc(selectedData)}
                        setActionType={setActionType}
                        setAddAccModal={setAddPickUpAccModal}
                        addAccModal={addPickUpAccModal}
                        actionType={actionType}
                        MASTER_ACCESSORIALS={PICKUP_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setPICKUP_MASTER_Accessorials}
                    />
                    <AddAccessorialDialog
                        open={addPickUpAccModal}
                        onClose={() => {
                            setActionType('');
                            setEditAccIndex(null);
                            setAddPickUpAccModal(false);
                        }}
                        onSave={onSaveOfEdit}
                        setActionType={setActionType}
                        setAddAccModal={setAddPickUpAccModal}
                        addAccModal={addPickUpAccModal}
                        actionType={actionType}
                        accFields={pickupAccFields}
                        editAccIndex={editAccIndex}
                        editableObj={pickupAccFields[editAccIndex]}
                        appendAccFields={appendPickupAccFields}
                        MASTER_ACCESSORIALS={PICKUP_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setPICKUP_MASTER_Accessorials}
                    />

                    {/* pick alert details section */}
                    {watchedPickupAlert && <Accordion sx={{ mt: 3, boxShadow: 'none', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                        <AccordionSummary
                            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                            sx={{ borderBottom: '1px solid #ccc', px: 0 }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">
                                Pickup Alert Details
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ pt: 3 }}>
                            {/* --- INBOUND NOTES SECTION --- */}
                            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative', mb: 4 }}>
                                <Typography
                                    variant="caption"
                                    sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}
                                >
                                    Inbound Notes
                                </Typography>

                                {/* Chip Gallery: Renders dynamically from the form array */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {inboundNotes.map((note, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                bgcolor: '#e3f2fd',
                                                borderRadius: '16px',
                                                px: 1.5,
                                                py: 0.5,
                                                fontSize: '0.65rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                border: '1px solid #bbdefb',
                                            }}
                                            onClick={() => {
                                                setValue('carrierInfo.pickupAlertDetails.pickupNotes', note);
                                            }}
                                        >
                                            {note}
                                            {/* <Box
                            component="span"
                            onClick={() => {
                              setValue('carrierInfo.pickupAlertDetails.pickupNotes', note);
                            }}
                            sx={{
                              ml: 1,
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: '#666',
                              '&:hover': { color: '#a22' }
                            }}
                          >
                            &times;
                          </Box> */}
                                        </Box>
                                    ))}
                                    {/* Red "More" button style preserved from your UI design */}
                                    {/* {inboundNotes.length > 0 && (
                      <Box sx={{ bgcolor: '#a22', color: '#fff', borderRadius: '16px', px: 1.5, py: 0.5, fontSize: '0.65rem', cursor: 'pointer' }}>
                        More...
                      </Box>
                    )} */}
                                </Box>

                                <Controller
                                    name="carrierInfo.pickupAlertDetails.pickupNotes"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: watchedCarrierInfo.pickupAlert ? 'Pickup notes is required' : '',
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Notes"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            required={!!watchedCarrierInfo?.pickupAlert}
                                            error={!!error}
                                            helperText={error?.message || ""}
                                            inputProps={{ maxLength: 255 }}
                                        />
                                    )}
                                />

                            </Box>

                            {/* --- EMAIL INFO SECTION --- */}
                            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative' }}>
                                <Typography
                                    variant="caption"
                                    sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}
                                >
                                    Email Info
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Controller
                                            name="carrierInfo.pickupAlertDetails.primaryEmail"
                                            control={control}
                                            rules={{
                                                required: watchedCarrierInfo.pickupAlert ? 'Primary mail is required' : '',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Invalid email address"
                                                }
                                            }}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Primary Email"
                                                    variant="standard"
                                                    InputLabelProps={{ shrink: true }}
                                                    error={!!error}
                                                    helperText={error?.message}
                                                    required={watchedCarrierInfo.pickupAlert}
                                                    // Natively restricts entry to 255 characters max
                                                    inputProps={{ maxLength: 255 }}
                                                />
                                            )}
                                        />

                                    </Box>

                                    <Box sx={{ flex: 2 }}>
                                        <Controller
                                            name="carrierInfo.pickupAlertDetails.additionalEmail"
                                            control={control}
                                            rules={{
                                                validate: (value) => {
                                                    if (!value) return true;
                                                    // Split the comma-separated string back into an array to validate each item
                                                    const emails = value.split(',').map(e => e.trim()).filter(Boolean);
                                                    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                                    const allValid = emails.every(email => emailRegex.test(email));
                                                    return allValid || "One or more emails are invalid";
                                                }
                                            }}
                                            render={({ field: { onChange, value }, fieldState: { error } }) => {
                                                // Transform the comma-separated string from RHF state into an array for MUI Autocomplete
                                                const selectedEmailsArray = value ? value.split(',').map(e => e.trim()).filter(Boolean) : [];

                                                // Assuming your data array is available in a variable (e.g., watchedPickupAdditionalMails)
                                                // Extract just the email strings to match the Autocomplete's options format
                                                const emailOptions = (watchedPickupAdditionalMails || []).map(item => item.email);

                                                return (
                                                    <Autocomplete
                                                        multiple
                                                        freeSolo
                                                        options={emailOptions}
                                                        value={selectedEmailsArray}

                                                        // Triggers whenever options are clicked OR custom text is committed with Enter/Comma
                                                        onChange={(event, newValue) => {
                                                            // Flatten any pasted or comma-separated strings inside the array
                                                            const processedEmails = newValue
                                                                .flatMap(item => item.split(','))
                                                                .map(e => e.trim())
                                                                .filter(Boolean);

                                                            // Save back to React Hook Form as a comma-separated string
                                                            onChange(processedEmails.join(', '));
                                                        }}

                                                        // Handles local lookup matching
                                                        filterOptions={(options, params) => {
                                                            const filtered = options.filter(option =>
                                                                option.toLowerCase().includes(params.inputValue.toLowerCase())
                                                            );

                                                            const { inputValue } = params;
                                                            const isExisting = options.some((option) => inputValue === option);

                                                            // Suggest adding the custom typed email if it doesn't exist and isn't blank
                                                            if (inputValue !== '' && !isExisting) {
                                                                filtered.push(inputValue);
                                                            }

                                                            return filtered;
                                                        }}

                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                variant="standard"
                                                                label="Additional Email"
                                                                placeholder={selectedEmailsArray.length === 0 ? "Select or type emails..." : ""}
                                                                InputLabelProps={{ shrink: true }}
                                                                error={!!error}
                                                                helperText={error ? error.message : "Separate custom entries by pressing Enter"}
                                                                // SAFE FIX: Merge your maxLength constraint into Autocomplete's core properties object
                                                                inputProps={{
                                                                    ...params.inputProps,
                                                                    maxLength: 255
                                                                }}
                                                            />
                                                        )}
                                                        sx={{ mt: 2 }}
                                                    />
                                                );
                                            }}
                                        />


                                    </Box>
                                </Box>
                            </Box>

                        </AccordionDetails>
                    </Accordion>}



                    <Snackbar open={carrierTerminalSelectError} autoHideDuration={3000} onClose={() => setCarrierTerminalSelectError(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>

                        <Alert severity="information" variant="filled">Please select a carrier and terminal for {watchedLineHaulToggledAddress}.</Alert>

                    </Snackbar>

                </>}

            </Paper>
        </ErrorBoundary>
    );
};
export default ActiveStep3Pickup; 
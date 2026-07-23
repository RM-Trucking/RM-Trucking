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

const ActiveStep3Delivery = ({
    dispatch,
    navigate,
    location,
    control,
    errors,
    selectedRouting,
    carrierTerminalDropdown,
    isLoading,
    setValue,
    watchedLinehaulSelectRouting,
    isSelectingCarrierDeliveryRef,
    setSelectCarrierDeliverySearchValue,
    selectCarrierDeliverySearchValue,
    watchedSelectedLineHaulCarrier,
    watchedLinehaulToLocation,
    watchedDeliveryFromLocationFlag,
    watchedDeliveryToLocationType,
    isSelectingToCarrierDeliveryRef,
    setCarrierDeliverySearchValue,
    carrierDeliverySearchValue,
    watchedConsigneeName,
    watchedDeliveryAddAcc,
    deliveryAccFields,
    setActiveAccType,
    notesRefArray,
    notesRefArrayIndex,
    notesRefArrayObj,
    setOpenNotesDialogForShipmentAccs,
    setEditAccIndex,
    setActionType,
    setAddDeliveryAccModal,
    removeDeliveryAcc,
    deliveryAccModal,
    setDeliveryAccModal,
    replaceDeliveryAcc,
    addDeliveryAccModal,
    actionType,
    DELIVERY_MASTER_ACCESSORIALS,
    setDELIVERY_MASTER_Accessorials,
    onSaveOfEdit,
    appendDeliveryAccFields,
    watchedDeliveryAlert,
    deliveryLineHaulNotesArr,
    deliveryNotesArr,
    watchedDeliveryAdditionalMails,
    renderZipCodeFieldCarrierInfo,
    watchedDeliveryToLocationFlag,
    editAccIndex,
    watchedCarrierInfo,
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

            {/* delivery details section  */}
            <Accordion defaultExpanded sx={{ mt: 3, boxShadow: 'none', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />} sx={{ borderBottom: '1px solid #ccc', px: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Delivery Details</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 2 }}>
                    {(watchedLinehaulSelectRouting === 'linehaul_only' || selectedRouting === 'pickup_only' || selectedRouting === 'pickup_linehaul') && (watchedLinehaulSelectRouting !== 'linehaul_delivery' && selectedRouting !== 'pickup_linehaul_delivery') && <>
                        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.deliveryDetails.carrier"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                        <Autocomplete
                                            {...fieldProps} // Spreads ref and name from React Hook Form
                                            fullWidth
                                            options={carrierTerminalDropdown || []}

                                            // 1. RESOLVES KEY WARNINGS BY CREATING ISOLATED UNIQUE KEY NAMESPACES
                                            renderOption={(props, option, state) => {
                                                const uniqueKey = `delivery-carrier-${option.terminalId}-${option.carrierId}-${state.index}`;
                                                return (
                                                    <li {...props} key={uniqueKey}>
                                                        {option.carrierName && option.terminalName
                                                            ? `${option.carrierName} | ${option.terminalName}`
                                                            : ""}
                                                    </li>
                                                );
                                            }}

                                            // 2. GUARANTEES EXACT DROPDOWN SELECTION MATCHES FOR COMPOSITE ID STRINGS
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
                                                dispatch(getDeliveryAccessorials(newValue?.terminalEntityId));
                                                isSelectingCarrierDeliveryRef.current = true;

                                                // Pass the structural string back to React Hook Form state, matching your old MenuItem structure
                                                const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                onChange(formValue);
                                            }}

                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason !== "reset") {
                                                    setSelectCarrierDeliverySearchValue(newInputValue);
                                                    // if (!newInputValue || newInputValue.trim() === "") {
                                                    //   dispatch(searchCarriers(""));
                                                    // }
                                                }
                                            }}
                                            loading={isLoading}
                                            loadingText="Searching carriers..."
                                            noOptionsText={selectCarrierDeliverySearchValue ? "No carriers found" : "Type to search for carriers"}

                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={ref} // Keeps React Hook Form field focus tracking operational on error click
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
                                            sx={{ width: '100% !important' }}
                                            disabled={(watchedSelectedLineHaulCarrier?.split('-')[1] !== watchedLinehaulToLocation?.split('-')[1])}
                                        />
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.deliveryDetails.billNumber"
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
                            <Box sx={{ flex: '2 1 300px', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                {/* <Controller
                          name="carrierInfo.deliveryDetails.fromLocation"
                          control={control}
                          render={({ field }) => <TextField {...field} fullWidth label="From Location *" variant="standard" />}
                        /> */}
                                <Controller
                                    name="carrierInfo.deliveryDetails.manualFromLocation"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            sx={{ mb: 2.5, whiteSpace: 'nowrap' }}
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
                                    <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 255 }} />} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller
                                        name="carrierInfo.deliveryDetails.manualFromLocationDetails.line2"
                                        control={control}
                                        render={({ field }) => (
                                            <StyledTextField
                                                {...field}
                                                fullWidth
                                                label="Address Line 2"
                                                variant="standard"
                                                InputLabelProps={{ shrink: true }}
                                                disabled={!watchedDeliveryFromLocationFlag}
                                                inputProps={{ maxLength: 255 }}
                                            />
                                        )}
                                    />

                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 100 }} />} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 100 }} />} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', !watchedDeliveryFromLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3, alignItems: 'center' }}>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.deliveryDetails.toLocationType"
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
                                            {/* <MenuItem value="Carrier">
                                Carrier
                              </MenuItem> */}
                                            <MenuItem value="Consignee">
                                                Consignee
                                            </MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 200px' }}>
                                {(watchedDeliveryToLocationType === 'Carrier' || watchedDeliveryToLocationType === '') &&
                                    <Controller
                                        name="carrierInfo.deliveryDetails.toLocation"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                            <Autocomplete
                                                {...fieldProps} // Spreads ref and name from React Hook Form
                                                fullWidth
                                                options={carrierTerminalDropdown || []}

                                                // 1. PROVIDES TOTALLY UNIQUE KEYS PER LIST ITEM DOM NODE
                                                renderOption={(props, option, state) => {
                                                    // FIXED: Converted to a clean, single-line concatenation string to prevent Vite parsing crashes
                                                    const uniqueKey = "delivery-tolocation-" + option.terminalId + "-" + option.carrierId + "-" + state.index;
                                                    return (
                                                        <li {...props} key={uniqueKey}>
                                                            {option.carrierName && option.terminalName
                                                                ? option.carrierName + " | " + option.terminalName
                                                                : ""}
                                                        </li>
                                                    );
                                                }}

                                                // 2. EQUATES INTERNAL STATE STRINGS ACCURATELY WITH THE CHOSEN OBJECTS
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
                                                    isSelectingToCarrierDeliveryRef.current = true;

                                                    // Pass the structural string back to React Hook Form state, matching your old MenuItem structure
                                                    const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                                    onChange(formValue);
                                                }}

                                                onInputChange={(event, newInputValue, reason) => {
                                                    if (reason !== "reset") {
                                                        setCarrierDeliverySearchValue(newInputValue);
                                                        // if (!newInputValue || newInputValue.trim() === "") {
                                                        //   dispatch(searchCarriers(""));
                                                        // }
                                                    }
                                                }}
                                                loading={isLoading}
                                                loadingText="Searching carriers..."
                                                noOptionsText={carrierDeliverySearchValue ? "No carriers found" : "Type to search for carriers"}

                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        inputRef={ref} // Forwards focal references safely back to React Hook Form validation routines
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
                                {
                                    watchedDeliveryToLocationType === 'Consignee' && <Controller
                                        name="carrierInfo.toLocation"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field: { onChange, value, ...fieldProps } }) => (
                                            <TextField
                                                fullWidth
                                                variant="standard"
                                                label="To Location *"
                                                value={watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? ''}// Your hardcoded static value displayed to the user
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
                                    name="carrierInfo.deliveryDetails.manualToLocation"
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
                                    <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.deliveryDetails.manualToLocationDetails.zip', !watchedDeliveryToLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>


                        {/* ETA and Weight Section - Flexbox Layout */}
                        <Box sx={{ display: 'flex', gap: 4, mb: 4, mt: 2 }}>
                            {/* ETA Date */}
                            <Box sx={{ flex: 1 }}>
                                <Controller
                                    name="carrierInfo.deliveryDetails.etaDate"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            // 1. FIXED: If there is no value, return true instantly (No error is shown)
                                            if (!value || value === '') return true;

                                            const dateObj = dayjs(value);

                                            // 2. If it's a Dayjs object but not fully typed out yet, check if it's completely invalid
                                            if (dayjs.isDayjs(value) && !value.isValid()) {
                                                // If the user cleared the text box entirely, let it pass as valid
                                                return "Please enter a valid date";
                                            }

                                            if (!dateObj.isValid()) {
                                                return "Please enter a valid date";
                                            }

                                            // 3. Catches invalid partial years like 202 or 0202
                                            if (dateObj.year() < 1000) {
                                                return "Year is invalid";
                                            }

                                            return true;
                                        }
                                    }}
                                    render={({ field: { onChange, value, ...fieldParams }, fieldState: { error } }) => (
                                        <DatePicker
                                            {...fieldParams}
                                            // 4. FIXED: Do not force null on partial text inputs, allow the user to type out the year
                                            value={value ? dayjs(value) : null}
                                            onChange={(newValue) => {
                                                // 5. FIXED: If the field is manually wiped out cleanly, send null to the form state
                                                if (!newValue) {
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

                                                    onBeforeInput: (e) => {
                                                        const target = e.target;
                                                        const inputVal = target.value;
                                                        const insertedChar = e.data;

                                                        if (insertedChar === '0' && (!inputVal || inputVal.trim() === '')) {
                                                            e.preventDefault();
                                                            return;
                                                        }

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

                            {/* ETA time  */}
                            <Box sx={{ flex: 1 }}>
                                <Controller
                                    name="carrierInfo.deliveryDetails.etaTime"
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
                                                    // FIX: Targets the specific error state for delivery details time
                                                    // and suppresses layout red-lines on page load
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
                                    name="carrierInfo.deliveryDetails.pcs"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="Pcs"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            // 1. Sets a hard maximum numeric value of 10 digits
                                            inputProps={{
                                                max: 9999999999
                                            }}
                                            // 2. Blocks decimal points and scientific notation keys to force integers
                                            onKeyDown={(e) => {
                                                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            // 3. Crops pasted or scrolled inputs immediately if they exceed 10 digits
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
                                    name="carrierInfo.deliveryDetails.weight"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="Weight"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            // 1. Sets the hard maximum numeric limit for 8 whole digits and 2 decimals
                                            inputProps={{
                                                max: 99999999.99,
                                                step: "0.01"
                                            }}
                                            // 2. Prevents unexpected exponential or sign inputs
                                            onKeyDown={(e) => {
                                                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            // 3. Natively locks down the 10 total digits and 2-decimal maximum limit
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                // Matches up to 8 digits before the dot and up to 2 digits after the dot
                                                const isValidDecimal = /^\d{0,8}(\.\d{0,2})?$/.test(val);

                                                if (isValidDecimal || val === '') {
                                                    field.onChange(e);
                                                } else {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />

                            </Box>
                            {/* <Box sx={{ flex: 1.5 }}>
                      <Controller
                        name="carrierInfo.deliveryDetails.agent"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Agent"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Box> */}
                        </Box>
                    </>}

                    <Box display={'flex'} alignItems={'center'}>
                        <FormControlLabel
                            control={<Controller name="carrierInfo.deliveryDetails.deliveryAddAcc" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                            label={<Typography variant="body2">Add Delivery Accessorials</Typography>}
                        />
                        <Box sx={{ display: 'flex', gap: 4 }}>

                            <Controller
                                name="carrierInfo.lineHaul.airportTransfer"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        sx={{ mb: 0.5, whiteSpace: 'nowrap' }}
                                        control={<Checkbox {...field} checked={field.value} size="small" />}
                                        label={<Typography variant="body2">Airport Transfer</Typography>}
                                    />
                                )}
                            />

                        </Box>
                    </Box>
                    {/* BOTTOM OPTIONS: Horizontal Flexbox */}


                    {/* ACCESSORIALS: Flexbox for header */}
                    {watchedDeliveryAddAcc && <Accordion sx={{ mt: 3, boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary
                            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                            sx={{ borderBottom: '1px solid #ccc', px: 0 }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">Delivery Accessorial Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => setDeliveryAccModal(true)} // Opens the Dialog
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
                                        {deliveryAccFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.accessorialName}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeType}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeValue}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => {
                                                        setActiveAccType('Delivery');
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
                                                            setActiveAccType('Delivery');
                                                            setEditAccIndex(index);
                                                            setActionType('Edit');
                                                            setAddDeliveryAccModal(true);

                                                        }}><Iconify icon="tabler:edit" /></IconButton>
                                                        <IconButton onClick={() => {
                                                            const selectedObj = watchedCarrierInfo?.deliveryDetails?.deliveryAccessorials[index];
                                                            const targetId = selectedObj?.entityAccessorialId;
                                                            // If there is no valid ID, stop the function early
                                                            if (!targetId) return;
                                                            const updatedMasterList = DELIVERY_MASTER_ACCESSORIALS.map((item) => {
                                                                if (item.entityAccessorialId === targetId) {
                                                                    return {
                                                                        ...item,
                                                                        selected: false // Explicitly uncheck this item
                                                                    };
                                                                }
                                                                return item; // Leave all other items exactly as they are
                                                            });
                                                            // 4. Update the master accessorials state
                                                            setDELIVERY_MASTER_Accessorials(updatedMasterList);
                                                            removeDeliveryAcc(index);
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
                        open={deliveryAccModal}
                        onClose={() => {
                            setDeliveryAccModal(false);
                            setAddDeliveryAccModal(false);
                            setActionType('');
                        }}
                        onSave={(selectedData) => replaceDeliveryAcc(selectedData)}
                        setActionType={setActionType}
                        setAddAccModal={setAddDeliveryAccModal}
                        addAccModal={addDeliveryAccModal}
                        actionType={actionType}
                        MASTER_ACCESSORIALS={DELIVERY_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setDELIVERY_MASTER_Accessorials}
                        AccFields={deliveryAccFields}
                    />
                    <AddAccessorialDialog
                        open={addDeliveryAccModal}
                        onClose={() => {
                            setAddDeliveryAccModal(false);
                            setActionType('');
                            setEditAccIndex(null);
                        }}
                        onSave={onSaveOfEdit}
                        setActionType={setActionType}
                        setAddAccModal={setAddDeliveryAccModal}
                        addAccModal={addDeliveryAccModal}
                        actionType={actionType}
                        accFields={deliveryAccFields}
                        editableObj={deliveryAccFields[editAccIndex]}
                        appendAccFields={appendDeliveryAccFields}
                        MASTER_ACCESSORIALS={DELIVERY_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setDELIVERY_MASTER_Accessorials}
                    />

                    <Box sx={{ flex: '0 1 200px', mb: 3, mt: 3 }}>
                        <FormControlLabel
                            control={<Controller name="carrierInfo.deliveryDetails.deliveryAlert" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />} />}
                            label={<Typography variant="body2">Delivery Alert </Typography>}
                        />
                    </Box>
                    {watchedDeliveryAlert && <>
                        {/* LINE-HAUL NOTES: Flexbox for chip gallery */}
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative', mb: 3 }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Line-haul Notes
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {deliveryLineHaulNotesArr.map((note, idx) => (
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
                                            setValue('carrierInfo.deliveryDetails.lineHaulNotes', note);
                                        }}
                                    >
                                        {note}
                                        {/* <Box
                            component="span"
                            onClick={() => {
                              const updatedNotes = deliveryLineHaulNotes.filter((_, i) => i !== idx);
                              setValue('carrierInfo.deliveryDetails.lineHaulNotes', updatedNotes);
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
                                name="carrierInfo.deliveryDetails.lineHaulNotes"
                                control={control}
                                defaultValue=""
                                rules={{
                                    required: watchedDeliveryAlert ? 'Line-haul notes is required' : '',
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Notes"
                                        variant="standard"
                                        placeholder="Type and press Enter"
                                        InputLabelProps={{ shrink: true }}
                                        required={watchedDeliveryAlert}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                        </Box>

                        {/* delivery notes  */}
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative', mb: 3 }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Delivery Notes
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {deliveryNotesArr.map((note, idx) => (
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
                                            setValue('carrierInfo.deliveryDetails.deliveryNotes', note);
                                        }}
                                    >
                                        {note}
                                        {/* <Box
                            component="span"
                            onClick={() => {
                              const updatedNotes = deliveryNotes.filter((_, i) => i !== idx);
                              setValue('carrierInfo.deliveryDetails.deliveryNotes', updatedNotes);
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
                                name="carrierInfo.deliveryDetails.deliveryNotes"
                                control={control}
                                defaultValue=""
                                rules={{
                                    required: watchedDeliveryAlert ? 'Delivery notes is required' : '',
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Notes"
                                        variant="standard"
                                        placeholder="Type and press Enter"
                                        InputLabelProps={{ shrink: true }}
                                        required={watchedDeliveryAlert}
                                        inputProps={{ maxLength: 255 }}
                                    />
                                )}
                            />
                        </Box>

                        {/* --- EMAIL INFO SECTION --- */}
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, pt: 3, position: 'relative', mb: 3 }}>
                            <Typography
                                variant="caption"
                                sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}
                            >
                                Email Info
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Controller
                                        name="carrierInfo.deliveryDetails.primaryEmail"
                                        control={control}
                                        rules={{
                                            required: watchedDeliveryAlert ? 'Primary email is required' : '',
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
                                                required={watchedDeliveryAlert}
                                                // Natively restricts entry to 255 characters max
                                                inputProps={{ maxLength: 255 }}
                                            />
                                        )}
                                    />

                                </Box>

                                <Box sx={{ flex: 2 }}>
                                    <Controller
                                        name="carrierInfo.deliveryDetails.additionalEmail"
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
                                            // Transform the comma-separated string from form state into an array for MUI Autocomplete
                                            const selectedEmailsArray = value ? value.split(',').map(e => e.trim()).filter(Boolean) : [];

                                            // Map your personnel array down to a flat array of email strings
                                            // Replace 'deliveryDropdownEmails' with your actual data source variable name
                                            const emailOptions = (watchedDeliveryAdditionalMails || []).map(item => item.email);

                                            return (
                                                <Autocomplete
                                                    multiple
                                                    freeSolo
                                                    options={emailOptions}
                                                    value={selectedEmailsArray}

                                                    // Triggers whenever options are clicked OR custom text is committed with Enter
                                                    onChange={(event, newValue) => {
                                                        // Flatten any typed, comma-separated strings inside the array
                                                        const processedEmails = newValue
                                                            .flatMap(item => item.split(','))
                                                            .map(e => e.trim())
                                                            .filter(Boolean);

                                                        // Save back to React Hook Form as a clean comma-separated string
                                                        onChange(processedEmails.join(', '));
                                                    }}

                                                    // Handles matching local choices and supporting custom raw text inputs
                                                    filterOptions={(options, params) => {
                                                        const filtered = options.filter(option =>
                                                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                                                        );

                                                        const { inputValue } = params;
                                                        const isExisting = options.some((option) => inputValue === option);

                                                        // Suggest adding the custom typed email if it doesn't exist and isn't empty
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
                    </>}
                </AccordionDetails>
            </Accordion>
        </ErrorBoundary>
    );
};
export default ActiveStep3Delivery; 
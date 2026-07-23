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
import ItemsSection from './ItemsSection';
import CommoditiesList from './CommoditiesList';


const ActiveStep2 = ({
    control,
    errors,
    dispatch,
    navigate,
    location,
    setValue,
    huFields,
    removeHU,
    watchedHU,
    getValues,
    appendHU,
    setErrorVisible,
    isHazmatSelected,
    setHazmatModal,
}) => {
    const logError = (e, i) => {
        // Use an error reporting service here
        console.log('error', i);
    };
    const handleAddHU = () => {
        const units = getValues('handlingUnits');
        const lastUnit = units[units.length - 1];
        // Validation: Check if the required fields in the last unit are filled
        const isFilled =
            lastUnit.uom &&
            lastUnit.unitsCount;

        if (isFilled) {
            appendHU({
                uom: '',
                unitsCount: '',
                unit: lastUnit.unit,
                length: '',
                width: '',
                height: '',
                weight: '',
                weightUnit: lastUnit.weightUnit,
                class: '',
                freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
                items: [{
                    pieces: '',
                    piecesUom: '',
                    description: '',
                    hazmatInfo: false,
                    hazmatData: null
                }]
            });
        } else {
            // Show the error snackbar if fields are missing
            setErrorVisible(true);
        }
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
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 4, borderBottom: ' 1px solid rgba(143, 143, 143, 1)' }}>
                    Commodities Details
                </Typography>

                {huFields.map((hu, huIdx) => (
                    <Paper key={hu.id} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2, position: 'relative' }}>
                        {/* Label on Border */}
                        <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                            Handling Unit {huIdx + 1}
                        </Typography>



                        {/* Clear/Remove Logic */}
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            {huIdx === 0 ? (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setValue(`handlingUnits.0`, {
                                        uom: '', unitsCount: '', unit: 'in', length: '', width: '', height: '', weight: '', weightUnit: 'lbs', class: '',
                                        items: [{ pieces: '', piecesUom: '', description: '', hazmatInfo: false }]
                                    })}
                                    sx={{ height: 20, fontSize: '0.65rem', color: '#000', borderColor: '#000', textTransform: 'none' }}
                                >
                                    Clear
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => removeHU(huIdx)}
                                    sx={{ bgcolor: '#A22', height: 20, fontSize: '0.65rem', textTransform: 'none' }}
                                >
                                    Remove
                                </Button>
                            )}
                        </Box>



                        {/* Handling Unit Dimensions Row */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, pb: 2.5 }}>
                            <Box sx={{ flex: '1 1 120px' }}>
                                <Controller
                                    name={`handlingUnits.${huIdx}.uom`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Handling Units UOM *"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            SelectProps={{
                                                displayEmpty: true,
                                                // FIXED: Displays the grayed-out placeholder when the value is empty
                                                renderValue: (selected) => {
                                                    if (!selected || selected === "") {
                                                        return <span style={{ color: '#aaa', fontSize: '12px' }}>Select the Handling Units</span>;
                                                    }
                                                    return selected;
                                                },
                                                MenuProps: {
                                                    getContentAnchorEl: null,
                                                    disableScrollLock: true,
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    transformOrigin: {
                                                        vertical: 'top',
                                                        horizontal: 'left',
                                                    },
                                                    PaperProps: {
                                                        sx: {
                                                            marginTop: '4px',
                                                            maxHeight: 300,
                                                            maxWidth: 300
                                                        }
                                                    }
                                                },
                                            }}
                                        >
                                            {/* FIXED: Added a disabled/hidden placeholder menu option */}
                                            <MenuItem value="" disabled sx={{ display: 'none' }}>
                                                Select the Handling Units
                                            </MenuItem>

                                            {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map(u => (
                                                <MenuItem key={u} value={u}>{u}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: '1 1 100px' }}>
                                <Controller
                                    name={`handlingUnits.${huIdx}.unitsCount`}
                                    control={control}
                                    rules={{
                                        required: "Handling units count is required",
                                        pattern: {
                                            value: /^[0-9]+$/,
                                            message: "Please enter a valid number"
                                        },
                                        maxLength: {
                                            value: 10,
                                            message: "Handling units cannot exceed 10 digits"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            onChange={(e) => {
                                                const cleanValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                field.onChange(cleanValue);
                                            }}
                                            fullWidth
                                            label="Handling Units *"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{
                                                inputMode: 'numeric',
                                                pattern: '[0-9]*',
                                                maxLength: 10
                                            }}
                                            error={!!errors?.handlingUnits?.[huIdx]?.unitsCount}
                                            helperText={errors?.handlingUnits?.[huIdx]?.unitsCount?.message || ""}
                                            // FIX: Forces error text to absolute position to stop layout shifting
                                            FormHelperTextProps={{
                                                sx: { position: 'absolute', bottom: -20, left: 0, whiteSpace: 'nowrap' }
                                            }}
                                        />
                                    )}
                                />

                            </Box>

                            <Box sx={{ flex: '1 1 20px' }}>
                                <Controller
                                    name={`handlingUnits.${huIdx}.unit`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Unit *"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            SelectProps={{
                                                displayEmpty: true,
                                                MenuProps: {
                                                    getContentAnchorEl: null,
                                                    disableScrollLock: true,
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    transformOrigin: {
                                                        vertical: 'top',
                                                        horizontal: 'left',
                                                    },
                                                    PaperProps: {
                                                        sx: {
                                                            marginTop: '4px',
                                                            maxHeight: 300,
                                                            maxWidth: 100
                                                        }
                                                    }
                                                },
                                            }}
                                        >
                                            <MenuItem key='in' value={'in'}>in</MenuItem>
                                            <MenuItem key='cm' value={'cm'}>cm</MenuItem>
                                        </TextField>
                                    )}
                                />

                            </Box>

                            {['Length', 'Width', 'Height'].map((dim) => {
                                const fieldName = dim.toLowerCase(); // matches 'length', 'width', 'height'
                                const fieldError = errors?.handlingUnits?.[huIdx]?.[fieldName];

                                return (
                                    <Box key={dim} sx={{ flex: '1 1 80px' }}>
                                        <Box display={'flex'} alignItems={'flex-end'}>
                                            <Controller
                                                name={`handlingUnits.${huIdx}.${fieldName}`}
                                                control={control}
                                                // 1. Validates that the final submitted string is a valid integer or decimal
                                                rules={{
                                                    pattern: {
                                                        value: /^\d*\.?\d*$/,
                                                        message: "Invalid number"
                                                    }
                                                }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        // 2. Instantly strips out alphabets and symbols on keypress
                                                        onChange={(e) => {
                                                            let cleanValue = e.target.value;

                                                            // Allow only digits and a single decimal point
                                                            cleanValue = cleanValue.replace(/[^0-9.]/g, '');

                                                            // Prevent entering multiple decimal points (e.g., 10..5 becomes 10.5)
                                                            const splitValue = cleanValue.split('.');
                                                            if (splitValue.length > 2) {
                                                                cleanValue = `${splitValue[0]}.${splitValue.slice(1).join('')}`;
                                                            }

                                                            field.onChange(cleanValue);
                                                        }}
                                                        fullWidth
                                                        label={`Handling ${dim}`}
                                                        variant="standard"
                                                        InputLabelProps={{ shrink: true }}
                                                        // 3. Hints mobile browsers to show a decimal-friendly numeric pad
                                                        inputProps={{ inputMode: 'decimal' }}
                                                        // 4. Connects validation state to the UI layout
                                                        error={!!fieldError}
                                                        helperText={fieldError?.message || ""}
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}

                            <Box sx={{ flex: '1 1 70px' }}>

                                <Controller name={`handlingUnits.${huIdx}.weight`} control={control} render={({ field }) => (
                                    <TextField {...field} fullWidth label="Weight" variant="standard" InputLabelProps={{ shrink: true }} />
                                )} />

                            </Box>

                            <Box display={'flex'} alignItems={'flex-end'} sx={{ flex: '1 1 20px' }}>
                                <Controller
                                    name={`handlingUnits.${huIdx}.weightUnit`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label=""
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            SelectProps={{
                                                displayEmpty: true,
                                                MenuProps: {
                                                    getContentAnchorEl: null,
                                                    disableScrollLock: true,
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    transformOrigin: {
                                                        vertical: 'top',
                                                        horizontal: 'left',
                                                    },
                                                    PaperProps: {
                                                        sx: {
                                                            marginTop: '4px',
                                                            maxHeight: 300,
                                                            maxWidth: 100
                                                        }
                                                    }
                                                },
                                            }}
                                        >
                                            <MenuItem key='lbs' value={'lbs'}>lbs</MenuItem>
                                            <MenuItem key='kgs' value={'kgs'}>kgs</MenuItem>
                                        </TextField>
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: '1 1 120px' }}>
                                <Controller
                                    name={`handlingUnits.${huIdx}.class`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Class"
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            SelectProps={{
                                                displayEmpty: true,
                                                // This ensures the input only shows the value, not the "(Recommended)" text
                                                renderValue: (selected) => selected || <em style={{ fontSize: '12px' }}>Select Class</em>,
                                                MenuProps: {
                                                    getContentAnchorEl: null,
                                                    disableScrollLock: true,
                                                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                                                    PaperProps: {
                                                        sx: { marginTop: '4px', maxHeight: 200, maxWidth: 350 }
                                                    }
                                                },
                                                inputProps: { maxLength: 255 },
                                            }}
                                        >
                                            {watchedHU[huIdx]?.freightClass?.length > 0 ? (
                                                watchedHU[huIdx]?.freightClass?.map((fc) => {
                                                    const isCalculated = fc === watchedHU[huIdx]?.calculatedFC;

                                                    return (
                                                        <MenuItem
                                                            key={fc}
                                                            value={fc}
                                                            sx={{
                                                                backgroundColor: isCalculated ? '#e3f2fd !important' : 'transparent',
                                                                fontWeight: isCalculated ? 'bold' : 'normal',
                                                                borderLeft: isCalculated ? '4px solid #1976d2' : 'none',
                                                                '&:hover': { backgroundColor: isCalculated ? '#bbdefb !important' : '' }
                                                            }}
                                                        >
                                                            {/* This text is what appears in the DROPDOWN list */}
                                                            {fc} {isCalculated && "(Recommended)"}
                                                        </MenuItem>
                                                    );
                                                })
                                            ) : (
                                                <MenuItem value="" disabled>No freight classes available</MenuItem>
                                            )}
                                        </TextField>
                                    )}
                                />

                            </Box>
                        </Box>



                        {/* Dynamic Items List */}
                        <ItemsSection
                            huIndex={huIdx}
                            control={control}
                            watchedHU={watchedHU}
                            openHazmat={(hu, itm) => setHazmatModal({ open: true, huIdx: hu, itemIdx: itm })}
                            setValue={setValue}
                        />
                    </Paper>
                ))}

                {/* Add Handling Unit Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2 }}>
                    <Button
                        variant="contained"
                        onClick={handleAddHU}
                        sx={{ bgcolor: '#a22', fontSize: '0.75rem', textTransform: 'none' }}
                    >
                        Add Handling Unit
                    </Button>
                </Box>

                {/* Emergency Contact: Conditional Render */}
                {isHazmatSelected && (
                    <Paper variant="outlined" sx={{ p: 3, mt: 4, borderRadius: 2, position: 'relative' }}>
                        <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                            Emergency Contact
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                            <Box sx={{ flex: '1 1 30%' }}>
                                <Controller
                                    name="emergencyContactName"
                                    control={control}
                                    rules={{
                                        required: 'Contact Name is required',
                                        // 1. FIXED: Schema validation check blocking data payloads past 100 characters
                                        maxLength: {
                                            value: 100,
                                            message: 'Contact Name cannot exceed 100 characters'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            onChange={(e) => {
                                                // 2. FIXED: Truncates pasted text immediately to a 100 character maximum limit
                                                const val = e.target.value;
                                                field.onChange(val.slice(0, 100));
                                            }}
                                            fullWidth
                                            label="Contact Name"
                                            variant="standard"
                                            required={isHazmatSelected}
                                            // 3. FIXED: Attaches the error indicator and string feedback message dynamically
                                            error={!!error}
                                            helperText={error ? error.message : ''}
                                            // 4. FIXED: Hard browser barrier blocking physical keyboard strokes at character 100
                                            inputProps={{
                                                maxLength: 100
                                            }}
                                        />
                                    )}
                                />

                            </Box>
                            <Box sx={{ flex: '1 1 30%' }}>

                                <Controller

                                    name={'emergencyContactPhone'}

                                    control={control}

                                    rules={{
                                        required: 'Phone number is required',
                                        maxLength: {
                                            value: 20,
                                            message: 'Phone number cannot exceed 20 characters'
                                        },
                                        validate: (value) => {
                                            if (!value) return true; // Allow empty

                                            // 1. Check for all zeros (strips formatting and checks if only 0s remain)
                                            const digitsOnly = value.replace(/\D/g, '');
                                            const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);

                                            if (isAllZeros) return 'Phone number cannot be all zeros';

                                            // 2. Format validation (Optional: adjust regex if you want a specific pattern for 20 chars)
                                            // If you just want to allow any 20 chars, the maxLength rule above handles it.

                                            return true;
                                        }
                                    }}

                                    render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (

                                        <TextField

                                            {...field}

                                            value={value || ''}

                                            variant="standard"

                                            fullWidth

                                            label={`Phone Number`}

                                            inputProps={{ maxLength: 20 }}

                                            error={!!error}

                                            helperText={error ? error.message : ''}

                                            onChange={(e) => {
                                                const val = e.target.value;

                                                // 1. Prevent initial empty space
                                                if (val.startsWith(' ')) return;

                                                // 2. Format and enforce 20-character string limit
                                                const formattedValue = formatPhoneNumber(val).slice(0, 20);
                                                onChange(formattedValue);
                                            }}

                                            required={isHazmatSelected}

                                        />

                                    )}

                                />
                            </Box>
                        </Box>
                    </Paper>
                )}

                {/* Commodities List Table */}
                <CommoditiesList watchedHU={watchedHU} />
            </Paper>
        </ErrorBoundary>
    );
};
export default ActiveStep2; 
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

const AddAccessorialDialog = ({ open, onClose, onSave, actionType, setActionType, setAddAccModal, addAccModal, accFields, editAccIndex, editableObj, appendAccFields, MASTER_ACCESSORIALS,
    setMASTER_Accessorials }) => {
    const isLoading = useSelector((state) => state?.shipmentdata?.isLoading);

    const accessorialDropdown = useSelector((state) => state?.shipmentdata?.accessorialDropdown);

    const [chargeValue, setChargeValue] = useState(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues, reset
    } = useForm({
        values: {
            accessorial: editableObj?.accessorialName || '',
            chargesType: editableObj?.chargeType || '',
            charges: editableObj?.chargeValue || '',
            notes: editableObj?.notes || '',
        }
    });

    useEffect(() => {
        // GUARD: If we're in Edit mode but the object is missing, STOP.
        // This prevents the "undefined" flicker from clearing your form.
        if (actionType === 'Edit' && editableObj) {
            if (!editableObj || !editableObj.accessorial) return;

            reset({
                accessorial: editableObj?.accessorialName,
                chargesType: editableObj?.chargeType,
                charges: editableObj?.chargeValue,
            });
        }
    }, [editableObj]);

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        if (actionType === 'Add') {
            const [accessorialId, accessorialName] = data?.accessorial?.split('-');
            setMASTER_Accessorials((prev) => [
                ...prev,
                {
                    accessorialId: accessorialId,
                    accessorialName: accessorialName,
                    chargeType: data.chargesType,
                    chargeValue: data.charges,
                    notes: [{
                        noteMessageId: Date.now(),
                        messageText: data.notes,
                    }]
                }
            ]);
            reset({ accessorial: null, chargesType: '', charges: '', notes: '' });
            onClose();
        }
        else if (actionType === 'Edit') {
            const dataObj = {
                accessorialId: editableObj.accessorialId,
                accessorialName: editableObj.accessorialName,
                chargeType: data.chargesType,
                chargeValue: data.charges,
            }
            onSave(dataObj);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{
            '& .MuiDialog-paper': { // Target the paper class
                width: '1545px',
                height: 'auto',
                maxHeight: 'none',
                maxWidth: 'none',
            }
        }}>
            <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Accessorial Details</DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <>
                    {/* form  */}
                    <Box component="form" sx={{ pt: 2, pb: 2 }}>
                        <Stack spacing={4} sx={{ p: 3 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                <Controller
                                    name="accessorial"
                                    control={control}
                                    rules={{
                                        required: 'Accessorial is required',
                                        maxLength: {
                                            value: 255,
                                            message: 'Accessorial cannot exceed 255 characters'
                                        },
                                    }}
                                    render={({ field: { value, onChange, onBlur, ref } }) => (
                                        <StyledTextField
                                            select
                                            label="Accessorial"
                                            variant="standard"
                                            fullWidth
                                            required
                                            value={value ?? ''}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            inputRef={ref}
                                            sx={{
                                                width: '25%',
                                            }}
                                            error={!!errors.accessorial}
                                            helperText={errors.accessorial?.message}
                                            disabled={actionType === 'Edit' || actionType === 'View'}
                                            SelectProps={{
                                                displayEmpty: true,
                                                // Custom rendering to fallback to the name segment of your value string
                                                renderValue: (selectedValue) => {
                                                    if (!selectedValue) return <em>Select Accessorial</em>;

                                                    // Checks if the active value exists in the current dropdown list
                                                    const itemExists = accessorialDropdown?.some(
                                                        (data) => `${data.accessorialId}-${data.accessorialName}` === selectedValue
                                                    );

                                                    // If it exists, let MUI handle it naturally. If missing, parse and show the text part.
                                                    if (itemExists) {
                                                        return selectedValue.split('-')[1] || selectedValue;
                                                    }

                                                    // Fallback: Extracts "Name" out of "Id-Name" format when dropdown is empty
                                                    return selectedValue.split('-')[1] || selectedValue;
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
                                                inputProps: { maxLength: 255 },
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            {accessorialDropdown && accessorialDropdown.length > 0 ? (
                                                accessorialDropdown.map((data, index) => (
                                                    <MenuItem key={`${data.accessorialId}-${index}`} value={`${data.accessorialId}-${data.accessorialName}`}>
                                                        {data.accessorialName}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled value="">
                                                    <em>No accessorials available.</em>
                                                </MenuItem>
                                            )}
                                        </StyledTextField>
                                    )}
                                />


                                <Controller
                                    name="chargesType"
                                    control={control}
                                    rules={{
                                        required: 'Charges Type is required',
                                        maxLength: {
                                            value: 50,
                                            message: 'Charges Type cannot exceed 50 characters'
                                        },
                                    }}
                                    render={({ field }) => (
                                        <StyledTextField
                                            {...field}
                                            select
                                            label="Charges Type"
                                            variant="standard" fullWidth required
                                            sx={{
                                                width: '25%',
                                            }}
                                            error={!!errors.chargesType} helperText={errors.chargesType?.message}
                                            SelectProps={{
                                                inputProps: { maxLength: 50 }
                                            }}
                                            disabled={actionType === 'View'}
                                        >
                                            <MenuItem value="HOURLY">Hourly</MenuItem>
                                            <MenuItem value="FLAT_RATE">Flat Rate</MenuItem>
                                            <MenuItem value="PER_POUND">Per Pound</MenuItem>
                                        </StyledTextField>
                                    )}
                                />
                                <Controller
                                    name="charges"
                                    control={control}
                                    rules={{
                                        required: 'Charges is required',
                                        min: {
                                            value: 0,
                                            message: 'Value cannot be below 0'
                                        },
                                        pattern: {
                                            // Regex for decimal(12,2): up to 10 digits before dot, optional dot, up to 2 after
                                            value: /^\d{1,10}(\.\d{0,2})?$/,
                                            message: 'Invalid format (max 10 digits before and 2 after decimal)'
                                        },
                                        validate: (value) => {
                                            if (value && value.toString().length > 13) return 'Total length exceeded';
                                            return true;
                                        }
                                    }}
                                    render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                        <StyledTextField
                                            {...field}
                                            value={value || ''}
                                            label="Charges"
                                            // Use type="text" to gain better control over formatting and maxLength
                                            type="text"
                                            variant="standard"
                                            fullWidth
                                            required
                                            sx={{ width: '25%' }}
                                            error={!!error}
                                            helperText={error?.message}
                                            // 13 characters allows for 10 digits + 1 dot + 2 decimal digits
                                            inputProps={{ maxLength: 13 }}
                                            onChange={(e) => {
                                                let val = e.target.value;

                                                // 1. Prevent initial empty space
                                                if (val.startsWith(' ')) return;

                                                // 2. Allow only numbers and a single decimal point
                                                val = val.replace(/[^0-9.]/g, '');

                                                // 3. Prevent multiple decimal points
                                                const parts = val.split('.');
                                                if (parts.length > 2) return;

                                                // 4. Enforce 2 decimal places restriction while typing
                                                if (parts[1] && parts[1].length > 2) return;

                                                // 5. Enforce 10 digit limit for the integer part (before decimal)
                                                if (parts[0] && parts[0].length > 10) return;

                                                onChange(val);
                                                if (setChargeValue) setChargeValue(val);
                                            }}
                                            disabled={actionType === 'View'}
                                        />
                                    )}
                                />
                                {actionType === 'Add' && <Controller
                                    name="notes"
                                    control={control}
                                    rules={{
                                        required: parseInt(chargeValue, 10) === 0 ? true : false,
                                        maxLength: {
                                            value: 255,
                                            message: 'Notes cannot exceed 255 characters'
                                        },
                                        validate: (value) => !value || value.trim().length > 0 || 'Notes cannot be only spaces'
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <StyledTextField
                                            {...field}
                                            label={`Notes`}
                                            required={parseInt(chargeValue, 10) === 0 ? true : false}
                                            variant="standard" fullWidth
                                            sx={{
                                                width: '25%',
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
                                            error={!!error}
                                            inputProps={{ maxLength: 255 }}
                                            disabled={actionType === 'View'}
                                        />
                                    )}
                                />}
                            </Stack>
                        </Stack>
                        {<Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    reset({ accessorial: null, chargesType: '', charges: '', notes: '' });
                                    onClose();
                                }}
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

                            {(actionType === 'Add' || actionType === 'Edit') && <Box>
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
                                    {actionType === 'Add' ? 'Add' : 'Edit'}
                                </Button>
                                }
                                {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                            </Box>}
                        </Stack>}
                    </Box>
                </>
            </DialogContent>
        </Dialog>
    );
};

export default AddAccessorialDialog; 
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


const commonBtnStyle = {

  height: '24px',

  fontWeight: 600,

  textTransform: 'none',

  borderRadius: '4px',

  boxShadow: 'none',

  px: 2,

  fontSize: '0.8rem',

};
// customer Rate pop up dialog box
const CustomerRateDialog = ({ open, onClose, getValues, setValue, control, totals, customerRateAccFields, appendCustomerRateAccFields, replaceCustomerRateAccFields, watchedHU, masterAccessorials }) => {
  const [editInputIndex, setEditInputIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [isRateEditing, setIsRateEditing] = useState(false);
  const [isFuelSurchargeEditing, setIsFuelSurchargeEditing] = useState(false);
  const [addFlag, setAddFlag] = useState(false);
  const [spotRateFlag, setSpotRateFlag] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  const [invoiceApprovalModal, setInvoiceApprovalModal] = useState(false);


  const addAccessorial = () => {
    const selectedObj = getValues('customerRate.selectedAccToAdd');
    const exists = getValues('customerRate.customerAccessorials').some(item => item.entityAccessorialId === selectedObj.entityAccessorialId);
    if (!exists) {
      appendCustomerRateAccFields({
        ...selectedObj,
        isManual: false,
        apiCharges: selectedObj.chargeValue,
        input: (selectedObj.chargeType.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : '',
      });
      setErrorVisible(false);
    } else {
      setErrorVisible(true);
    }
    setAddFlag(false);
    setValue('customerRate.selectedAccToAdd', {});
  }

  useEffect(() => {
    if (!spotRateFlag) {
      setValue('customerRate.rate', getValues('customerRate.apiRate'));
    }
  }, [spotRateFlag])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{
      '& .MuiDialog-paper': { // Target the paper class
        width: '1545px',
        height: '500px',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Customer Rate</DialogTitle>
      <DialogContent sx={{ p: 3, pb: 0 }}>
        <Box>

          <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
            {/* Header Row */}
            <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
              <Box sx={{ display: 'flex', p: 1, alignItems: 'center', gap: 1, flex: 3.5, fontWeight: 'bold', justifyContent: 'space-between' }}>
                <Typography variant="normal" fontSize={'12px'}>Charges</Typography>
              </Box>
              <Box sx={{ display: 'flex', flex: 1.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Multiplication Factor</Typography></Box>
              <Box sx={{ display: 'flex', flex: 2.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Rates ($)</Typography></Box>
              <Box sx={{ display: 'flex', flex: 1.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Total Rates ($)</Typography></Box>
            </Box>
            {/* state rate Rates Array (e.g., from API or predefined) */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', }}>
              <Box sx={{ flex: 3.5, p: 1 }}>
                <Typography variant="body2">Rate</Typography>
              </Box>
              <Box sx={{
                flex: 1.5, p: 1, borderLeft: '1px solid #ccc',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <Typography variant="body2">-</Typography>
              </Box>
              <Box sx={{
                flex: 2.5, p: 1, borderLeft: '1px solid #ccc',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <Controller
                  name={'customerRate.rate'}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number" // Forces numeric keyboard and behavior
                      disabled={!isRateEditing}
                      variant="outlined"
                      // 1. Informs browsers that 2 decimal places are expected with a hard max cap
                      inputProps={{
                        max: 9999999999999999.99,
                        step: "0.01"
                      }}
                      // 2. Prevents exponential 'e' notation or sign characters from breaking the field length
                      onKeyDown={(e) => {
                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                      }}
                      // 3. Intercepts the entry to guarantee it adheres perfectly to database (18,2) boundaries
                      onChange={(e) => {
                        const val = e.target.value;

                        // Limits the integer part to 16 digits and decimal part to 2 digits max
                        const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val);

                        if (isValidDecimal || val === '') {
                          field.onChange(e);
                        } else {
                          e.preventDefault();
                        }
                      }}
                      sx={{
                        bgcolor: isRateEditing ? '#e3f2fd' : '#fff',
                        '& .MuiOutlinedInput-input': { p: '4px 8px' },
                        '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' }
                      }}
                    />
                  )}
                />


                {/* Toggle between Edit and Save Icons */}
                {isRateEditing ? (
                  <IconButton
                    size="small"
                    sx={{ color: 'success.main' }}
                    onClick={() => {
                      setIsRateEditing(false); // Exit edit mode
                    }}
                  >
                    <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                  </IconButton>
                ) : (
                  <FormControlLabel
                    label="Spot Rate"
                    control={
                      <Checkbox
                        size="small"
                        checked={spotRateFlag}
                        onChange={(event) => { setIsRateEditing(event.target.checked); setSpotRateFlag(event.target.checked); }}
                        sx={{
                          color: '#a22',
                          '&.Mui-checked': {
                            color: '#a22', // Keeps the color consistent when checked
                          },
                        }}
                      />
                    }
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem', // Adjust font size to match row scale if needed
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
                <Typography variant="body2">{getValues(`customerRate.rate`)}</Typography>
              </Box>
            </Box>
            {/* state Fuel surcharge Rates Array (e.g., from API or predefined) */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', }}>
              <Box sx={{ flex: 3.5, p: 1 }}>
                <Typography variant="body2">Fuel Surcharge (35% Charge)</Typography>
              </Box>
              <Box sx={{
                flex: 1.5, p: 1, borderLeft: '1px solid #ccc',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <Typography variant="body2">-</Typography>
              </Box>
              <Box sx={{
                flex: 2.5, p: 1, borderLeft: '1px solid #ccc',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <Controller
                  name={'customerRate.fuelSurchargeRate'}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number" // Enforces native numeric browser behavior
                      disabled={!isFuelSurchargeEditing}
                      variant="outlined"
                      // 1. Sets a hard maximum limit for 18 total digits (16 whole, 2 fractional)
                      inputProps={{
                        max: 9999999999999999.99,
                        step: "0.01"
                      }}
                      // 2. Disables exponential inputs or operational signs that disrupt character counts
                      onKeyDown={(e) => {
                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                      }}
                      // 3. Implements the standard regex guard before triggering React Hook Form state updates
                      onChange={(e) => {
                        const val = e.target.value;

                        // Match up to 16 digits before the dot and up to 2 digits after the dot
                        const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val);

                        if (isValidDecimal || val === '') {
                          field.onChange(e);
                        } else {
                          e.preventDefault();
                        }
                      }}
                      sx={{
                        bgcolor: isFuelSurchargeEditing ? '#e3f2fd' : '#fff',
                        '& .MuiOutlinedInput-input': { p: '4px 8px' },
                        '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' }
                      }}
                    />
                  )}
                />


                {/* Toggle between Edit and Save Icons */}
                {isFuelSurchargeEditing ? (
                  <IconButton
                    size="small"
                    sx={{ color: 'success.main' }}
                    onClick={() => {
                      setIsFuelSurchargeEditing(false); // Exit edit mode
                    }}
                  >
                    <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => setIsFuelSurchargeEditing(true)} // Enable edit mode for this row
                  >
                    <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
                <Typography variant="body2">{getValues(`customerRate.fuelSurchargeRate`)}</Typography>
              </Box>
            </Box>

            {/* Dynamic Rates Array */}
            {customerRateAccFields && customerRateAccFields.length > 0 && customerRateAccFields.map((item, index) => {
              const isEditing = editIndex === index;
              const isInputEditing = editInputIndex === index;

              return (
                <Box key={`${item.accessorialName}-${index}`} sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', }}>
                  <Box sx={{ flex: 3.5, p: 1 }}>
                    <Typography variant="body2">{item?.accessorialName}</Typography>
                  </Box>
                  <Box sx={{
                    flex: 1.5, p: 1, borderLeft: '1px solid #ccc',
                    display: 'flex', alignItems: 'center', gap: 1
                  }}>
                    {
                      item?.chargeType?.toLowerCase() === 'hourly' && (
                        <>
                          <Controller
                            name={`customerRate.customerAccessorials[${index}].input`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                size="small"
                                type="number" // Enforces native browser numeric inputs
                                disabled={!isInputEditing}
                                variant="outlined"
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                                }}
                                // 1. Sets the hard ceiling boundary (16 integer digits + 2 decimals = 18 total)
                                inputProps={{
                                  max: 9999999999999999.99,
                                  step: "0.01"
                                }}
                                // 2. Disables exponential 'e' notation and signs that bypass text limits
                                onKeyDown={(e) => {
                                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Implements standard validation guard rules prior to committing changes
                                onChange={(e) => {
                                  const val = e.target.value;

                                  // Limits left side to 16 digits maximum and right side to 2 digits maximum
                                  const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val);

                                  if (isValidDecimal || val === '') {
                                    field.onChange(e);
                                  } else {
                                    e.preventDefault();
                                  }
                                }}
                                sx={{
                                  bgcolor: isInputEditing ? '#e3f2fd' : '#fff',
                                  '& .MuiOutlinedInput-input': { p: '4px 8px' },
                                  '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' }
                                }}
                              />
                            )}
                          />


                          {/* Toggle between Edit and Save Icons */}
                          {isInputEditing ? (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditInputIndex(null); // Exit edit mode
                              }}
                              sx={{ color: 'success.main' }}
                            >
                              <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => setEditInputIndex(index)} // Enable edit mode for this row
                            >
                              <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                            </IconButton>
                          )}
                        </>
                      )
                    }
                    {
                      item?.chargeType?.toLowerCase() === 'per_pound' && (
                        <>
                          <Controller
                            name={`customerRate.customerAccessorials[${index}].input`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                size="small"
                                value={field.value ?? ''}
                                type="number" // Enforces native numeric browser behavior
                                disabled={!isInputEditing}
                                variant="outlined"
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                                }}
                                // 1. Sets a hard maximum limit for 18 total digits (16 whole, 2 fractional)
                                inputProps={{
                                  max: 9999999999999999.99,
                                  step: "0.01"
                                }}
                                // 2. Disables exponential inputs or operational signs that disrupt character counts
                                onKeyDown={(e) => {
                                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Implements the standard regex guard before triggering React Hook Form state updates
                                onChange={(e) => {
                                  const val = e.target.value;

                                  // Match up to 16 digits before the dot and up to 2 digits after the dot
                                  const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val);

                                  if (isValidDecimal || val === '') {
                                    field.onChange(e);
                                  } else {
                                    e.preventDefault();
                                  }
                                }}
                                sx={{
                                  bgcolor: isInputEditing ? '#e3f2fd' : '#fff',
                                  '& .MuiOutlinedInput-input': { p: '4px 8px' },
                                  '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' }
                                }}
                              />
                            )}
                          />


                        </>
                      )
                    }
                    {
                      item?.chargeType?.toLowerCase() === 'flat_rate' && (
                        <Typography variant="body2">-</Typography>
                      )
                    }
                  </Box>
                  <Box sx={{
                    flex: 2.5, p: 1, borderLeft: '1px solid #ccc',
                    display: 'flex', alignItems: 'center', gap: 1
                  }}>
                    <Controller
                      name={`customerRate.customerAccessorials[${index}].chargeValue`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          size="small"
                          type="number" // Enforces native numeric browser behavior
                          disabled={!isEditing}
                          variant="outlined"
                          // 1. Sets a hard maximum limit for 18 total digits (16 whole, 2 fractional)
                          inputProps={{
                            max: 9999999999999999.99,
                            step: "0.01"
                          }}
                          // 2. Disables exponential inputs or operational signs that disrupt character counts
                          onKeyDown={(e) => {
                            if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault();
                            }
                          }}
                          // 3. Implements the standard regex guard before triggering React Hook Form state updates
                          onChange={(e) => {
                            const val = e.target.value;

                            // Match up to 16 digits before the dot and up to 2 digits after the dot
                            const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val);

                            if (isValidDecimal || val === '') {
                              field.onChange(e);
                            } else {
                              e.preventDefault();
                            }
                          }}
                          sx={{
                            bgcolor: isEditing ? '#e3f2fd' : '#fff',
                            '& .MuiOutlinedInput-input': { p: '4px 8px' },
                            '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' }
                          }}
                        />
                      )}
                    />


                    {/* Toggle between Edit and Save Icons */}
                    {isEditing ? (
                      <IconButton
                        size="small"
                        onClick={() => {
                          // 1. Get the current value from the form
                          const currentVal = getValues(`customerRate.customerAccessorials[${index}].chargeValue`);
                          // 2. Get the original value from the fields array
                          const originalVal = item.chargeValue;

                          // 3. If they differ, update the 'isManual' key in the form state
                          if (currentVal !== originalVal) {
                            setValue(`customerRate.customerAccessorials[${index}].isManual`, true);
                          }
                          { console.log(`customerRate.customerAccessorials[${index}].isManual`, getValues(`customerRate.customerAccessorials[${index}].isManual`)) }

                          setEditIndex(null); // Exit edit mode
                        }}
                        sx={{ color: 'success.main' }}
                      >
                        <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => setEditIndex(index)} // Enable edit mode for this row
                      >
                        <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                      </IconButton>
                    )}

                  </Box>
                  <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
                    {
                      item?.chargeType?.toLowerCase() === 'hourly' && (
                        <Typography variant="body2">
                          {(() => {
                            const charge = parseFloat(getValues(`customerRate.customerAccessorials.[${index}].chargeValue`)) || 0;
                            const inputVal = getValues(`customerRate.customerAccessorials.[${index}].input`);

                            // Check if input is a valid string or number
                            const hasInput = inputVal !== undefined && inputVal !== "" && inputVal !== null;

                            return (hasInput
                              ? charge * (parseFloat(inputVal) || 0)
                              : charge
                            ).toFixed(2);
                          })()}
                        </Typography>

                      )
                    }
                    {
                      item?.chargeType?.toLowerCase() === 'per_pound' && (
                        <Typography variant="body2">
                          {(() => {
                            const charge = parseFloat(getValues(`customerRate.customerAccessorials.[${index}].chargeValue`)) || 0;
                            const weightVal = totals.totalWeight;

                            // Weight is considered "present" if it's not empty, null, undefined, or 0
                            const hasWeight = weightVal !== undefined && weightVal !== "" && weightVal !== null && weightVal !== 0;

                            const finalValue = hasWeight
                              ? charge * parseFloat(weightVal)
                              : charge;

                            return finalValue.toFixed(2);
                          })()}
                        </Typography>
                      )
                    }

                    {
                      item?.chargeType?.toLowerCase() === 'flat_rate' && (
                        <Typography variant="body2">{parseFloat(getValues(`customerRate.customerAccessorials.[${index}].chargeValue`)) || 0}</Typography>
                      )
                    }
                  </Box>
                </Box>
              );
            })}

            {/* Adding accessorials */}
            {addFlag && <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', }}>

              <Box sx={{
                flex: 1.5, p: 1,
                display: 'flex', alignItems: 'center', gap: 1
              }}>

                <TextField
                  size="small"
                  variant="outlined"
                  select
                  sx={{
                    width: "15%",
                    '& .MuiOutlinedInput-input': { p: '4px 8px' },
                    '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
                  }}
                  onChange={(event) => {
                    const selectedObject = masterAccessorials.find(item => item.entityAccessorialId === event.target.value);
                    setValue('customerRate.selectedAccToAdd', selectedObject);
                  }}
                >
                  {masterAccessorials.map((opt, index) => (<MenuItem key={index} value={opt.entityAccessorialId}>{opt.accessorialName}</MenuItem>))}
                </TextField>

                <StyledTextField value={getValues('customerRate.selectedAccToAdd.chargeType') ?? ""} variant="standard" sx={{ width: '10%', ml: 1 }} InputLabelProps={{ shrink: true }} disabled />

                <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none', ml: 1 }}
                  onClick={addAccessorial}
                >
                  Save
                </Button>
              </Box>

            </Box>}

            {/* add acc button  */}
            {!addFlag && <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', }}>

              <Box sx={{
                flex: 1.5, p: 1,
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <Typography variant="normal" fontSize={'12px'}>Accessorial</Typography>
                <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none', ml: 1 }}
                  onClick={() => {
                    setAddFlag(true);
                  }}
                >
                  Add
                </Button>
              </Box>

            </Box>}

            {/* Sub Total Row */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 12, mr: '10%' }}>
              <Typography variant="subtitle2" fontWeight="bold">Total</Typography>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ minWidth: 100 }}>
                {(
                  parseFloat(getValues('customerRate.rate') || 0) +
                  parseFloat(getValues('customerRate.fuelSurchargeRate') || 0) +
                  getValues('customerRate.customerAccessorials').reduce((sum, item) => {
                    const charge = parseFloat(item.chargeValue) || 0;

                    // Check if input exists and isn't an empty string
                    if (item.input !== undefined && item.input !== "" && item.input !== null) {
                      const input = parseFloat(item.input) || 0;
                      return sum + (charge * input);
                    }

                    // Otherwise, treat as a flat fee
                    return sum + charge;
                  }, 0)
                ).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={errorVisible}
          autoHideDuration={3000}
          onClose={() => {
            setErrorVisible(false);
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="error" variant="filled">
            This accessorial is alreay available in the list.
          </Alert>
        </Snackbar>
        <Dialog open={invoiceApprovalModal} onClose={() => setInvoiceApprovalModal(false)} sx={{
          '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
            width: '500px',
            height: 'auto',
            maxHeight: 'none',
            maxWidth: 'none',
          }
        }}>
          <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>
            Confirmation</DialogTitle>
          <DialogContent sx={{ mt: 2, pb: 4 }}>
            <Box>
              <Typography variant='body-2'>Are you sure you to submit the rate ?
              </Typography>
              <Box sx={{ display: 'flex', border: '1px solid #000', mt: 2, borderBottom: 'none' }}>
                <Box sx={{ flex: 3, p: 1 }}>
                  <Typography variant="subtitle2">Initial API amount</Typography>
                </Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}>
                  <Typography variant="subtitle2" fontWeight={'700'}>{getValues('customerRate.apiRate') ? `$ ${getValues('customerRate.apiRate')}` : '-'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', border: '1px solid #000', borderBottom: 'none' }}>
                <Box sx={{ flex: 3, p: 1 }}>
                  <Typography variant="subtitle2">Manual Entry amount</Typography>
                </Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}>
                  <Typography variant="subtitle2" fontWeight={'700'}>$ {getValues('customerRate.rate')}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', border: '1px solid #000' }}>
                <Box sx={{ flex: 3, p: 1 }}>
                  <Typography variant="subtitle2">Difference amount</Typography>
                </Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}>
                  <Typography variant="subtitle2" fontWeight={'700'}> $
                    {Math.abs(
                      parseFloat(getValues('customerRate.apiRate') || 0) - parseFloat(getValues('customerRate.rate') || 0)
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
            <Button onClick={() => {
              setInvoiceApprovalModal(false);
              onClose();
            }} variant="contained" sx={{
              ...commonBtnStyle, bgcolor:
                '#a22', px: 4, '&:hover': { bgcolor: '#811' }
            }}>
              Ok
            </Button>
            <Button onClick={() => {
              setInvoiceApprovalModal(false);
            }} variant="contained" sx={{
              ...commonBtnStyle, bgcolor:
                '#a22', px: 4, '&:hover': { bgcolor: '#811' }
            }}>
              cancel
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
        <Button onClick={() => {
          setValue('customerRate.rate', getValues('customerRate.apiRate'));
          replaceCustomerRateAccFields([]);
          setIsRateEditing(false);
          setSpotRateFlag(false);
          onClose();
        }} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
        <Button onClick={() => {
          if (Number(getValues('customerRate.apiRate')) === Number(getValues('customerRate.rate'))) {
            onClose();
          } else {
            setInvoiceApprovalModal(true);
          }
        }} variant="contained" sx={{
          ...commonBtnStyle, bgcolor:
            '#a22', px: 4, '&:hover': { bgcolor: '#811' }
        }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>

  );
};

export default CustomerRateDialog; 
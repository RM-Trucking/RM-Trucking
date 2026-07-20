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

// step 5 carrier rate
const CarrierSection = ({ type, fields, sectionName, rate, totalSubCharges, watchedCarrierRateInfo, setValue, path, control, getValues, totals, apiZipRate, invoiceNo }) => {
  // Track which row index is currently in "Edit Mode"
  const [editInputIndex, setEditInputIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [manual, setManual] = useState(false);
  const [isRateEditing, setIsRateEditing] = useState(false);
  const [isInvoiceEditing, setIsInvoiceEditing] = useState(false);
  const [manualInvoice, setManualInvoice] = useState(false);
  //  invoice approval
  // invoice approval dialogs
  const [invoiceApprovalModal, setInvoiceApprovalModal] = useState(false);
  const hasManualEntry = fields.some(item => item.isManual === true);


  return (
    <Box sx={{ mb: 4 }}>
      {type && type !== 'Add' && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none' }}
          onClick={() => {
            setInvoiceApprovalModal(true);
          }}
        >
          Invoice Approval
        </Button>
      </Box>}

      <Box sx={{ border: '1px solid #ccc', borderRadius: '4px' }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
          <Box sx={{ display: 'flex', p: 1, alignItems: 'center', gap: 1, flex: 3.5, fontWeight: 'bold', justifyContent: 'space-between' }}>
            <Typography variant="normal" fontSize={'12px'}>{sectionName}</Typography>
            {type && type !== 'Add' && <Box sx={{
              p: 1,
              display: 'flex', alignItems: 'center', gap: 1
            }}>
              <Controller
                name={invoiceNo}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    // When NOT editing, we show "Invoice #" as a label/placeholder
                    // When editing, we show the real value so you can type freely
                    placeholder={!isInvoiceEditing ? "Invoice #" : ""}

                    // Crucial: Only override the value if it's NOT in edit mode
                    // If editing, use field.value or '' to keep it "controlled"
                    value={!isInvoiceEditing ? (field.value ? `Invoice #` : "Invoice #") : (field.value ?? '')}

                    size="small"
                    disabled={!isInvoiceEditing}
                    variant="outlined"
                    // Natively restricts typing entry to 30 characters max
                    inputProps={{ maxLength: 30 }}
                    sx={{
                      bgcolor: isInvoiceEditing ? '#e3f2fd' : '#fff',
                      '& .MuiOutlinedInput-input': { p: '4px 8px' },
                      '& .Mui-disabled': {
                        WebkitTextFillColor: '#000',
                        cursor: 'default'
                      }
                    }}
                  />
                )}
              />

              {/* Toggle between Edit and Save Icons */}
              {isInvoiceEditing ? (
                <IconButton
                  size="small"
                  sx={{ color: 'success.main' }}
                  onClick={() => {
                    // 1. Get the current value from the form
                    // const currentVal = getValues(`rate`);
                    // // 2. Get the original value from the fields array
                    // const originalVal = getValues(rate);

                    // // 3. If they differ, update the 'isManual' key in the form state
                    // if (currentVal !== originalVal) {
                    //   setValue(`${path}[${index}].isManual`, true);
                    // }
                    setIsInvoiceEditing(false); // Exit edit mode
                    setManualInvoice(true);
                  }}
                >
                  <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={() => setIsInvoiceEditing(true)} // Enable edit mode for this row
                >
                  <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                </IconButton>
              )}
            </Box>}
          </Box>
          <Box sx={{ display: 'flex', flex: 1.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Multiplication Factor</Typography></Box>
          <Box sx={{ display: 'flex', flex: 2.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Rates ($)</Typography></Box>
          <Box sx={{ display: 'flex', flex: 1.5, p: 1, borderLeft: '1px solid #ccc', alignItems: 'center' }}><Typography variant="subtitle2">Total Rates ($)</Typography></Box>
        </Box>
        {/* zip to zip  Static Rates Array (e.g., from API or predefined) */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', bgcolor: (manual ? 'rgba(255, 226, 201, 1)' : '#fff') }}>
          <Box sx={{ flex: 3.5, p: 1 }}>
            <Typography variant="body2">Zip to Zip</Typography>
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
              name={rate}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  type="number" // Ensures numeric entry behavior
                  disabled={!isRateEditing}
                  variant="outlined"
                  // 1. Enforces the hard maximum numeric value (16 digits before decimal, 2 after)
                  inputProps={{
                    max: 9999999999999999.99,
                    step: "0.01"
                  }}
                  // 2. Blocks unexpected keys like 'e' or signs from breaking the entry
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  // 3. Exact regex validation check to strictly enforce (18,2) limits
                  onChange={(e) => {
                    const val = e.target.value;

                    // Allows empty string, or up to 16 digits on the left and up to 2 digits on the right
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
                  // 1. Get the current value from the form
                  // const currentVal = getValues(`rate`);
                  // // 2. Get the original value from the fields array
                  // const originalVal = getValues(rate);

                  // // 3. If they differ, update the 'isManual' key in the form state
                  // if (currentVal !== originalVal) {
                  //   setValue(`${path}[${index}].isManual`, true);
                  // }
                  setIsRateEditing(false); // Exit edit mode
                  setManual(true);
                }}
              >
                <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                onClick={() => setIsRateEditing(true)} // Enable edit mode for this row
              >
                <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
              </IconButton>
            )}

            {manual && <Typography variant="caption" sx={{ color: '#666' }}>Manual Entry</Typography>}
          </Box>
          <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
            {rate === 'carrierRates.pickUp.pickUpRate' &&
              <Typography variant="body2">{getValues(`carrierRates.pickUp.pickUpRate`)}</Typography>
            }
            {rate === 'carrierRates.lineHaul.lineHaulRate' &&
              <Typography variant="body2">{getValues(`carrierRates.lineHaul.lineHaulRate`)}</Typography>}
            {rate === 'carrierRates.delivery.deliveryRate' &&
              <Typography variant="body2">{getValues(`carrierRates.delivery.deliveryRate`)}</Typography>}
          </Box>
        </Box>

        {/* Dynamic Rates Array */}
        {fields && fields.length > 0 && fields.map((item, index) => {
          console.log(fields);
          const isEditing = editIndex === index;
          const isInputEditing = editInputIndex === index;

          return (
            <Box key={item.accessorialId} sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', bgcolor: (getValues(`${path}[${index}].isManual`) ? 'rgba(255, 226, 201, 1)' : '#fff') }}>
              <Box sx={{ flex: 3.5, p: 1 }}>
                <Typography variant="body2">{item.accessorialName}</Typography>
              </Box>
              <Box sx={{
                flex: 1.5, p: 1, borderLeft: '1px solid #ccc',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                {
                  item?.chargeType?.toLowerCase() === 'hourly' && (
                    <>
                      <Controller
                        name={`${path}[${index}].input`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            type="number" // Forces browser numeric input behavior
                            disabled={!isInputEditing}
                            variant="outlined"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                            }}
                            // 1. Sets the hard ceiling value (16 whole digits + 2 decimals = 18 total)
                            inputProps={{
                              max: 9999999999999999.99,
                              step: "0.01"
                            }}
                            // 2. Prevents exponential 'e' or signage characters from breaking the layout
                            onKeyDown={(e) => {
                              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                e.preventDefault();
                              }
                            }}
                            // 3. Regex boundary check to lock typing beyond 16 whole digits or 2 decimals
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
                        name={`${path}[${index}].input`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            type="number" // Enforces numeric keyboard/entry rules
                            disabled={!isInputEditing}
                            variant="outlined"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                            }}
                            // 1. Specifies max value (16 numbers before the dot, 2 after = 18 digits)
                            inputProps={{
                              max: 9999999999999999.99,
                              step: "0.01"
                            }}
                            // 2. Blocks notation symbols from bypassing the input type
                            onKeyDown={(e) => {
                              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                e.preventDefault();
                              }
                            }}
                            // 3. Captures and enforces the (18,2) schema boundaries before committing to state
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
                  name={`${path}[${index}].chargeValue`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number" // Enforces numeric entry rules
                      disabled={!isEditing}
                      variant="outlined"
                      // 1. Sets the maximum possible value for a (18,2) database field
                      inputProps={{
                        max: 9999999999999999.99,
                        step: "0.01"
                      }}
                      // 2. Blocks symbols that bypass standard length restrictions
                      onKeyDown={(e) => {
                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                      }}
                      // 3. Implements standard regex protection before updating React Hook Form
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
                      const currentVal = getValues(`${path}[${index}].chargeValue`);
                      // 2. Get the original value from the fields array
                      const originalVal = item.chargeValue;

                      // 3. If they differ, update the 'isManual' key in the form state
                      if (currentVal !== originalVal) {
                        setValue(`${path}[${index}].isManual`, true);
                      }
                      { console.log(`${path}[${index}].isManual`, getValues(`${path}[${index}].isManual`)) }

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

                {getValues(`${path}[${index}].isManual`) && <Typography variant="caption" sx={{ color: '#666', flex: 1 }}>Manual Entry</Typography>}
              </Box>
              <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
                {
                  item?.chargeType?.toLowerCase() === 'hourly' && (
                    <Typography variant="body2">
                      {(() => {
                        const charge = parseFloat(getValues(`${path}[${index}].chargeValue`)) || 0;
                        const inputVal = getValues(`${path}[${index}].input`);

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
                        const charge = parseFloat(getValues(`${path}[${index}].chargeValue`)) || 0;
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
                    <Typography variant="body2">{getValues(`${path}[${index}].chargeValue`)}</Typography>
                  )
                }
              </Box>
            </Box>
          );
        })}

        {/* Sub Total Row */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 12, mr: '10%' }}>
          <Typography variant="subtitle2" fontWeight="bold">Sub Total</Typography>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ minWidth: 100 }}>
            {totalSubCharges}
          </Typography>
        </Box>
      </Box>

      <Dialog open={invoiceApprovalModal} onClose={() => setInvoiceApprovalModal(false)} sx={{
        '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
          width: '500px',
          height: 'auto',
          maxHeight: 'none',
          maxWidth: 'none',
        }
      }}>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>{(sectionName.toLowerCase().includes('pickup')) ? 'Pickup' : (sectionName.toLowerCase().includes('line haul')) ? 'Line Haul' : 'Delivery'} Confirmation</DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 4 }}>
          {
            !manual && <Typography variant='body-2'>Are you sure you to submit the Invoice Approval for {`${sectionName}`} the total amount  ${`${totalSubCharges}`} ?</Typography>
          }
          {
            manual && <Box>
              <Typography variant='body-2'>Are you sure you to submit the Invoice Approval for {`${sectionName}`} ?</Typography>
              <Box sx={{ display: 'flex', border: '1px solid #000', mt: 2, borderBottom: 'none' }}>
                <Box sx={{ flex: 3, p: 1 }}><Typography variant="subtitle2">Initial API amount</Typography></Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}><Typography variant="subtitle2" fontWeight={'700'}>$ {apiZipRate}</Typography></Box>
              </Box>
              <Box sx={{ display: 'flex', border: '1px solid #000', borderBottom: 'none' }}>
                <Box sx={{ flex: 3, p: 1 }}><Typography variant="subtitle2">Manual Entry amount</Typography></Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}><Typography variant="subtitle2" fontWeight={'700'}>$ {`${getValues(`${rate}`)}`}</Typography></Box>
              </Box>
              <Box sx={{ display: 'flex', border: '1px solid #000' }}>
                <Box sx={{ flex: 3, p: 1 }}>
                  <Typography variant="subtitle2">Difference amount</Typography>
                </Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc' }}>
                  <Typography variant="subtitle2" fontWeight={'700'}> $
                    {Math.abs(
                      parseFloat(apiZipRate || 0) - parseFloat(getValues(`${rate}`) || 0)
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

            </Box>
          }
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setInvoiceApprovalModal(false)} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
            Cancel
          </Button>
          <Button onClick={() => setInvoiceApprovalModal(false)} variant="contained" sx={{ ...commonBtnStyle, bgcolor: '#a22', px: 4, '&:hover': { bgcolor: '#811' } }}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CarrierSection; 
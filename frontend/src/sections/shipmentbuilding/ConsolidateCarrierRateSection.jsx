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
import CarrierRateNotesDilog from './CarrierRateNotesDilog';
import CarrierApprovalHistoryDilog from './CarrierApprovalHistoryDilog';

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
const ConsolidateCarrierRateSection = ({ type, fields, sectionName, rate, totalSubCharges, watchedCarrierRateInfo, setValue, path, control, getValues,
  totals, apiZipRate, invoiceNo, updateAccessorials, approvalHistory, notesArr, appendNotesArr, currentNoteText, selectedLinehaulDetailsList,
  updateSelectedLinehaulDetailsList, }) => {
  // Track which row index is currently in "Edit Mode"
  const [editInputIndex, setEditInputIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [manual, setManual] = useState(false);
  const [isRateEditing, setIsRateEditing] = useState(false);
  const [isInvoiceEditing, setIsInvoiceEditing] = useState(null);
  const [manualInvoice, setManualInvoice] = useState(false);
  //  invoice approval
  // invoice approval dialogs
  const [invoiceApprovalModal, setInvoiceApprovalModal] = useState(false);
  const hasManualEntry = fields.some(item => item.isManual === true);
  const [carrierRateNotesModal, setCarrierRateNotesModal] = useState(false);
  const [carrierApprovalRateHistoryModal, setCarrierApprovalRateHistoryModal] = useState(false);



  return (
    <Box sx={{ mb: 4 }}>
      {type && type !== 'Add' && type !== 'View' && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none', ml: 1 }}
            onClick={() => setCarrierRateNotesModal(true)}
          >
            Rate Notes
          </Button>
          <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none', ml: 1 }}
            onClick={() => setCarrierApprovalRateHistoryModal(true)}
          >
            Approval History
          </Button> */}
        </Box>
        {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ backgroundColor: "rgba(181, 181, 181, 1)", pl: 1.5, borderRadius: '5px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: "12px" }}>Approval Pending
              <IconButton>
                <Iconify icon="lets-icons:check-fill" width={18} sx={{ color: 'rgba(230, 181, 4, 1)' }} />
                <Iconify icon="lets-icons:check-fill" width={18} sx={{ color: 'rgba(92, 172, 105, 1)' }} />
              </IconButton>
            </Typography>
          </Box>
          <Button variant="contained" size="small" sx={{ bgcolor: '#a22', textTransform: 'none', ml: 1 }}
            onClick={() => {
              setInvoiceApprovalModal(true);
            }}
          >
            Invoice Approval
          </Button>
        </Box> */}
      </Box>}


      {selectedLinehaulDetailsList?.map((linehaulItem, linehaulItemIndex) => {
        // Create a unique fallback key using shipmentId or index
        const itemKey = linehaulItem?.shipmentId || `linehaul-${linehaulItemIndex}`;
         const isThisRowEditing = isInvoiceEditing === linehaulItemIndex;
        const calculateGrandSubTotal = () => {
          // 1. Start with the base individual object zip rate
          const baseZipRate = Number(getValues(`${path}[${linehaulItemIndex}].individualObjZipRate`) || 0);

          // 2. Loop through accessorials and accumulate their calculated costs
          const totalAccessorialsCost = (getValues(`${path}[${linehaulItemIndex}].accessorials`) || []).reduce((sum, acc) => {
            const charge = Number(acc?.chargeValue || 0);
            const inputVal = Number(acc?.input || 0);

            // If input is 0 or empty, use the charge value directly. Otherwise, multiply them.
            const calculatedCharge = inputVal > 0 ? charge * inputVal : charge;

            return sum + calculatedCharge;
          }, 0);

          // 3. Compute the grand total for this specific shipment item
          const cardGrandTotal = (baseZipRate + totalAccessorialsCost).toFixed(2);
          return cardGrandTotal;
        }
        return (
          <Box
            key={itemKey}
            sx={{
              padding: 1.5,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              backgroundColor: '#fafafa'
            }}
          >
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: 'bold' }}
            >
              Shipment - {linehaulItem?.shipmentProNumber || 'No Pro Number'}
            </Typography>
            <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', mt: 1 }}>
              {/* Header Row */}
              <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
                <Box sx={{ display: 'flex', p: 1, alignItems: 'center', gap: 1, flex: 3.5, fontWeight: 'bold', justifyContent: 'space-between' }}>
                  <Typography variant="normal" fontSize={'12px'}>{sectionName}</Typography>
                  {type && type !== 'Add' && <Box sx={{
                    p: 1,
                    display: 'flex', alignItems: 'center', gap: 1
                  }}>
                    <Controller
                      name={`carrierInfo.linehaulDetailsList.${linehaulItemIndex}.invoiceNo`}
                      control={control}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          // When NOT editing, we show "Invoice #" as a label/placeholder
                          // When editing, we show the real value so you can type freely
                          placeholder={!isThisRowEditing  ? "Invoice #" : ""}

                          // Crucial: Only override the value if it's NOT in edit mode
                          // If editing, use field.value or '' to keep it "controlled"
                          value={!isThisRowEditing ? (field.value ? `Invoice #` : "Invoice #") : (field.value ?? '')}

                          size="small"
                          disabled={!isThisRowEditing}
                          variant="outlined"
                          // Natively restricts typing entry to 30 characters max
                          inputProps={{ maxLength: 30 }}
                          sx={{
                            bgcolor: isThisRowEditing ? '#e3f2fd' : '#fff',
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
                    {isThisRowEditing ? (
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
                          //   setValue(`${path}[${linehaulItemIndex}].isManual`, true);
                          // }
                          setIsInvoiceEditing(null); // Exit edit mode
                          setManualInvoice(true);
                        }}
                      >
                        <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                      </IconButton>
                    ) : (
                      <>
                        {
                          type !== 'View' && <IconButton
                            size="small"
                            onClick={() => setIsInvoiceEditing(linehaulItemIndex)} // Enable edit mode for this row
                          >
                            <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                          </IconButton>
                        }
                      </>
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
                    name={`carrierInfo.linehaulDetailsList.${linehaulItemIndex}.individualObjZipRate`}
                    control={control}
                    render={({ field }) => (
                      <StyledTextField
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
                        //   setValue(`${path}[${linehaulItemIndex}].isManual`, true);
                        // }
                        setIsRateEditing(false); // Exit edit mode
                        setManual(true);
                      }}
                    >
                      <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                    </IconButton>
                  ) : (
                    <>
                      {
                        type !== 'View' && <IconButton
                          size="small"
                          onClick={() => setIsRateEditing(true)} // Enable edit mode for this row
                        >
                          <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                        </IconButton>
                      }
                    </>
                  )}

                  {manual && <Typography variant="caption" sx={{ color: '#666' }}>Manual Entry</Typography>}
                </Box>
                <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>

                  <Typography variant="body2">{getValues(`carrierInfo.linehaulDetailsList.${linehaulItemIndex}.individualObjZipRate`)}</Typography>

                </Box>
              </Box>

              {/* Dynamic Rates Array */}
              {linehaulItem?.accessorials && linehaulItem?.accessorials?.length > 0 && linehaulItem?.accessorials?.map((item, index) => {

                const isEditing = editIndex === `${linehaulItemIndex}-${index}`;
                const isInputEditing = editInputIndex === `${linehaulItemIndex}-${index}`;

                return (
                  <Box key={`${item.accessorialId}-${index}`} sx={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', bgcolor: (getValues(`${path}[${index}].isManual`) ? 'rgba(255, 226, 201, 1)' : '#fff') }}>
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
                              name={`${path}[${linehaulItemIndex}].accessorials[${index}].input`}
                              control={control}
                              render={({ field: { onChange, value, ...fieldParams } }) => (
                                <StyledTextField
                                  {...fieldParams}
                                  // 1. Keeps the typed string exactly as-is across mounting/unmounting steps
                                  value={value ?? ''}
                                  size="small"
                                  type="text"
                                  inputMode="decimal"
                                  disabled={!isInputEditing}
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                                  }}
                                  inputProps={{
                                    maxLength: 19
                                  }}
                                  onKeyDown={(e) => {
                                    // Allows normal typing and command shortcuts
                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', '.'];
                                    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value;

                                    // 2. Permits a single standalone dot or structured decimals
                                    const isValidDecimal = /^\d{0,16}(\.\d{0,2})?$/.test(val) || val === '.';

                                    if (isValidDecimal) {
                                      // 3. Storing as raw text string prevents premature truncation or state erasure
                                      onChange(val === '' ? null : val);
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
                                  // 1. Fetch the entire current object at this specific index from React Hook Form state
                                  // const currentItem = getValues(`carrierRates.pickUp.pickupAccessorials[${index}]`);
                                  const currentItem = `${path}[${linehaulItemIndex}].accessorials[${index}]`;
                                  const currentLinehaulItem = selectedLinehaulDetailsList[linehaulItemIndex];

                                  // 2. Fetch the current text/number stored inside your custom input field
                                  const typedInputValue = getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].input`);

                                  // 3. Trigger the field array update to keep internal row keys and UI values synchronized
                                  if (currentLinehaulItem) {
                                    const updatedAccessorials = ((getValues(`${path}[${linehaulItemIndex}].accessorials`) || []) || []).map((acc, accIdx) => {
                                      if (accIdx === index) {
                                        return {
                                          ...acc,
                                          input: typedInputValue// <-- Inject your updated value here
                                        };
                                      }
                                      return acc; // Keep all other accessorial objects untouched
                                    });
                                    updateSelectedLinehaulDetailsList(linehaulItemIndex, {
                                      ...currentLinehaulItem,       // Retains all top-level keys like shipmentId, proNum, etc.
                                      accessorials: updatedAccessorials // Overwrites with the updated accessorials array
                                    });
                                  }

                                  setEditInputIndex(null); // Exit edit mode safely
                                }}
                                sx={{ color: 'success.main' }}
                              >
                                <Iconify icon="fluent:save-24-filled" width={18} sx={{ color: '#a22' }} />
                              </IconButton>

                            ) : (
                              <>
                                {type !== 'View' && <IconButton
                                  size="small"
                                  onClick={() => setEditInputIndex(`${linehaulItemIndex}-${index}`)} // Enable edit mode for this row
                                >
                                  <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                                </IconButton>}
                              </>
                            )}
                          </>
                        )
                      }
                      {
                        item?.chargeType?.toLowerCase() === 'per_pound' && (
                          <>
                            <Controller
                              name={`${path}[${linehaulItemIndex}].accessorials[${index}].input`}
                              control={control}
                              render={({ field }) => (
                                <StyledTextField
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
                        name={`${path}[${linehaulItemIndex}].accessorials[${index}].chargeValue`}
                        control={control}
                        render={({ field }) => (
                          <StyledTextField
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
                            const currentItem = `${path}[${linehaulItemIndex}].accessorials[${index}]`;
                            const currentLinehaulItem = selectedLinehaulDetailsList[linehaulItemIndex];
                            const currentVal = getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].chargeValue`);
                            // 2. Get the original value from the fields array
                            const originalVal = item.apiCharges;

                            if (currentLinehaulItem) {
                              const updatedAccessorials = (getValues(`${path}[${linehaulItemIndex}].accessorials`) || []).map((acc, accIdx) => {
                                if (accIdx === index) {
                                  return {
                                    ...acc,
                                    chargeValue: currentVal// <-- Inject your updated value here
                                  };
                                }
                                return acc; // Keep all other accessorial objects untouched
                              });
                              updateSelectedLinehaulDetailsList(linehaulItemIndex, {
                                ...currentLinehaulItem,       // Retains all top-level keys like shipmentId, proNum, etc.
                                accessorials: updatedAccessorials // Overwrites with the updated accessorials array
                              });
                            }

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
                        <>
                          {
                            type !== 'View' && <IconButton
                              size="small"
                              onClick={() => setEditIndex(`${linehaulItemIndex}-${index}`)} // Enable edit mode for this row
                            >
                              <Iconify icon="tabler:edit" width={18} sx={{ color: '#a22' }} />
                            </IconButton>
                          }
                        </>
                      )}

                      {getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].isManual`) && <Typography variant="caption" sx={{ color: '#666', flex: 1 }}>Manual Entry</Typography>}
                    </Box>
                    <Box sx={{ flex: 1.5, p: 1, borderLeft: '1px solid #ccc', }}>
                      {
                        item?.chargeType?.toLowerCase() === 'hourly' && (
                          <Typography variant="body2">
                            {(() => {
                              const charge = parseFloat(getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].chargeValue`)) || 0;
                              const inputVal = getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].input`);

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
                              const charge = parseFloat(getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].chargeValue`)) || 0;
                              const weightVal = parseFloat(getValues(`${path}[${linehaulItemIndex}].individualTotalWeight`)) || 0;

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
                          <Typography variant="body2">{getValues(`${path}[${linehaulItemIndex}].accessorials[${index}].chargeValue`)}</Typography>
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
                  {
                    calculateGrandSubTotal()
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}




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
              <Typography component="div" variant='body-2' sx={{ textAlign: 'center' }}>Are you sure you to submit the Invoice Approval for {`${sectionName}`} ?</Typography>
              <Typography component="div" variant='body-2' sx={{ textAlign: 'center' }}>Once approved, the amount cannot be changed or reverted. Do you want to continue ?</Typography>
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
      <CarrierRateNotesDilog
        sectionName={sectionName}
        open={carrierRateNotesModal}
        handleClose={() => setCarrierRateNotesModal(false)}
        notes={[]}
        setValue={setValue}
        getValues={getValues}
        control={control}
        customerRateNotesArr={notesArr}
        appendCustomerRateNotesArr={appendNotesArr}
        currentCustomerNoteText={currentNoteText} />
      <CarrierApprovalHistoryDilog sectionName={sectionName} open={carrierApprovalRateHistoryModal}
        handleClose={() => setCarrierApprovalRateHistoryModal(false)}
        customerApprovalRateHistory={approvalHistory} />
    </Box>
  );
}

export default ConsolidateCarrierRateSection; 
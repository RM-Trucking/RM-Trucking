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
  getZipToZipCarrierDeliveryRate, setError,

} from '../../redux/slices/shipment';


// --------------------------------------------------------------

// --- CONSTANTS & LISTS --- 
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

const shipmentStatusOptions = ['Order received Pickup Pending',
  'Order received Pickup Setup',
  'Dispatched / RSL',
  'Picked',
  'At Warehouse',
  'To be recovered',
  'To be Routed',
  'Added to Queue',
  'Manifested',
  'Carrier Picked Up',
  'In Transit',
  'Delivered',
  'Appointment',
  'Recovered Short',
]

const STEPS = [
  'Shipment Details',
  'Customer Details',
  'Commodities Details',
  'Carrier Information',
  'Carrier Rate'
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

const commonBtnStyle = {

  height: '24px',

  fontWeight: 600,

  textTransform: 'none',

  borderRadius: '4px',

  boxShadow: 'none',

  px: 2,

  fontSize: '0.8rem',

};


// item section
const ShipmentStatusUpdateDialog = ({ open, onClose, setValue, getValues, control, errors, liveShipmentStatus }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `shipmentStatus.shipmentStatusTable`,
  });
  const [errorVisible, setErrorVisible] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} sx={{
      '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
        width: '1500px',
        height: 'auto',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>Shipment Status</DialogTitle>
      <DialogContent sx={{ mt: 2, pb: 4 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentStatus.status"

                  control={control}

                  rules={{ required: true }}

                  render={({ field }) => (

                    <TextField {...field} select fullWidth label="Type of Shipment *" variant="standard" error={!!errors.shipmentStatus.status} SelectProps={{
                      displayEmpty: true,
                      MenuProps: {
                        // Crucial: disables internal centering logic so origins work
                        getContentAnchorEl: null,
                        // Prevents layout shifts and menu misplacement on scroll
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
                            marginTop: '4px', // Your custom gap
                            maxHeight: 300,
                            maxWidth: 300    // Recommended to prevent long lists from going off-screen
                          }
                        }
                      },
                    }}>

                      {shipmentStatusOptions.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}

                    </TextField>

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentStatus.date"

                  control={control}

                  render={({ field }) => (

                    <DatePicker {...field} label="Date" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.date } }} />

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentStatus.time"

                  control={control}

                  render={({ field }) => (

                    <TimePicker {...field} label="Time" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.time } }} />

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>
                <Controller name="shipmentStatus.location" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField {...field} fullWidth label="Current Location *" variant="standard" error={!!errors.location} />
                )} />
              </Box>
            </Box>
            {liveShipmentStatus === 'Delivered' && <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
              <Box width={"25%"}>
                <Controller name="shipmentStatus.signature" control={control} render={({ field }) => (
                  <TextField fullWidth {...field} label="Signature" variant="standard" error={!!errors.signature} />
                )} />
              </Box>
              <Box width={"22%"}>

                <Controller

                  name="shipmentStatus.deliveryDate"

                  control={control}

                  render={({ field }) => (

                    <DatePicker required {...field} label="Delivery Date*" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.deliveryDate } }} />

                  )}

                />

              </Box>
              <Box width={"22%"}>

                <Controller

                  name="shipmentStatus.deliveryTime"

                  control={control}

                  render={({ field }) => (

                    <TimePicker required {...field} label="Delivery Time*" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.deliveryTime } }} />

                  )}

                />

              </Box>
            </Box>}
            {liveShipmentStatus === 'Appointment' && <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
              <Box width={'22%'}>

                <Controller

                  name="shipmentStatus.appointmentDate"

                  control={control}

                  render={({ field }) => (

                    <DatePicker required {...field} label="Appointment Date*" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.appointmentDate } }} />

                  )}

                />

              </Box>
              <Box width={'22%'}>

                <Controller

                  name="shipmentStatus.appointmentTime"

                  control={control}

                  render={({ field }) => (

                    <TimePicker required {...field} label="Appointment Time*" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.appointmentTime } }} />

                  )}

                />

              </Box>
            </Box>}
            <Box sx={{ flex: '1', mt: 4 }}>
              <Controller
                name="shipmentStatus.comments"
                control={control}
                rules={{
                  maxLength: {
                    value: 255,
                    message: 'Notes cannot exceed 255 characters'
                  },
                  validate: (value) => !value || value.trim().length > 0 || 'Notes cannot be only spaces'
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={`Comments*`}
                    variant="standard" fullWidth

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
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  // Basic validation before appending
                  const status = getValues('shipmentStatus.status');
                  const location = getValues('shipmentStatus.location');
                  const comments = getValues('shipmentStatus.comments');
                  const d = getValues('shipmentStatus.date') ? dayjs(getValues('shipmentStatus.date')).format('YYYY-MM-DD') : null;
                  const t = getValues('shipmentStatus.time') ? getValues('shipmentStatus.time').format('HH:mm') : null; // e.g. "13:30"
                  const deliveryDate = getValues('shipmentStatus.deliveryDate') ? dayjs(getValues('shipmentStatus.deliveryDate')).format('YYYY-MM-DD') : null;
                  const deliveryTime = getValues('shipmentStatus.deliveryTime') ? getValues('shipmentStatus.deliveryTime').format('HH:mm') : null;
                  const appointmentDate = getValues('shipmentStatus.appointmentDate') ? dayjs(getValues('shipmentStatus.appointmentDate')).format('YYYY-MM-DD') : null;
                  const appointmentTime = getValues('shipmentStatus.appointmentTime') ? getValues('shipmentStatus.appointmentTime').format('HH:mm') : null;
                  if (liveShipmentStatus !== 'Delivered' && liveShipmentStatus !== 'Appointment') {
                    if (status && location && (comments.trim().length > 0)) {
                      append({
                        status: getValues('shipmentStatus.status') || '',
                        dateTime: `${d} ${t}`,
                        location: getValues('shipmentStatus.location') || '',
                        description: '',
                        comments: getValues('shipmentStatus.comments') || '',
                        postedDateTime: new Date(),
                        signature: getValues('shipmentStatus.signature') || '',
                        deliveryDateTime: `${deliveryDate} ${deliveryTime}`,
                        appointmentDateTime: `${appointmentDate} ${appointmentTime}`,
                        user: 'Admin',
                      });
                      setErrorVisible(false);
                    } else {
                      setErrorVisible(true);
                    }
                  }
                  if (liveShipmentStatus === 'Delivered') {
                    if (status && location && (comments.trim().length > 0) && deliveryDate && deliveryTime) {
                      append({
                        status: getValues('shipmentStatus.status') || '',
                        dateTime: `${deliveryDate} ${deliveryTime}`,
                        location: getValues('shipmentStatus.location') || '',
                        description: '',
                        comments: getValues('shipmentStatus.comments') || '',
                        postedDateTime: new Date(),
                        signature: getValues('shipmentStatus.signature') || '',
                        deliveryDateTime: `${deliveryDate} ${deliveryTime}`,
                        appointmentDateTime: `${appointmentDate} ${appointmentTime}`,
                        user: 'Admin',
                      });
                      setErrorVisible(false);
                    } else {
                      setErrorVisible(true);
                    }
                  }
                  if (liveShipmentStatus === 'Appointment') {
                    if (status && location && (comments.trim().length > 0) && appointmentDate && appointmentTime) {
                      append({
                        status: getValues('shipmentStatus.status') || '',
                        dateTime: `${appointmentDate} ${appointmentTime}`,
                        location: getValues('shipmentStatus.location') || '',
                        description: '',
                        comments: getValues('shipmentStatus.comments') || '',
                        postedDateTime: new Date(),
                        signature: getValues('shipmentStatus.signature') || '',
                        deliveryDateTime: `${deliveryDate} ${deliveryTime}`,
                        appointmentDateTime: `${appointmentDate} ${appointmentTime}`,
                        user: 'Admin',
                      });
                      setErrorVisible(false);
                    } else {
                      setErrorVisible(true);
                    }
                  }
                }}
                sx={{ bgcolor: '#a22', textTransform: 'none', mt: 1, '&:hover': { bgcolor: '#811' } }}
              >
                Update Status
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#eee' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Comments</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Posted Date & Time</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>User ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{field.status}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{!field.dateTime.includes(null) ? dayjs(field.dateTime).format('MM/DD/YYYY HH:mm') : ''}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{field.location}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{field.description}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{field.comments}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{dayjs(field.postedDateTime || new Date()).format('MM/DD/YYYY HH:mm')}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{field.user}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Snackbar open={errorVisible} autoHideDuration={3000} onClose={() => setErrorVisible(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <Alert severity="error" variant="filled">Please fill in required fields and ensure comments are not just spaces.</Alert>
          </Snackbar>

        </LocalizationProvider>
      </DialogContent>
    </Dialog>
  );
};
const ItemsSection = ({ huIndex, control, watchedHU, openHazmat }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `handlingUnits.${huIndex}.items`,
  });

  // Validation: Check if the last item has pieces and description before adding a new one
  const isItemComplete = (idx) => {
    const item = watchedHU[huIndex]?.items[idx];
    return item?.pieces && item?.description;
  };


  return (
    <Box sx={{ mt: 2 }}>
      {fields.map((item, itemIndex) => {
        const currentItem = watchedHU[huIndex]?.items[itemIndex];
        const hazData = currentItem?.hazmatData;

        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              <Iconify icon="solar:box-bold" />
              <Typography variant="caption" sx={{ minWidth: 100, fontWeight: 'bold' }}>
                {/* Logic: Label as "Pallet Details" if it's the only item in the first unit, else "Item X" */}
                {fields.length === 1 ? "Pallet Details" : `Item ${itemIndex + 1}`}
              </Typography>
              <Box sx={{ flex: '0 1 120px' }}>
                <Controller
                  name={`handlingUnits.${huIndex}.items.${itemIndex}.pieces`}
                  control={control}
                  // 1. Core validation rules for whole numbers
                  rules={{
                    required: "Pieces count is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Must be a whole number"
                    }
                  }}
                  // Extract field AND formState directly from the controller render arguments
                  render={({ field, formState }) => {
                    // 2. Safely extract the deeply nested error using formState.errors
                    const pieceError = formState.errors?.handlingUnits?.[huIndex]?.items?.[itemIndex]?.pieces;

                    return (
                      <TextField
                        {...field}
                        // 3. Instantly strips out any typed letters, symbols, or decimals
                        onChange={(e) => {
                          const cleanValue = e.target.value.replace(/[^0-9]/g, ''); // Allows 0-9 digits only
                          field.onChange(cleanValue);
                        }}
                        label="Pieces *"
                        variant="standard"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        // 4. Prompts virtual mobile keyboards to default to the number pad
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        // 5. Safely flags errors and renders the message text
                        error={!!pieceError}
                        helperText={pieceError?.message || ""}
                      />
                    );
                  }}
                />

              </Box>

              <Box sx={{ flex: '1 1 80px' }}>
                <Controller
                  name={`handlingUnits.${huIndex}.items.${itemIndex}.piecesUom`}
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Pieces UOM *" variant="standard" fullWidth InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        MenuProps: {
                          // Crucial: disables internal centering logic so origins work
                          getContentAnchorEl: null,
                          // Prevents layout shifts and menu misplacement on scroll
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
                              marginTop: '4px', // Your custom gap
                              maxHeight: 300,
                              maxWidth: 300    // Recommended to prevent long lists from going off-screen
                            }
                          }
                        },
                      }}
                    >
                      {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map((u) => (
                        <MenuItem key={u} value={u}>{u}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Box sx={{ flex: '1 1 250px' }}>
                <Controller
                  name={`handlingUnits.${huIndex}.items.${itemIndex}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Description *" variant="standard" fullWidth InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Controller
                      name={`handlingUnits.${huIndex}.items.${itemIndex}.hazmatInfo`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked) openHazmat(huIndex, itemIndex);
                          }}
                          size="small"
                        />
                      )}
                    />
                  }
                  label={<Typography variant="caption">Hazmat Info</Typography>}
                />
                {currentItem?.hazmatInfo && (
                  <IconButton onClick={() => openHazmat(huIndex, itemIndex)} size="small">
                    <Iconify icon="solar:pen-bold" sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              {/* Red Delete Icon for items - disabled if only one item remains */}
              <IconButton onClick={() => remove(itemIndex)} disabled={fields.length === 1}>
                <Iconify icon="tabler:circle-x-filled" sx={{ color: fields.length === 1 ? '#ccc' : '#A22' }} />
              </IconButton>
            </Box>

            {/* --- HAZMAT SUMMARY BOX --- */}
            {currentItem?.hazmatInfo && hazData && (
              <Box sx={{
                ml: 7, mt: 5, p: 1.5, border: '1px solid #ccc',
                borderRadius: 2, bgcolor: '#fcfcfc', position: 'relative',
                maxWidth: '70%'
              }}>
                <Typography variant="caption" sx={{
                  position: 'absolute', top: -10, left: 15,
                  bgcolor: '#fcfcfc', px: 0.5, fontWeight: 'bold'
                }}>
                  Hazmat info
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#555' }}>
                  {`${hazData.unNumber}, ${hazData.shippingName}, (${hazData.technicalName}), ${hazData.hazmatClass}, ${hazData.packagingGroup}, ${hazData.weight} ${hazData.weightUnit} `}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}

      <Button
        variant="contained"
        size="small"
        onClick={() => {
          if (isItemComplete(fields.length - 1)) {
            append({ pieces: '', piecesUom: '', description: '', hazmatInfo: false, hazmatData: null });
          } else {
            // Trigger error if previous item isn't filled
            alert("Please fill item details before adding more.");
          }
        }}
        sx={{ bgcolor: '#a22', textTransform: 'none', mt: 1, '&:hover': { bgcolor: '#811' } }}
      >
        Add Item
      </Button>
    </Box>
  );
};
const ItemsSectionView = ({ huIndex, control, watchedHU, openHazmat, hazmatModal, getValues, setValue, setHazmatModal }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `doDetails.handlingUnits.${huIndex}.items`,
  });

  return (
    <Box sx={{ mt: 2 }}>
      {fields.map((item, itemIndex) => {
        const currentItem = watchedHU[huIndex]?.items[itemIndex];
        const hazData = currentItem?.hazmatData;

        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              <Iconify icon="solar:box-bold" />
              <Typography variant="caption" sx={{ minWidth: 100, fontWeight: 'bold' }}>
                {/* Logic: Label as "Pallet Details" if it's the only item in the first unit, else "Item X" */}
                {fields.length === 1 ? "Pallet Details" : `Item ${itemIndex + 1}`}
              </Typography>
              <Box sx={{ flex: '0 1 120px' }}>
                <Controller
                  name={`doDetails.handlingUnits.${huIndex}.items.${itemIndex}.pieces`}
                  control={control}
                  render={({ field }) => (
                    <StyledTextField {...field} label="Pieces *" variant="standard" fullWidth InputLabelProps={{ shrink: true }} disabled />
                  )}
                />
              </Box>

              <Box sx={{ flex: '1 1 80px' }}>
                <Controller
                  name={`doDetails.handlingUnits.${huIndex}.items.${itemIndex}.piecesUom`}
                  control={control}
                  render={({ field }) => (
                    <StyledTextField {...field} select label="Pieces UOM *" variant="standard" fullWidth InputLabelProps={{ shrink: true }} disabled
                      SelectProps={{
                        displayEmpty: true,
                        MenuProps: {
                          // Crucial: disables internal centering logic so origins work
                          getContentAnchorEl: null,
                          // Prevents layout shifts and menu misplacement on scroll
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
                              marginTop: '4px', // Your custom gap
                              maxHeight: 300,
                              maxWidth: 300    // Recommended to prevent long lists from going off-screen
                            }
                          }
                        },
                      }}
                    >
                      {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map((u) => (
                        <MenuItem key={u} value={u}>{u}</MenuItem>
                      ))}
                    </StyledTextField>
                  )}
                />
              </Box>

              <Box sx={{ flex: '1 1 250px' }}>
                <Controller
                  name={`doDetails.handlingUnits.${huIndex}.items.${itemIndex}.description`}
                  control={control}
                  render={({ field }) => (
                    <StyledTextField {...field} label="Description *" variant="standard" fullWidth InputLabelProps={{ shrink: true }} disabled />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {currentItem?.hazmatInfo && (
                  <IconButton onClick={() => openHazmat(huIndex, itemIndex)} size="small">
                    <Iconify icon="solar:pen-bold" sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

            </Box>

            {/* --- HAZMAT SUMMARY BOX --- */}
            {currentItem?.hazmatInfo && hazData && (
              <Box sx={{
                ml: 7, mt: 5, p: 1.5, border: '1px solid #ccc',
                borderRadius: 2, bgcolor: '#fcfcfc', position: 'relative',
                maxWidth: '70%'
              }}>
                <Typography variant="caption" sx={{
                  position: 'absolute', top: -10, left: 15,
                  bgcolor: '#fcfcfc', px: 0.5, fontWeight: 'bold'
                }}>
                  Hazmat info
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#0a0a0a' }}>
                  {`${hazData.unNumber}, ${hazData.shippingName}, (${hazData.technicalName}), ${hazData.hazmatClass}, ${hazData.packagingGroup}, ${hazData.weight} ${hazData.weightUnit} `}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}
      <HazmatDialogView
        state={hazmatModal}
        onClose={() => setHazmatModal({ ...hazmatModal, open: false })}
        setValue={setValue}
        getValues={getValues}
      />
    </Box>
  );
};

// hazmat modal component
const HazmatDialogView = ({ state, onClose, setValue, getValues }) => {
  const { open, huIdx, itemIdx } = state;
  const [errors, setErrors] = useState({});

  const emptyHazmat = {
    unNumber: '',
    shippingName: '',
    packagingGroup: '',
    hazmatClass: '',
    weight: '',
    weightUnit: 'lbs',
    technicalName: '',
    contactPhone: '',
    description: '',
    limitedQuality: false,
    marinePollutant: false,
    residueLastContained: false,
    reportableQuantity: false,
    dotExemption: false,
  };

  const [localData, setLocalData] = useState(emptyHazmat);

  useEffect(() => {
    if (open) {
      // 1. Clear any previous errors from the last item
      setErrors({});
      // 2. Fetch data for the SPECIFIC item currently being edited 
      const existingData = getValues(`doDetails.handlingUnits.${huIdx}.items.${itemIdx}.hazmatData`);
      if (existingData) {
        setLocalData(existingData);
      } else {
        // 3. CRITICAL: If Item 2 is new, reset to empty so Item 1's data doesn't persist
        setLocalData(emptyHazmat);
      }
    }
  }, [open, huIdx, itemIdx, getValues]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} sx={{
      '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
        width: '1000px',
        height: 'auto',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>Hazmat Info</DialogTitle>

      <DialogContent sx={{ mt: 2, pb: 4 }}>
        {/* Row 1: UN, Shipping Name, PKG Group, Class */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField select label="UN Number *" variant="standard" fullWidth value={localData.unNumber} disabled>
              <MenuItem value="UN1567">UN1567</MenuItem>
            </StyledTextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField select label="Shipping Name *" variant="standard" fullWidth value={localData.shippingName} disabled>
              <MenuItem value="Hazard Substance,liquid.n.o.s">Hazard Substance,liquid.n.o.s</MenuItem>
            </StyledTextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField label="Packaging Group *" variant="standard" fullWidth value={localData.packagingGroup} disabled />
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField label="Class *" variant="standard" fullWidth value={localData.hazmatClass} disabled />
          </Box>
        </Box>



        {/* Row 2: Weight, Technical Name, Contact Phone */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 22%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <Box display={'flex'} alignItems={'flex-end'}>
              <StyledTextField label="Weight *" variant="standard" fullWidth value={localData.weight} disabled />
              <StyledTextField select variant="standard" value={localData.weightUnit} disabled sx={{ width: '80px' }}>
                <MenuItem value="lbs">lbs</MenuItem>
                <MenuItem value="kgs">kgs</MenuItem>
              </StyledTextField>
            </Box>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField label="Technical Name *" variant="standard" fullWidth value={localData.technicalName} disabled />
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <StyledTextField
              label="Contact phone *"
              variant="standard"
              fullWidth
              value={localData.contactPhone || ''}
              inputProps={{ maxLength: 20 }}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone || ''}
              disabled
            />
          </Box>
          <Box sx={{ flex: '1 1 22%' }} /> {/* Empty Flex Item for alignment */}
        </Box>



        {/* Bottom Section: Description and Checkbox Columns */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Hazmat Description - Fieldset Style */}
          <Box sx={{ flex: '2 1 400px', border: '1px solid #ccc', borderRadius: '8px', p: 2, position: 'relative', minHeight: '120px' }}>
            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
              Hazmat Description
            </Typography>
            <StyledTextField
              multiline
              fullWidth
              rows={4}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              value={localData.description}
              disabled
              sx={{ mt: 1 }}
            />
          </Box>



          {/* Checkbox Column 1 */}
          <Box sx={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel control={<Checkbox size="small" checked={localData.limitedQuality} disabled />} label={<Typography variant="body2">Limited Quality</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.marinePollutant} disabled />} label={<Typography variant="body2">Marine Pollutant</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.residueLastContained} disabled />} label={<Typography variant="body2">Residue Last Contained</Typography>} />
          </Box>



          {/* Checkbox Column 2 */}
          <Box sx={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel control={<Checkbox size="small" checked={localData.reportableQuantity} disabled />} label={<Typography variant="body2">Reportable Quantity</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.dotExemption} disabled />} label={<Typography variant="body2">DOT Exemption</Typography>} />
          </Box>
        </Box>
      </DialogContent>



      <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// hazmat modal component
const HazmatDialog = ({ state, onClose, setValue, getValues }) => {
  const { open, huIdx, itemIdx } = state;
  const [errors, setErrors] = useState({});

  const emptyHazmat = {
    unNumber: '',
    shippingName: '',
    packagingGroup: '',
    hazmatClass: '',
    weight: '',
    weightUnit: getValues(`handlingUnits.${huIdx}.weightUnit`) || '',
    technicalName: '',
    contactPhone: '',
    description: '',
    limitedQuality: false,
    marinePollutant: false,
    residueLastContained: false,
    reportableQuantity: false,
    dotExemption: false,
  };

  const [localData, setLocalData] = useState(emptyHazmat);

  useEffect(() => {
    if (open) {
      // 1. Clear any previous errors from the last item
      setErrors({});
      // 2. Fetch data for the SPECIFIC item currently being edited 
      const existingData = getValues(`handlingUnits.${huIdx}.items.${itemIdx}.hazmatData`);
      if (existingData) {
        setLocalData(existingData);
      } else {
        // 3. CRITICAL: If Item 2 is new, reset to empty so Item 1's data doesn't persist
        setLocalData(emptyHazmat);
      }
    }
  }, [open, huIdx, itemIdx, getValues]);



  if (!open) return null;



  const handleSave = () => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}.*$/;
    // Final check before saving 
    if (!localData.contactPhone || !phoneRegex.test(localData.contactPhone)) {
      setErrors(prev => ({
        ...prev,
        contactPhone: !localData.contactPhone ? 'Phone number is required' : 'Invalid phone format'
      }));
      return; // Block save if invalid [cite: 15]
    }

    setValue(`handlingUnits.${huIdx}.items.${itemIdx}.hazmatData`, localData);
    onClose();
  };



  const handleChange = (field, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };



  return (
    <Dialog open={open} onClose={onClose} sx={{
      '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
        width: '1000px',
        height: 'auto',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>Hazmat Info</DialogTitle>

      <DialogContent sx={{ mt: 2, pb: 4 }}>
        {/* Row 1: UN, Shipping Name, PKG Group, Class */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField select label="UN Number" required variant="standard" fullWidth value={localData.unNumber} onChange={(e) => handleChange('unNumber', e.target.value)}>
              <MenuItem value="UN1567">UN1567</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField select label="Shipping Name" required variant="standard" fullWidth value={localData.shippingName} onChange={(e) => handleChange('shippingName', e.target.value)}>
              <MenuItem value="Hazard Substance,liquid.n.o.s">Hazard Substance,liquid.n.o.s</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField label="Packaging Group" required variant="standard" fullWidth value={localData.packagingGroup} onChange={(e) => handleChange('packagingGroup', e.target.value)} />
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField label="Class" required variant="standard" fullWidth value={localData.hazmatClass} onChange={(e) => handleChange('hazmatClass', e.target.value)} />
          </Box>
        </Box>



        {/* Row 2: Weight, Technical Name, Contact Phone */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 25%', }}>
            <Box display={'flex'} alignItems={'flex-end'}>
              <TextField
                label="Weight"
                required
                variant="standard"
                fullWidth
                value={localData.weight || ''} // Fallback to empty string if undefined
                error={!!errors.weight} // Assumes you have an errors object like other fields
                helperText={errors.weight || ''}
                onChange={(e) => {
                  let val = e.target.value;

                  // 1. Instantly strip out any characters that are NOT digits or periods
                  val = val.replace(/[^0-9.]/g, '');

                  // 2. Prevent entering multiple decimal points (e.g., 12.5.5 becomes 12.55)
                  const splitValue = val.split('.');
                  if (splitValue.length > 2) {
                    val = `${splitValue[0]}.${splitValue.slice(1).join('')}`;
                  }

                  // 3. Update the state with the cleaned numeric string
                  handleChange('weight', val);

                  // 4. Real-time validation logic (optional, matching your other form fields)
                  if (!val) {
                    setErrors(prev => ({ ...prev, weight: 'Weight is required' }));
                  } else {
                    setErrors(prev => ({ ...prev, weight: null }));
                  }
                }}
                // Hints mobile browsers to show a decimal-friendly numeric pad
                inputProps={{ inputMode: 'decimal' }}
              />

              <TextField select variant="standard" value={localData.weightUnit} onChange={(e) => handleChange('weightUnit', e.target.value)} sx={{ width: '80px' }} disabled>
                <MenuItem value="lbs">lbs</MenuItem>
                <MenuItem value="kgs">kgs</MenuItem>
              </TextField>
            </Box>
          </Box>
          <Box sx={{ flex: '1 1 25%' }}>
            <TextField label="Technical Name" required variant="standard" fullWidth value={localData.technicalName} onChange={(e) => handleChange('technicalName', e.target.value)} />
          </Box>
          <Box sx={{ flex: '1 1 28%' }}>

            <TextField
              label="Contact phone"
              required
              variant="standard"
              fullWidth
              value={localData.contactPhone || ''}
              inputProps={{ maxLength: 20 }}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith(' ')) return; // Prevent leading spaces

                // Apply the same formatting mask used in Step 1 
                const formattedValue = formatPhoneNumber(val).slice(0, 20);
                // Update data
                handleChange('contactPhone', formattedValue);

                // Real-time Validation Logic 
                const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}.*$/;

                // 1. Extract raw digits only (e.g., "00000000000000")
                const numericDigits = formattedValue.replace(/\D/g, '');

                // 2. Check if the string starts with 10 or more consecutive zeros
                const startsWithTenZeros = /^0{10}/.test(numericDigits);

                if (!formattedValue) {
                  setErrors(prev => ({ ...prev, contactPhone: 'Phone number is required' }));
                } else if (startsWithTenZeros) {
                  // 3. Flags any input that begins with ten zeros
                  setErrors(prev => ({ ...prev, contactPhone: 'Invalid phone number (cannot start with ten zeros)' }));
                } else if (!phoneRegex.test(formattedValue)) {
                  setErrors(prev => ({ ...prev, contactPhone: 'Invalid phone format' }));
                } else {
                  setErrors(prev => ({ ...prev, contactPhone: null }));
                }
              }}
            />


          </Box>
          <Box sx={{ flex: '1 1 22%' }} /> {/* Empty Flex Item for alignment */}
        </Box>



        {/* Bottom Section: Description and Checkbox Columns */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Hazmat Description - Fieldset Style */}
          <Box sx={{ flex: '2 1 400px', border: '1px solid #ccc', borderRadius: '8px', p: 2, position: 'relative', minHeight: '120px' }}>
            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
              Hazmat Description
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={4}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              value={localData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              sx={{ mt: 1 }}
            />
          </Box>



          {/* Checkbox Column 1 */}
          <Box sx={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel control={<Checkbox size="small" checked={localData.limitedQuality} onChange={(e) => handleChange('limitedQuality', e.target.checked)} />} label={<Typography variant="body2">Limited Quality</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.marinePollutant} onChange={(e) => handleChange('marinePollutant', e.target.checked)} />} label={<Typography variant="body2">Marine Pollutant</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.residueLastContained} onChange={(e) => handleChange('residueLastContained', e.target.checked)} />} label={<Typography variant="body2">Residue Last Contained</Typography>} />
          </Box>



          {/* Checkbox Column 2 */}
          <Box sx={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel control={<Checkbox size="small" checked={localData.reportableQuantity} onChange={(e) => handleChange('reportableQuantity', e.target.checked)} />} label={<Typography variant="body2">Reportable Quantity</Typography>} />
            <FormControlLabel control={<Checkbox size="small" checked={localData.dotExemption} onChange={(e) => handleChange('dotExemption', e.target.checked)} />} label={<Typography variant="body2">DOT Exemption</Typography>} />
          </Box>
        </Box>
      </DialogContent>



      <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ ...commonBtnStyle, bgcolor: '#a22', px: 4, '&:hover': { bgcolor: '#811' } }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// commodity list table
const CommoditiesList = ({ watchedHU }) => {
  const calculateTotals = (huArray) => {
    let totalHU = 0, totalPieces = 0, totalHM = 0, totalWeight = 0;
    huArray?.forEach((hu) => {
      totalHU += Number(hu.unitsCount || 0);
      hu.items?.forEach((item) => {
        totalPieces += Number(item.pieces || 0);
        if (item.hazmatInfo) totalHM += 1;
      });
      totalWeight += Number(hu.weight || 0);
    });
    return { totalHU, totalPieces, totalHM, totalWeight };
  };



  const totals = calculateTotals(watchedHU);
  const cellStyle = { border: '1px solid #ccc', padding: '6px', fontSize: '0.7rem' };
  const headerBg = { backgroundColor: '#f5f5f5', fontWeight: 'bold' };



  return (
    <Box sx={{ mt: 4, overflowX: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Commodities List</Typography>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <tbody>
          {watchedHU?.map((hu, huIdx) => (
            <React.Fragment key={huIdx}>
              {/* --- DYNAMIC HEADER PER HANDLING UNIT --- */}
              <tr style={headerBg}>
                <td style={cellStyle} colSpan={2}>Handling Unit {huIdx + 1}</td>
                <td style={cellStyle} colSpan={2}>Piece</td>
                <td style={cellStyle} rowSpan={2}>HM</td>
                <td style={cellStyle} rowSpan={2}>Commodity Description</td>
                <td style={cellStyle} rowSpan={2}>Weight lbs</td>
                <td style={cellStyle} rowSpan={2}>Freight Class</td>
                <td style={cellStyle} colSpan={3}>Dimensions</td>
              </tr>
              <tr style={headerBg}>
                <td style={cellStyle}>Type</td><td style={cellStyle}>QTY</td>
                <td style={cellStyle}>Type</td><td style={cellStyle}>QTY</td>
                <td style={cellStyle}>L</td><th style={cellStyle}>W</th><th style={cellStyle}>H</th>
              </tr>



              {/* --- ITEMS DATA --- */}
              {hu.items?.map((item, itmIdx) => (
                <tr key={itmIdx}>
                  {/* HU Type/QTY spans all items in this specific HU */}
                  {itmIdx === 0 ? (
                    <>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.uom}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.unitsCount}</td>
                    </>
                  ) : null}
                  <td style={cellStyle}>{item.piecesUom}</td>
                  <td style={cellStyle}>{item.pieces}</td>
                  <td style={cellStyle}>{item.hazmatInfo ? 'X' : '-'}</td>
                  <td style={{ ...cellStyle, textAlign: 'left', color: item.hazmatInfo ? '#a22' : 'inherit' }}>
                    {item.hazmatInfo && item.hazmatData
                      ? `${item.hazmatData.unNumber}, ${item.hazmatData.shippingName}, (${item.hazmatData.technicalName}), ${item.hazmatData.hazmatClass}, ${item.hazmatData.weight} lbs`
                      : item.description}
                  </td>
                  {/* Dimensions/Weight/Class spans all items in this specific HU */}
                  {itmIdx === 0 ? (
                    <>
                      <td style={cellStyle} rowSpan={hu.items.length}>
                        {hu.weightUnit === 'lbs'
                          ? `${hu.weight}`
                          : `${(Number(hu.weight) * 2.20462).toFixed(2)}`
                        }
                      </td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.class}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.length}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.width}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.height}</td>
                    </>
                  ) : null}
                </tr>
              ))}
              {/* Spacer row between units for visual clarity */}
              <tr><td colSpan={11} style={{ border: 'none', height: '10px' }}></td></tr>
            </React.Fragment>
          ))}
        </tbody>



        {/* --- GRAND TOTAL FOOTER --- */}
        <tfoot style={{ fontWeight: 'bold', backgroundColor: '#fff' }}>
          <tr>
            <td style={cellStyle}>Total H/U</td>
            <td style={cellStyle}>{totals.totalHU}</td>
            <td style={cellStyle}>Piece</td>
            <td style={cellStyle}>{totals.totalPieces}</td>
            <td style={cellStyle}>{totals.totalHM}</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>Total Shipping Weight</td>
            <td style={cellStyle}>{totals.totalWeight}</td>
            <td style={cellStyle} colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
    </Box>
  );
};

const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid #000',
        // Dark red for active/completed, white for pending
        backgroundColor: active || completed ? '#a22' : '#fff',
        color: active || completed ? '#fff' : '#000',
        fontWeight: 'bold',
        zIndex: 1,
      }}
    >
      {icon}
    </Box>
  );
};

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 16, // Adjust this to center the line with your 32px circles
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#a22', // Red line for the current path
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#a22', // Red line for finished steps
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#000', // Black line for upcoming steps
    borderTopWidth: 3,    // Makes the line thick as seen in your image
    borderRadius: 1,
  },
}));



const PickupAccessorialDialog = ({ open, onClose, onSave, setActionType, setAddAccModal, addAccModal,
  actionType, MASTER_ACCESSORIALS, setMASTER_Accessorials }) => {
  const dispatch = useDispatch();
  // const [list, setList] = useState(MASTER_ACCESSORIALS);
  // const [editAccIndex, setEditAccIndex] = useState(null);

  const handleToggle = (index) => {
    const newList = [...MASTER_ACCESSORIALS];
    newList[index].selected = !newList[index].selected;
    setMASTER_Accessorials(newList);
  };

  const handleSave = () => {
    const selectedItems = MASTER_ACCESSORIALS.filter(item => item.selected);
    onSave(selectedItems);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Accessorial Details</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              // on click of add accessorial previous dialog have to be added for add accessorial details
              onClick={() => {
                dispatch(setAccessorialDropdown([]));
                dispatch(getAccessorialDropdown());
                setActionType('Add');
                // open the add accessorial dialog here
                setAddAccModal(true);
              }} // Opens the Dialog
              sx={{ bgcolor: '#a22', textTransform: 'none' }}
            >
              Add Accessorial
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Accessorial Name</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charge Type</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charges</TableCell>
                  {/* <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Notes</TableCell> */}
                  {/* <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Action</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(MASTER_ACCESSORIALS) ? MASTER_ACCESSORIALS : [])?.map((item, index) => (
                  <TableRow key={index} selected={item.selected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={item?.selected || false}
                        onChange={() => handleToggle(index)}
                        sx={{ color: '#001a41', '&.Mui-checked': { color: '#001a41' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{item.accessorialName}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{item.chargeType}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{item.chargeValue}</TableCell>
                    {/* <TableCell>
                      {item.notes && <Iconify icon="solar:file-text-bold" sx={{ color: '#90caf9' }} />}
                    </TableCell> */}
                    {/* <TableCell align="right">
                      <IconButton size="small" onClick={() => {
                        setActionType('View');
                        setAddAccModal(true);
                        setEditAccIndex(index);
                      }}><Iconify icon="solar:eye-bold" /></IconButton>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ color: '#000', borderColor: '#000' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#a22' }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* <AddAccessorialDialog
        open={addAccModal}
        onClose={() => {
          setAddAccModal(false);
          setActionType('');
          setEditAccIndex(null);
        }}
        // onSave={(selectedData) => replacePickupAcc(selectedData)}
        setActionType={setActionType}
        setAddAccModal={setAddAccModal}
        addAccModal={addAccModal}
        actionType={'View'}
        accFields={MASTER_ACCESSORIALS}
        editAccIndex={editAccIndex}
      /> */}
    </>
  );
};
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
                      // FIX: MUI Select cannot handle null. If value is null/undefined, use ''
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
                        MenuProps: {
                          // Crucial: disables internal centering logic so origins work
                          getContentAnchorEl: null,
                          // Prevents layout shifts and menu misplacement on scroll
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
                              marginTop: '4px', // Your custom gap
                              maxHeight: 300,
                              maxWidth: 300    // Recommended to prevent long lists from going off-screen
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
                onClick={onClose}
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
// to alculate freight class
const getFreightClass = (length, width, height, lbs) => {
  // 1. Calculate Cubic Feet
  // (L * W * H in inches) / 1728 = Cubic Feet
  const cubicInches = length * width * height;
  const cubicFeet = cubicInches / 1728;

  // 2. Calculate Density (PCF)
  const density = lbs / cubicFeet;

  // 3. Return Class based on your specific density table
  if (density > 50) return '50';
  if (density >= 35) return '55';
  if (density >= 30) return '60';
  if (density >= 22.5) return '65';
  if (density >= 15) return '70';
  if (density >= 12) return '85';
  if (density >= 10) return '92.5';
  if (density >= 8) return '100';
  if (density >= 6) return '125';
  if (density >= 4) return '175';
  if (density >= 2) return '250';
  if (density >= 1) return '300';
  return '400'; // Less than 1 lb/cu ft
}
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
                  disabled={!isRateEditing} // Editable ONLY when isEditing is true
                  variant="outlined"
                  sx={{
                    bgcolor: isRateEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                    '& .MuiOutlinedInput-input': { p: '4px 8px' },
                    '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                            disabled={!isInputEditing} // Editable ONLY when isInputEditing is true
                            variant="outlined"
                            // Add this section:
                            InputProps={{
                              endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                            }}
                            sx={{
                              bgcolor: isInputEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                              '& .MuiOutlinedInput-input': { p: '4px 8px' },
                              '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                            disabled={!isInputEditing}
                            variant="outlined"
                            // Add this section:
                            InputProps={{
                              endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
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
                      disabled={!isEditing} // Editable ONLY when isEditing is true
                      variant="outlined"
                      sx={{
                        bgcolor: isEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                        '& .MuiOutlinedInput-input': { p: '4px 8px' },
                        '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
// DO Details popup dialog
const DoDetailsDialog = ({ open, onClose, getValues, setValue, control, doDetailsFields, isHazmatSelectedInDoDetails }) => {
  const [hazmatModal, setHazmatModal] = useState({ open: false, huIdx: null, itemIdx: null });
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{
      '& .MuiDialog-paper': { // Target the paper class
        width: '1545px',
        height: '700px',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Do Details</DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 4, borderBottom: ' 1px solid rgba(143, 143, 143, 1)' }}>
            Commodities Details
          </Typography>

          {doDetailsFields.map((doDetail, doDetailIdx) => (
            <Paper key={doDetail.id} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2, position: 'relative' }}>
              {/* Label on Border */}
              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                Handling Unit {doDetailIdx + 1}
              </Typography>

              {/* Handling Unit Dimensions Row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 120px' }}>
                  <Controller
                    name={`doDetails.handlingUnits.${doDetailIdx}.uom`}
                    control={control}
                    render={({ field: { ref, ...fieldProps } }) => ( // 1. Pull ref out to protect the wrapper
                      <StyledTextField
                        {...fieldProps}
                        inputRef={ref} // 2. Forward the validation tracker safely
                        select
                        fullWidth
                        label="Handling Units UOM *"
                        variant="standard"
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{
                          displayEmpty: true,
                          MenuProps: {
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
                        disabled
                      >
                        {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map(u => (
                          <MenuItem key={u} value={u}>
                            {u}
                          </MenuItem>
                        ))}
                      </StyledTextField>
                    )}
                  />



                </Box>
                <Box sx={{ flex: '1 1 100px' }}>
                  <Controller name={`doDetails.handlingUnits.${doDetailIdx}.unitsCount`} control={control} render={({ field }) => (
                    <StyledTextField {...field} fullWidth label="Handling Units *" variant="standard" InputLabelProps={{ shrink: true }} disabled />
                  )} />
                </Box>
                <Box sx={{ flex: '1 1 80px' }}>
                  <Controller name={`doDetails.handlingUnits.${doDetailIdx}.unit`} control={control} render={({ field }) => (
                    <StyledTextField {...field} select fullWidth label="Unit *" variant="standard" InputLabelProps={{ shrink: true }} disabled>
                      <MenuItem value="in">in</MenuItem>
                      <MenuItem value="cm">cm</MenuItem>
                    </StyledTextField>
                  )} />
                </Box>
                {['Length', 'Width', 'Height'].map((dim) => (
                  <Box key={dim} sx={{ flex: '1 1 80px', }}>
                    <Box display={'flex'} alignItems={'flex-end'}>
                      <Controller name={`doDetails.handlingUnits.${doDetailIdx}.${dim.toLowerCase()}`} control={control} render={({ field }) => (
                        <StyledTextField {...field} fullWidth label={`Handling ${dim}`} variant="standard" InputLabelProps={{ shrink: true }} disabled />
                      )} />
                    </Box>
                  </Box>
                ))}
                <Box sx={{ flex: '1 1 70px' }}>
                  <Box display={'flex'} alignItems={'flex-end'}>
                    <Controller name={`doDetails.handlingUnits.${doDetailIdx}.weight`} control={control} render={({ field }) => (
                      <StyledTextField {...field} fullWidth label="Weight" variant="standard" InputLabelProps={{ shrink: true }} disabled />
                    )} />
                    <Controller name={`doDetails.handlingUnits.${doDetailIdx}.weightUnit`} control={control} render={({ field }) => (
                      <StyledTextField {...field} select sx={{ width: '100px' }} label="" variant="standard" InputLabelProps={{ shrink: true }} disabled>
                        <MenuItem value="lbs">lbs</MenuItem>
                        <MenuItem value="kgs">kgs</MenuItem>
                      </StyledTextField>
                    )} />
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 120px' }}>
                  <Controller
                    name={`doDetails.handlingUnits.${doDetailIdx}.class`}
                    control={control}
                    render={({ field }) => (
                      <StyledTextField
                        {...field}
                        fullWidth
                        label="Class"
                        variant="standard"
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{
                          displayEmpty: true,
                          // This ensures the input only shows the value, not the "(Recommended)" text
                          renderValue: (selected) => selected || <em>Select Class</em>,
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
                        disabled
                      />
                    )}
                  />

                </Box>
              </Box>



              {/* Dynamic Items List */}
              <ItemsSectionView
                huIndex={doDetailIdx}
                control={control}
                watchedHU={getValues(`doDetails.handlingUnits`)}
                openHazmat={(hu, itm) => setHazmatModal({ open: true, huIdx: hu, itemIdx: itm })}
                hazmatModal={hazmatModal}
                getValues={getValues}
                setValue={setValue}
                setHazmatModal={setHazmatModal}
              />
            </Paper>
          ))}


          {/* Emergency Contact: Conditional Render */}
          {isHazmatSelectedInDoDetails && (
            <Paper variant="outlined" sx={{ p: 3, mt: 4, borderRadius: 2, position: 'relative' }}>
              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                Emergency Contact
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                <Box sx={{ flex: '1 1 30%' }}>
                  <Controller name="doDetails.emergencyContactName" control={control} render={({ field }) => (
                    <StyledTextField {...field} fullWidth label="Contact Name *" variant="standard" disabled />
                  )} />
                </Box>
                <Box sx={{ flex: '1 1 30%' }}>
                  <Controller name="doDetails.emergencyContactPhone" control={control} render={({ field }) => (
                    <StyledTextField {...field} fullWidth label="Phone Number *" variant="standard"
                      disabled
                    />
                  )} />
                </Box>
              </Box>
            </Paper>
          )}

          {/* Commodities List Table */}
          <CommoditiesList watchedHU={getValues(`doDetails.handlingUnits`)} />
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// customer Rate pop up dialog box
const CustomerRateDialog = ({ open, onClose, getValues, setValue, control, totals, customerRateAccFields, appendCustomerRateAccFields, watchedHU, masterAccessorials }) => {
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
                      disabled={!isRateEditing} // Editable ONLY when isEditing is true
                      variant="outlined"
                      sx={{
                        bgcolor: isRateEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                        '& .MuiOutlinedInput-input': { p: '4px 8px' },
                        '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                      disabled={!isFuelSurchargeEditing} // Editable ONLY when isEditing is true
                      variant="outlined"
                      sx={{
                        bgcolor: isFuelSurchargeEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                        '& .MuiOutlinedInput-input': { p: '4px 8px' },
                        '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                                disabled={!isInputEditing} // Editable ONLY when isInputEditing is true
                                variant="outlined"
                                // Add this section:
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                                }}
                                sx={{
                                  bgcolor: isInputEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                                  '& .MuiOutlinedInput-input': { p: '4px 8px' },
                                  '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                                disabled={!isInputEditing}
                                variant="outlined"
                                // Add this section:
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
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
                          disabled={!isEditing} // Editable ONLY when isEditing is true
                          variant="outlined"
                          sx={{
                            bgcolor: isEditing ? '#e3f2fd' : '#fff', // Visual cue for editing
                            '& .MuiOutlinedInput-input': { p: '4px 8px' },
                            '& .Mui-disabled': { WebkitTextFillColor: '#000', cursor: 'default' } // Keep text black when disabled
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
                        <Typography variant="body2">{getValues(`customerRate.customerAccessorials.[${index}].chargevalue`)}</Typography>
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
                  <Typography variant="subtitle2" fontWeight={'700'}>$ {getValues('customerRate.apiRate')}</Typography>
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
          if (Number(getValues('customerRate.apiRate')) === Number(getValues('customerRate.rate'))) {
            onClose();
          } else {
            setInvoiceApprovalModal(true);
          }
        }} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>

  );
};


const ShipmentForm = ({ type }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useSelector((state) => state?.shipmentdata?.isLoading);
  const customerStationDropdown = useSelector((state) => state?.shipmentdata?.customerStationDropdown);
  const carrierTerminalDropdown = useSelector((state) => state?.shipmentdata?.carrierTerminalDropdown);
  const shipperDropdown = useSelector((state) => state?.shipmentdata?.shipperDropdown);
  const consigneeDropdown = useSelector((state) => state?.shipmentdata?.consigneeDropdown);
  const shipperAirlineDropdown = useSelector((state) => state?.shipmentdata?.shipperAirlineDropdown);
  const consigneeAirlineDropdown = useSelector((state) => state?.shipmentdata?.consigneeAirlineDropdown);
  const pickupAccessorialsByEntityId = useSelector((state) => state?.shipmentdata?.pickupAccessorials);
  const linehaulAccessorialsByEntityId = useSelector((state) => state?.shipmentdata?.linehaulAccessorials);
  const deliveryAccessorialsByEntityId = useSelector((state) => state?.shipmentdata?.deliveryAccessorials);
  const stationAccessorialData = useSelector((state) => state?.shipmentdata?.stationAccessorialData);
  const shipmentSuccess = useSelector((state) => state?.shipmentdata?.shipmentSuccess);
  const shipmentError = useSelector((state) => state?.shipmentdata?.error);
  const [customerSearchValue, setCustomerSearchValue] = useState('');

  const [carrierPickupSearchValue, setCarrierPickupSearchValue] = useState('');
  const [carrierLinehaulSearchValue, setCarrierLinehaulSearchValue] = useState('');
  const [carrierDeliverySearchValue, setCarrierDeliverySearchValue] = useState('');
  const [selectCarrierLinehaulSearchValue, setSelectCarrierLinehaulSearchValue] = useState('');
  const [selectCarrierPickupSearchValue, setSelectCarrierPickupSearchValue] = useState('');
  const [selectCarrierDeliverySearchValue, setSelectCarrierDeliverySearchValue] = useState('');

  const isSelectingCustomerRef = useRef(false);
  const isSelectingCarrierPickupRef = useRef(false);
  const isSelectingCarrierLinehaulRef = useRef(false);
  const isSelectingCarrierDeliveryRef = useRef(false);

  const isSelectingToCarrierPickupRef = useRef(false);
  const isSelectingToCarrierLinehaulRef = useRef(false);
  const isSelectingToCarrierDeliveryRef = useRef(false);

  const [activeStep, setActiveStep] = useState(0);
  const [errorVisible, setErrorVisible] = useState(false);
  // This state controls the opening, closing, and index of the Hazmat modal
  const [hazmatModal, setHazmatModal] = useState({ open: false, huIdx: null, itemIdx: null });
  const [shipmentStatusModal, setShipmentStatusModal] = useState(false);
  // for notes dialog
  const notesRef = useRef({});
  const notesRefArray = useRef([]);
  const notesRefArrayIndex = useRef(null);
  const notesRefArrayObj = useRef({});
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [openNotesDialogForShipmentAccs, setOpenNotesDialogForShipmentAccs] = useState(false);
  const [activeNotesIndex, setActiveNotesIndex] = useState(null);

  const [pickupAccModal, setPickupAccModal] = useState(false);
  const [lineHaulAccModal, setLineHaulAccModal] = useState(false);
  const [deliveryAccModal, setDeliveryAccModal] = useState(false);

  const [addPickUpAccModal, setAddPickUpAccModal] = useState(false);
  const [addLineHaulAccModal, setAddLineHaulAccModal] = useState(false);
  const [addDeliveryAccModal, setAddDeliveryAccModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [handlingUnitWtFlag, setHandlingUnitWtFlag] = useState(false);
  const [doDetailsModal, setDoDetailsModal] = useState(false);
  const [custommerRateModal, setCustomerRateModal] = useState(false);
  const [editAccIndex, setEditAccIndex] = useState(null);
  const [activeAccType, setActiveAccType] = useState('');
  const [PICKUP_MASTER_ACCESSORIALS, setPICKUP_MASTER_Accessorials] = useState([]);
  const [LINEHAUL_MASTER_ACCESSORIALS, setLINEHAUL_MASTER_Accessorials] = useState([]);
  const [DELIVERY_MASTER_ACCESSORIALS, setDELIVERY_MASTER_Accessorials] = useState([]);
  const [CUSTOMER_MASTER_ACCESSORIALS, setCUSTOMER_MASTER_ACCESSORIALS] = useState([]);

  // for select carrier selection
  const [carrierTerminalSelectError, setCarrierTerminalSelectError] = useState(false);
  const [shipmentErrorFlag, setShipmentErrorFlag] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const filter = createFilterOptions();

  const {
    control,
    trigger,
    formState: { errors },
    reset,
    getValues, setValue, handleSubmit

  } = useForm({
    mode: 'onChange',

    defaultValues: {

      // Step 0 

      shipmentType: '',

      serviceLevel: '',

      date: null,

      time: null,

      // Step 1 - Customer 

      billingCustomer: '',
      airportPickupService: false,
      originAirport: '',
      airportDeliveryService: false,
      destinationAirport: '',

      // Step 1 - Shipper 

      shipperName: '',

      shipperAddr1: '',

      shipperAddr2: '',

      shipperCity: '',

      shipperState: '',

      shipperZip: '',

      shipperContact: '',

      shipperPhone: '',

      // Step 1 - Consignee 

      consigneeName: '',

      consigneeAddr1: '',

      consigneeAddr2: '',

      consigneeCity: '',

      consigneeState: '',

      consigneeZip: '',

      consigneeContact: '',

      consigneePhone: '',

      // Step 2 - Handling Units 

      handlingUnits: [{
        uom: '', unitsCount: '', unit: 'in', length: '', width: '', height: '', weight: '', weightUnit: 'lbs', class: '', calculatedFC: '', freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
        items: [{ pieces: '', piecesUom: '', description: '', hazmatInfo: false }]
      }],
      emergencyContactName: '',
      emergencyContactPhone: '',

      doDetails: {
        handlingUnits: [{
          uom: 'Skid', unitsCount: '02', unit: 'in', length: '20', width: '20', height: '20', weight: '200', weightUnit: 'lbs', class: '30', calculatedFC: '', freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
          items: [{
            pieces: '50', piecesUom: 'Skid', description: '24 Bottles of Nitric acid', hazmatInfo: true, hazmatData: {

              "contactPhone": "(456) 456-5653",
              "description": "desc",
              "dotExemption": true,
              "hazmatClass": "4",
              "limitedQuality": true,
              marinePollutant: true,
              packagingGroup: "4",
              reportableQuantity: true,
              residueLastContained: true,
              shippingName: "Hazard Substance,liquid.n.o.s",
              technicalName: "tech",
              unNumber: "UN1567",
              weight: "4",
              weightUnit: "lbs"
            }
          }]
        }],
        emergencyContactName: 'Name',
        emergencyContactPhone: '123-456-7890',
      },

      // shipment status
      shipmentStatus: {
        status: 'New Shipment',
        date: null,
        time: null,
        location: '',
        comments: '',
        signature: '',
        deliveryDate: null,
        deliveryTime: null,
        appointmentDate: null,
        appointmentTime: null,
        shipmentStatusTable: []
      },

      // step 3 - Carrier Information
      carrierInfo: {
        orderReceivedPending: false,
        airportPickup: false,
        selectCarrier: '',
        fromLocation: '',
        isManualFromLocation: false,
        isManualToLocation: false,
        manualAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          zip: ''
        },
        manualToAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          zip: ''
        },
        pickupAgentTerminal: true,
        toLocationType: '',
        toLocation: '',
        addPickupAccessorial: true,
        pickupAlert: true,
        selectRouting: 'pickup_only',
        airportTransfer: false,
        pickupAccessorials: [],
        pickupAlertDetails: {
          inboundNotesArray: ['Please setup for pickup today ____ and drop to Forward Air',
            'Setup for pickup today ____ ',
            'Drop to Forward Air',
          ],
          pickupNotes: '',
          primaryEmail: '',
          additionalEmail: '',
          additionalEmailsArray: [],
        },
        lineHaul: {
          selectRouting: '',
          // selectRouting: 'linehaul_only',
          carrier: '',
          billNumber: "",
          toggleAddress: 'linehaul',
          fromLocation: '',
          manualFromLocation: false,
          manualFromLocationDetails: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            zip: '',
          },
          toLocationType: '',
          toLocation: '',
          manualToLocation: false,
          manualToLocationDetails: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            zip: '',
          },
          etaDate: null,
          etaTime: null,
          pcs: '',
          weight: '',
          linehaulAddAcc: false,
          linehaulAccessorials: [],
          lineHaulNotesArr: ['Please setup for pickup today ____ and drop to Forward Air',
            'Setup for pickup today ____ ',
            'Drop to Forward Air',
          ],
          lineHaulNotes: '',
          deliveryIncluded: false,
          airportTransfer: false,
        },
        deliveryDetails: {
          carrier: '',
          disableDeliveryFromCarrier: false,
          billNumber: "",
          fromLocation: '',
          manualFromLocation: false,
          manualFromLocationDetails: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            zip: '',
          },
          toLocationType: 'Consignee',
          toLocation: '',
          manualToLocation: false,
          manualToLocationDetails: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            zip: '',
          },
          // agent: '',
          etaDate: null,
          etaTime: null,
          pcs: '',
          weight: '',
          deliveryAddAcc: false,
          deliveryAlert: true,
          deliveryAccessorials: [],
          lineHaulNotesArr: ['Please setup for pickup today ____ and drop to Forward Air',
            'Setup for pickup today ____ ',
            'Drop to Forward Air',],
          lineHaulNotes: '',
          deliveryNotesArr: ['Please setup for pickup today ____ and drop to Forward Air',
            'Setup for pickup today ____ ',
            'Drop to Forward Air',],
          deliveryNotes: '',
          primaryEmail: '',
          additionalEmail: '',
          additionalEmailsArray: [],
          airportTransfer: false,
        }
      },

      // step 4 - Carrier Rates
      carrierRates: {
        pickUp: {
          pickUpCarrier: '',
          pickUpRate: '',
          apiPickUpRate: '',
          invoiceNo: '',
          pickupAccessorials: [],
        },
        lineHaul: {
          lineHaulCarrier: '',
          lineHaulRate: '',
          apiLineHaulRate: '',
          invoiceNo: '',
          lineHaulAccessorials: [],
        },
        delivery: {
          deliveryCarrier: '',
          deliveryRate: '',
          apiDeliveryRate: '',
          invoiceNo: '',
          deliveryAccessorials: [],
        },
      },
      customerRate: {
        rate: '',
        apiRate: '',
        spotRate: false,
        fuelSurcharge: 'Fuel Surcharge (35% Charge)',
        fuelSurchargeRate: '',
        customerAccessorials: [],
        selectedAccToAdd: null,
      },

    },

  });

  const logError = (error, info) => {
    // Use an error reporting service here
    console.error("Error caught:", info);
    console.log(error);
  };

  const { fields: huFields, append: appendHU, remove: removeHU } = useFieldArray({ control, name: "handlingUnits" });
  const { fields: doDetailsFields, append: appendDoDetails, remove: removeDoDetails } = useFieldArray({ control, name: "doDetails.handlingUnits" });
  const { fields: customerRateAccFields, append: appendCustomerRateAccFields, } = useFieldArray({ control, name: "customerRate.customerAccessorials" });

  // Watch for any hazmat info selection to toggle Emergency Contact 
  const watchedHandlingUnits = useWatch({ control, name: "handlingUnits" });

  const showEmergencyContact = watchedHandlingUnits.some(hu =>
    hu?.items?.some(item => item.hazmatInfo)
  );
  const openHazmat = (huIdx, itemIdx) => {
    setHazmatModal({
      open: true,
      huIdx,
      itemIdx
    });
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
        unit: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        weightUnit: '',
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

  // This line defines watchedHU so the rest of the code can see the data
  const watchedHU = useWatch({
    control,
    name: 'handlingUnits',
  });
  const watchedDoDetails = useWatch({
    control,
    name: 'doDetails',
  });

  const watchedCarrierInfo = useWatch({
    control,
    name: 'carrierInfo',
  });
  const watchedCustomerRateInfo = useWatch({
    control,
    name: 'customerRate',
  });
  const { fields: carrierRatesPickUpAccessorials } = useFieldArray({ control, name: `carrierRates.pickUp.pickupAccessorials` });
  const { fields: carrierRatesLineHaulAccessorials } = useFieldArray({ control, name: `carrierRates.lineHaul.lineHaulAccessorials` });
  const { fields: carrierRatesDeliveryAccessorials } = useFieldArray({ control, name: `carrierRates.delivery.deliveryAccessorials` });
  const watchedCarrierRateInfo = useWatch({
    control,
    name: 'carrierRates',
  });
  // Boolean helper to check the checkbox state
  const isPickupPending = watchedCarrierInfo?.orderReceivedPending;

  const selectedRouting = useWatch({
    control,
    name: 'carrierInfo.selectRouting',
  });
  const lineHaulDeliveryIncluded = useWatch({
    control,
    name: 'carrierInfo.lineHaul.deliveryIncluded',
  });
  const liveShipmentStatus = useWatch({
    control,
    name: 'shipmentStatus.status',
  });

  // This checks if any item has hazmat checked to show the Emergency Contact
  const isHazmatSelected = watchedHU?.some((hu) =>
    hu.items?.some((item) => item.hazmatInfo)
  );
  const isHazmatSelectedInDoDetails = watchedDoDetails?.handlingUnits?.some((hu) =>
    hu.items?.some((item) => item.hazmatInfo)
  );
  const { fields: pickupAccFields, append: appendPickupAccFields, update: updatePickupAcc, replace: replacePickupAcc, remove: removePickupAcc } = useFieldArray({
    control,
    name: "carrierInfo.pickupAccessorials"
  });
  const { fields: lineHaulAccFields, append: appendLineHaulAccFields, update: updateLineHaulAcc, replace: replaceLineHaulAcc, remove: removeLineHaulAcc } = useFieldArray({
    control,
    name: "carrierInfo.lineHaul.linehaulAccessorials"
  });

  const { fields: deliveryAccFields, append: appendDeliveryAccFields, update: updateDeliveryAcc, replace: replaceDeliveryAcc, remove: removeDeliveryAcc } = useFieldArray({
    control,
    name: "carrierInfo.deliveryDetails.deliveryAccessorials"
  });
  const { fields: shipmentStatusTable, replace: replaceShipmentStatusTable, } = useFieldArray({
    control,
    name: "shipmentStatus.shipmentStatusTable"
  });

  const inboundNotes = useWatch({
    control,
    name: 'carrierInfo.pickupAlertDetails.inboundNotesArray',
  });
  const lineHaulNotesArr = useWatch({
    control,
    name: 'carrierInfo.lineHaul.lineHaulNotesArr',
  });
  const deliveryLineHaulNotesArr = useWatch({
    control,
    name: 'carrierInfo.deliveryDetails.lineHaulNotesArr',
  });
  const deliveryNotesArr = useWatch({
    control,
    name: 'carrierInfo.deliveryDetails.deliveryNotesArr',
  });

  const calculateTotals = (huArray) => {
    let totalHU = 0, totalPieces = 0, totalHM = 0, totalWeight = 0;

    huArray?.forEach((hu) => {
      totalHU += Number(hu.unitsCount || 0);
      hu.items?.forEach((item) => {
        totalPieces += Number(item.pieces || 0);
        if (item.hazmatInfo) totalHM += 1;
      });
      totalWeight += Number(hu.weight || 0);
    });

    return {
      totalHU,
      totalPieces,
      totalHM,
      // If totalWeight is 0, return an empty string, otherwise return the number
      totalWeight: totalWeight === 0 ? "" : totalWeight
    };
  };

  const totals = calculateTotals(watchedHU);

  const hasInitialData = () => {
    const values = getValues();

    // Check if contact info is filled
    const hasContactInfo = !!(values.emergencyContactName || values.emergencyContactPhone);

    // Check if handling units have been modified (e.g., checking if description exists)
    // or simply if the array is not empty/has more than 1 item
    const hasHandlingData = values.handlingUnits?.some(unit =>
      unit.items?.[0]?.description !== '' || // user changed default
      unit.weight !== ''
    );

    return hasContactInfo || hasHandlingData;
  };



  const handleBack = () => {
    console.log('Current Form Values:', getValues());
    setActiveStep((prev) => prev - 1);
    if (activeStep === 2 && hasInitialData()) {
      const currentValues = getValues();
      setValue('doDetails.handlingUnits', currentValues.handlingUnits);
      setValue('doDetails.emergencyContactName', currentValues.emergencyContactName);
      setValue('doDetails.emergencyContactPhone', currentValues.emergencyContactPhone);
    }
  };

  // --- HELPER: RENDER ZIP CODE --- 

  const renderZipCodeField = (name) => (

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

        control={control}

        rules={{
          // required: 'Zipcode is required',
          validate: (value) => {
            if (!value) return true;

            // 1. Block "all zeros"
            const rawDigits = value.replace(/[^\d]/g, '');
            if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

            // 2. Strict Length/Format check
            // Check if it matches exactly 5 digits OR exactly 5-5 digits (11 total characters)
            const zipRegex = /(^\d{5}$)|(^\d{5}-\d{5}$)/;
            if (!zipRegex.test(value)) {
              return 'Zip Code must be exactly 5 digits or a range (#####-#####)';
            }

            // 3. Range-specific constraints (only if a range is present)
            if (value.includes('-')) {
              const parts = value.split('-');
              const firstZip = parts[0];
              const secondZip = parts[1];

              // Ensure the first 3 digits of both segments match perfectly
              if (firstZip.slice(0, 3) !== secondZip.slice(0, 3)) {
                return `End range prefix must match '${firstZip.slice(0, 3)}'`;
              }

              // Ensure the last 2 digits of the second segment are strictly greater
              const startSuffix = parseInt(firstZip.slice(-2), 10);
              const endSuffix = parseInt(secondZip.slice(-2), 10);

              if (endSuffix === startSuffix) return 'End range cannot be equal to start';
              if (endSuffix < startSuffix) return 'End range must be greater than start';
            }

            return true;
          }
        }}

        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (

          <TextField

            {...field}

            variant="standard"

            fullWidth

            label="Zip Code"

            error={!!error}
            helperText={error?.message || 'Ex: 12345 or 12345-12346'}

            value={value || ''}

            onChange={(e) => {
              const input = e.target.value;
              // Allow only digits and a single dash character
              let raw = input.replace(/[^\d-]/g, '');

              // Detect backspacing/deletion
              const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

              if (!isDeleting && raw.length === 5 && !raw.includes('-')) {
                // Auto-append dash only when typing forwards past the 5th digit
                raw = `${raw}-`;
              }

              // Prevent typing more than 11 characters (#####-#####)
              onChange(raw.slice(0, 11));
            }}
            inputProps={{ maxLength: 11, inputMode: 'numeric' }}

          />

        )}

      />

    </Box>

  );
  const renderZipCodeFieldCarrierInfo = (name, flag) => (

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

        control={control}

        rules={{
          // required: 'Zipcode is required',
          validate: (value) => {
            if (!value) return true;

            // 1. Block "all zeros"
            const rawDigits = value.replace(/[^\d]/g, '');
            if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

            // 2. Strict Length/Format check
            // Check if it matches exactly 5 digits OR exactly 5-5 digits (11 total characters)
            const zipRegex = /(^\d{5}$)|(^\d{5}-\d{5}$)/;
            if (!zipRegex?.test(value)) {
              return 'Zip Code must be exactly 5 digits or a range (#####-#####)';
            }

            // 3. Range-specific constraints (only if a range is present)
            if (value.includes('-')) {
              const parts = value.split('-');
              const firstZip = parts[0];
              const secondZip = parts[1];

              // Ensure the first 3 digits of both segments match perfectly
              if (firstZip.slice(0, 3) !== secondZip.slice(0, 3)) {
                return `End range prefix must match '${firstZip.slice(0, 3)}'`;
              }

              // Ensure the last 2 digits of the second segment are strictly greater
              const startSuffix = parseInt(firstZip.slice(-2), 10);
              const endSuffix = parseInt(secondZip.slice(-2), 10);

              if (endSuffix === startSuffix) return 'End range cannot be equal to start';
              if (endSuffix < startSuffix) return 'End range must be greater than start';
            }

            return true;
          }
        }}

        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (

          <StyledTextField

            {...field}

            variant="standard"

            fullWidth

            label="Zip Code"

            error={!!error}
            helperText={error?.message || 'Ex: 12345 or 12345-12346'}

            value={value || ''}

            onChange={(e) => {
              const input = e.target.value;
              // Allow only digits and a single dash character
              let raw = input.replace(/[^\d-]/g, '');

              // Detect backspacing/deletion
              const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

              if (!isDeleting && raw.length === 5 && !raw.includes('-')) {
                // Auto-append dash only when typing forwards past the 5th digit
                raw = `${raw}-`;
              }

              // Prevent typing more than 11 characters (#####-#####)
              onChange(raw.slice(0, 11));
            }}
            inputProps={{ maxLength: 11, inputMode: 'numeric' }}
            disabled={flag}

          />

        )}

      />

    </Box>

  );



  // --- HELPER: RENDER PHONE FIELD --- 

  const renderPhoneField = (name, label) => (

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

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

            label={`${label} *`}

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

          />

        )}

      />

    </Box>

  );



  const renderTextField = (name, label, required = false) => {

    // Check if the current field is a city or state field
    const isCityOrState = ['city', 'state'].some(keyword =>
      name.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
    const isAirport = name.toLowerCase().includes('airport');

    // Dynamic Rules based on field type
    const validationRules = isAirport ? {
      // If required is passed as true explicitly, use it; otherwise, it is optional
      required: required ? `${label} is required` : false,
      maxLength: {
        value: 10,
        message: `${label} cannot exceed 10 characters`
      },
      pattern: {
        value: /^[A-Z]{3,10}$/,
        message: 'Must be between 3 and 10 letters'
      },
      // Only validates spaces if a value actually exists
      validate: (value) => !value || value.trim().length > 0 || `${label} cannot be only spaces`
    } : {
      required: required
    };

    return (<Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

        control={control}

        rules={validationRules}

        render={({ field }) => (
          <TextField
            {...field}
            value={field.value || ''}
            onChange={(e) => {
              let val = e.target.value;

              if (isAirport) {
                // 1. Prevent leading spaces
                if (val.startsWith(' ')) {
                  return;
                }
                // 2. Remove non-letters, convert to uppercase, limit to 10 characters
                val = val
                  .replace(/[^a-zA-Z]/g, '')
                  .toUpperCase()
                  .slice(0, 10);

                field.onChange(val);
              } else {
                if (isCityOrState) {
                  // Instantly strips out numbers and most special characters from the input field
                  val = val.replace(/[^A-Za-z\s.-]/g, '');
                }
                field.onChange(val); // Updates React Hook Form state for normal fields
              }
            }}
            fullWidth
            label={`${label}${required ? ' *' : ''}`}
            variant="standard"
            error={!!errors[name]}
            helperText={errors[name]?.message || ""}
            inputProps={isAirport ? {
              maxLength: 10
            } : {}}
          />
        )}

      />

    </Box>);

  };

  const labelStyle = { fontSize: '0.75rem', color: '#555' };
  const valueStyle = { fontSize: '0.85rem', fontWeight: 'bold', color: '#000' };
  const handleNotesCloseConfirm = () => {
    setOpenNotesDialog(false);
    notesRef.current = {};
  };
  const handleNotesCloseConfirmForShipmentAccs = () => {
    setOpenNotesDialogForShipmentAccs(false);
    notesRefArray.current = [];
    notesRefArrayIndex.current = null;
    notesRefArrayObj.current = {};
    setActiveNotesIndex(null);
  };

  useEffect(() => {
    if (!watchedHU || watchedHU.length <= 1) {
      setHandlingUnitWtFlag(false);
      return;
    }

    const lastItem = watchedHU[watchedHU.length - 1];

    // 1. Check Weight Unit Consistency
    const firstWeightUnit = watchedHU[0].weightUnit;
    const isConsistentWeightUnit = watchedHU.every(item => item.weightUnit === firstWeightUnit);
    const isWeightUnitInconsistent = !isConsistentWeightUnit && lastItem.weightUnit !== '';

    // 2. Check Dimension Unit Consistency
    const firstUnit = watchedHU[0].unit;
    const isConsistentUnit = watchedHU.every(item => item.unit === firstUnit);
    const isUnitInconsistent = !isConsistentUnit && lastItem.unit !== '';

    // 3. Set flag if EITHER condition fails validation
    if (isWeightUnitInconsistent || isUnitInconsistent) {
      setHandlingUnitWtFlag(true);
    } else {
      setHandlingUnitWtFlag(false);
    }

  }, [watchedHU]);

  useEffect(() => {
    dispatch(getCustomerStationDropdown());
    dispatch(getCarrierTerminalDropdown());
    dispatch(getShipperDropdown());
    dispatch(getConsigneeDropdown());
  }, [])
  useEffect(() => {
    // calculate freight class for each HU when length, width, height, weight, weight unit are all filled
    if (!watchedHU || watchedHU.length === 0) return;
    watchedHU.forEach((hu, index) => {
      // Only calculate if all fields have values
      if (hu.length && hu.width && hu.height && hu.weight) {
        const length = hu.unit === 'cm' ? parseFloat(hu.length) / 2.54 : parseFloat(hu.length);
        const width = hu.unit === 'cm' ? parseFloat(hu.width) / 2.54 : parseFloat(hu.width);
        const height = hu.unit === 'cm' ? parseFloat(hu.height) / 2.54 : parseFloat(hu.height);
        const weight = hu.weightUnit === 'kg' ? parseFloat(hu.weight) * 2.20462 : parseFloat(hu.weight);

        const freightClass = getFreightClass(length, width, height, weight);

        // CRITICAL: Only call setValue if the value is actually DIFFERENT
        // This prevents the infinite loop
        if (hu.calculatedFC !== freightClass) {
          setValue(`handlingUnits.${index}.calculatedFC`, freightClass);
          setValue(`handlingUnits.${index}.class`, freightClass);
        }
      }
    });
  }, [watchedHU, setValue])
  useEffect(() => {
    if (watchedCarrierInfo.selectCarrier) {
      setValue('carrierRates.pickUp.pickUpCarrier', watchedCarrierInfo.selectCarrier);
    }
    if (watchedCarrierInfo.lineHaul.carrier) {
      setValue('carrierRates.lineHaul.lineHaulCarrier', watchedCarrierInfo.lineHaul.carrier);
    }
    if (watchedCarrierInfo.deliveryDetails.carrier) {
      setValue('carrierRates.delivery.deliveryCarrier', watchedCarrierInfo.deliveryDetails.carrier);
    }
    // apply accessorial details
    if (watchedCarrierInfo.pickupAccessorials.length > 0) {
      const updatedPickupAcc = watchedCarrierInfo.pickupAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : '',
      }));
      setValue('carrierRates.pickUp.pickupAccessorials', updatedPickupAcc);
    }
    if (watchedCarrierInfo.lineHaul.linehaulAccessorials.length > 0) {
      const updatedLineHaulAcc = watchedCarrierInfo.lineHaul.linehaulAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : '',
      }));
      setValue('carrierRates.lineHaul.lineHaulAccessorials', updatedLineHaulAcc);
    }
    if (watchedCarrierInfo.deliveryDetails.deliveryAccessorials.length > 0) {
      const updatedDeliveryAcc = watchedCarrierInfo.deliveryDetails.deliveryAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : '',
      }));
      setValue('carrierRates.delivery.deliveryAccessorials', updatedDeliveryAcc);
    }
  }, [watchedCarrierInfo])

  const onSaveOfEdit = (selectedData) => {
    // alert('Saved with data: ' + JSON.stringify(selectedData) + `${editAccIndex}`);
    if (activeAccType === 'Pickup') {
      updatePickupAcc(editAccIndex, {
        // id: pickupAccFields[editAccIndex]?.id, // Keeps the internal form field key intact
        accessorialName: selectedData.accessorialName,
        chargeType: selectedData.chargeType,
        chargeValue: selectedData.chargeValue,
        notes: selectedData.notes,
      });
    }
    if (activeAccType === 'LineHaul') {
      updateLineHaulAcc(
        editAccIndex, {
        // id: lineHaulAccFields[editAccIndex]?.id,
        accessorialName: selectedData.accessorialName,
        chargeType: selectedData.chargeType,
        chargeValue: selectedData.chargeValue,
        notes: selectedData.notes,
      }
      );
    }
    if (activeAccType === 'Delivery') {
      updateDeliveryAcc(editAccIndex, {
        // id: deliveryAccFields[editAccIndex]?.id,
        accessorialName: selectedData.accessorialName,
        chargeType: selectedData.chargeType,
        chargeValue: selectedData.chargeValue,
        notes: selectedData.notes,
      });
    }
    setActionType('');
    setActiveAccType('');
    setEditAccIndex(null);
    setAddPickUpAccModal(false);
    setAddLineHaulAccModal(false);
    setAddDeliveryAccModal(false);

  };

  // set use wath for shipper details 
  const watchedShipperName = useWatch({ control, name: "shipperName" });
  const watchedShipperAddr1 = useWatch({ control, name: "shipperAddr1" });
  const watchedShipperAddr2 = useWatch({ control, name: "shipperAddr2" });
  const watchedShipperCity = useWatch({ control, name: "shipperCity" });
  const watchedShipperState = useWatch({ control, name: "shipperState" });
  const watchedShipperZip = useWatch({ control, name: "shipperZip" });
  const watchedShipperContact = useWatch({ control, name: "shipperContact" });
  const watchedShipperPhone = useWatch({ control, name: "shipperPhone" });

  // set use watch for consignee details
  const watchedConsigneeName = useWatch({ control, name: "consigneeName" });
  const watchedConsigneeAddr1 = useWatch({ control, name: "consigneeAddr1" });
  const watchedConsigneeAddr2 = useWatch({ control, name: "consigneeAddr2" });
  const watchedConsigneeCity = useWatch({ control, name: "consigneeCity" });
  const watchedConsigneeState = useWatch({ control, name: "consigneeState" });
  const watchedConsigneeZip = useWatch({ control, name: "consigneeZip" });
  const watchedConsigneeContact = useWatch({ control, name: "consigneeContact" });
  const watchedConsigneePhone = useWatch({ control, name: "consigneePhone" });

  // for updating consignee details when to location type is consignee
  const watchedToLocationType = useWatch({ control, name: "carrierInfo.toLocationType" });
  const watchedToLocation = useWatch({ control, name: "carrierInfo.toLocation" });
  const watchedLinehaulToLocationType = useWatch({ control, name: "carrierInfo.lineHaul.toLocationType" });
  const watchedLinehaulToLocation = useWatch({ control, name: "carrierInfo.lineHaul.toLocation" });
  const watchedDeliveryToLocationType = useWatch({ control, name: "carrierInfo.deliveryDetails.toLocationType" });
  const watchedDeliveryToLocation = useWatch({ control, name: "carrierInfo.deliveryDetails.toLocation" });
  // edit from and to location on carrier info of pickup, linehaul and delivery
  const watchedFromLocationFlag = useWatch({ control, name: "carrierInfo.isManualFromLocation" });
  const watchedToLocationFlag = useWatch({ control, name: "carrierInfo.isManualToLocation" });
  const watchedLinehaulFromLocationFlag = useWatch({ control, name: "carrierInfo.lineHaul.manualFromLocation" });
  const watchedLinehaulToLocationFlag = useWatch({ control, name: "carrierInfo.lineHaul.manualToLocation" });
  const watchedDeliveryFromLocationFlag = useWatch({ control, name: "carrierInfo.deliveryDetails.manualFromLocation" });
  const watchedDeliveryToLocationFlag = useWatch({ control, name: "carrierInfo.deliveryDetails.manualToLocation" });

  useEffect(() => {
    // Whenever any shipper detail changes, we can perform actions here
    // update manual from address of carrierinfo 
    setValue('carrierInfo.fromLocation', watchedShipperName?.shipperName ?? watchedShipperName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedShipperName?.airlineName ?? '');
    setValue('carrierInfo.manualAddress.line1', watchedShipperAddr1 ?? '');
    setValue('carrierInfo.manualAddress.line2', watchedShipperAddr2 ?? '');
    setValue('carrierInfo.manualAddress.city', watchedShipperCity ?? '');
    setValue('carrierInfo.manualAddress.state', watchedShipperState ?? '');
    setValue('carrierInfo.manualAddress.zip', watchedShipperZip ?? '');
  }, [watchedShipperName, watchedShipperAddr1, watchedShipperAddr2, watchedShipperCity, watchedShipperZip, watchedShipperContact, watchedShipperPhone, watchedShipperState]);

  useEffect(() => {
    // Whenever any consignee detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedToLocationType === 'Consignee') {
      setValue('carrierInfo.toLocation', watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? '');
      setValue('carrierInfo.manualToAddress.line1', watchedConsigneeAddr1 ?? '');
      setValue('carrierInfo.manualToAddress.line2', watchedConsigneeAddr2 ?? '');
      setValue('carrierInfo.manualToAddress.city', watchedConsigneeCity ?? '');
      setValue('carrierInfo.manualToAddress.state', watchedConsigneeState ?? '');
      setValue('carrierInfo.manualToAddress.zip', watchedConsigneeZip ?? '');
    }
  }, [watchedToLocationType, watchedConsigneeName, watchedConsigneeAddr1, watchedConsigneeAddr2, watchedConsigneeCity, watchedConsigneeZip, watchedConsigneeContact, watchedConsigneePhone, watchedConsigneeState]);
  useEffect(() => {
    // Whenever any carrier detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedToLocationType === 'Carrier' && watchedToLocation) {
      const [terminalId, carrierId] = watchedToLocation.split('-');
      const selectedObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
      );
      if (selectedObject) {
        setValue('carrierInfo.manualToAddress.line1', selectedObject?.address?.addressLine1);
        setValue('carrierInfo.manualToAddress.line2', selectedObject?.address?.addressLine2);
        setValue('carrierInfo.manualToAddress.city', selectedObject?.address?.city);
        setValue('carrierInfo.manualToAddress.state', selectedObject?.address?.state);
        setValue('carrierInfo.manualToAddress.zip', selectedObject?.address?.zipCode);
        setValue('carrierInfo.lineHaul.carrier', watchedToLocation);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
      }
      if (selectedRouting === 'pickup_linehaul' && selectedObject) {
        setValue('carrierInfo.deliveryDetails.carrier', watchedToLocation);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
      }
    }
  }, [watchedToLocation,]);
  useEffect(() => {
    // Whenever any carrier detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedLinehaulToLocationType === 'Carrier' && watchedLinehaulToLocation) {
      const [terminalId, carrierId] = watchedLinehaulToLocation.split('-');
      const selectedObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
      );
      if (selectedObject) {
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', selectedObject?.address?.addressLine1);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', selectedObject?.address?.addressLine2);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.city', selectedObject?.address?.city);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', selectedObject?.address?.zipCode);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.state', selectedObject?.address?.state);
        setValue('carrierInfo.deliveryDetails.carrier', watchedLinehaulToLocation);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
      }
    }
  }, [watchedLinehaulToLocation]);
  useEffect(() => {
    if (watchedLinehaulToLocationType === 'Consignee') {
      setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', watchedConsigneeAddr1 ?? '');
      setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', watchedConsigneeAddr2 ?? '');
      setValue('carrierInfo.lineHaul.manualToLocationDetails.city', watchedConsigneeCity ?? '');
      setValue('carrierInfo.lineHaul.manualToLocationDetails.state', watchedConsigneeState ?? '');
      setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', watchedConsigneeZip ?? '');
    }
  }, [watchedLinehaulToLocationType])
  useEffect(() => {
    // Whenever any carrier detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedDeliveryToLocationType === 'Consignee') {
      setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line1', watchedConsigneeAddr1 ?? '');
      setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line2', watchedConsigneeAddr2 ?? '');
      setValue('carrierInfo.deliveryDetails.manualToLocationDetails.city', watchedConsigneeCity ?? '');
      setValue('carrierInfo.deliveryDetails.manualToLocationDetails.zip', watchedConsigneeZip ?? '');
      setValue('carrierInfo.deliveryDetails.manualToLocationDetails.state', watchedConsigneeState ?? '');
    }
  }, [watchedDeliveryToLocationType,]);
  useEffect(() => {
    setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line1', watchedConsigneeAddr1 ?? '');
    setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line2', watchedConsigneeAddr2 ?? '');
    setValue('carrierInfo.deliveryDetails.manualToLocationDetails.city', watchedConsigneeCity ?? '');
    setValue('carrierInfo.deliveryDetails.manualToLocationDetails.state', watchedConsigneeState ?? '');
    setValue('carrierInfo.deliveryDetails.manualToLocationDetails.zip', watchedConsigneeZip ?? '');
  }, [watchedConsigneeAddr1, watchedConsigneeAddr2, watchedConsigneeCity, watchedConsigneeState, watchedConsigneeZip]);
  useEffect(() => {
    if (selectedRouting) {
      if ((selectedRouting === 'pickup_only' || selectedRouting === 'pickup_linehaul')) {
        if (getValues('carrierInfo.toLocationType') === 'Consignee') {
          setValue('carrierInfo.manualToAddress.line1', '');
          setValue('carrierInfo.manualToAddress.line2', '');
          setValue('carrierInfo.manualToAddress.city', '');
          setValue('carrierInfo.manualToAddress.state', '');
          setValue('carrierInfo.manualToAddress.zip', '');
        }
        setValue('carrierInfo.toLocationType', 'Carrier');
      }
      if (selectedRouting === 'pickup_linehaul_delivery') {
        setValue('carrierInfo.toLocationType', 'Consignee');
      }
      if (selectedRouting === 'pickup_linehaul') {
        const [terminalId, carrierId] = watchedToLocation.split('-');
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject) {
          setValue('carrierInfo.deliveryDetails.carrier', watchedToLocation);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
        }
      }
      if (selectedRouting === 'pickup_only') {
        // setValue('carrierInfo.lineHaul.selectRouting', 'linehaul_only');
        setValue('carrierInfo.lineHaul.toggleAddress', 'linehaul');
      }
    }
  }, [selectedRouting]);

  // watching pickup agent terminal
  const watchedPickupAgentTerminal = useWatch({ control, name: "carrierInfo.pickupAgentTerminal" });
  const watchedLinehaulSelectRouting = useWatch({ control, name: "carrierInfo.lineHaul.selectRouting" });
  const watchedLineHaulToggledAddress = useWatch({ control, name: "carrierInfo.lineHaul.toggleAddress" });
  const watchedAddPickupAccessorial = useWatch({ control, name: "carrierInfo.addPickupAccessorial" });
  const watchedPickupAlert = useWatch({ control, name: "carrierInfo.pickupAlert" });
  const watchedLinehaulAddAcc = useWatch({ control, name: "carrierInfo.lineHaul.lineHaulAddAcc" });
  const watchedDeliveryAddAcc = useWatch({ control, name: "carrierInfo.deliveryDetails.deliveryAddAcc" });
  const watchedDeliveryAlert = useWatch({ control, name: "carrierInfo.deliveryDetails.deliveryAlert" });
  const watchedAirportPickupService = useWatch({ control, name: "carrierInfo.airportPickupService" });
  const watchedAirportDeliveryService = useWatch({ control, name: "carrierInfo.airportDeliveryService" });

  const watchedOriginAirport = useWatch({ control, name: "originAirport" });
  const watchedDestinationAirport = useWatch({ control, name: "destinationAirport" });

  useEffect(() => {
    if (watchedLinehaulSelectRouting) {
      if ((watchedLinehaulSelectRouting === 'linehaul_only')) {
        setValue('carrierInfo.lineHaul.toggleAddress', 'linehaul');
        setValue('carrierInfo.lineHaul.toLocationType', 'Carrier');
        setValue('carrierInfo.lineHaul.toLocation', '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.city', '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.state', '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', '');
      }
      if (watchedLinehaulSelectRouting === 'linehaul_delivery') {
        setValue('carrierInfo.lineHaul.toggleAddress', 'pickup');
        setValue('carrierInfo.lineHaul.toLocationType', 'Consignee');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', watchedConsigneeAddr1 ?? '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', watchedConsigneeAddr2 ?? '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.city', watchedConsigneeCity ?? '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.state', watchedConsigneeState ?? '');
        setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', watchedConsigneeZip ?? '');
      }
    }
  }, [watchedLinehaulSelectRouting]);
  // call use effect when there is change in select carrier of pickup and linehaul to update the address details in linehaul
  const watchedSelectedPickupCarrier = useWatch({ control, name: "carrierInfo.selectCarrier" });
  const watchedSelectedLineHaulCarrier = useWatch({ control, name: "carrierInfo.lineHaul.carrier" });
  const watchedSelectedDeliveryCarrier = useWatch({ control, name: "carrierInfo.deliveryDetails.carrier" });
  const watchedPickupAdditionalMails = useWatch({ control, name: "carrierInfo.pickupAlertDetails.additionalEmailsArray" });
  const watchedDeliveryAdditionalMails = useWatch({ control, name: "carrierInfo.deliveryDetails.additionalEmailsArray" });
  // fuel surcharge on customers
  const customerZipRate = useWatch({ control, name: "customerRate.rate" })

  useEffect(() => {
    if (watchedPickupAgentTerminal && watchedLineHaulToggledAddress) {
      if (watchedLineHaulToggledAddress === 'pickup') {
        const [terminalId, carrierId] = getValues('carrierInfo.selectCarrier').split('-');
        if (terminalId && carrierId) {
          const selectedObject = carrierTerminalDropdown.find(
            (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
          );
          setCarrierTerminalSelectError(false);
          console.log(selectedObject);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
        } else {
          setCarrierTerminalSelectError(true);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', '');
        }
      }
      if (watchedLineHaulToggledAddress === 'linehaul') {
        const [terminalId, carrierId] = getValues('carrierInfo.lineHaul.carrier').split('-');
        if (terminalId && carrierId) {
          const selectedObject = carrierTerminalDropdown.find(
            (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
          );
          setCarrierTerminalSelectError(false);
          console.log(selectedObject);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
        } else {
          setCarrierTerminalSelectError(true);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', '');
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', '');
        }
      }
    }
    if (watchedSelectedPickupCarrier) {
      const [terminalId, carrierId] = watchedSelectedPickupCarrier.split('-');
      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject?.carrierName?.includes('R&M')) {
          setValue('carrierInfo.pickupAlert', false);
        } else {
          setValue('carrierInfo.pickupAlert', true);
        }
      }

    }
  }, [watchedLineHaulToggledAddress, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier]);
  // useeffect for updating primary mail and additional mails
  useEffect(() => {
    // updating primary mail
    if (watchedSelectedPickupCarrier) {
      const [terminalId, carrierId] = watchedSelectedPickupCarrier.split('-');
      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject && Object.keys(selectedObject).length > 0) {
          setValue('carrierInfo.pickupAlertDetails.primaryEmail', selectedObject?.terminalEmail);
          setValue('carrierInfo.pickupAlertDetails.additionalEmailsArray', selectedObject?.emails);
        }
      }
    }

    if (watchedSelectedDeliveryCarrier) {
      const [terminalId, carrierId] = watchedSelectedDeliveryCarrier.split('-');
      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject && Object.keys(selectedObject).length > 0) {
          setValue('carrierInfo.deliveryDetails.primaryEmail', selectedObject?.terminalEmail);
          setValue('carrierInfo.deliveryDetails.additionalEmailsArray', selectedObject?.emails);
        }
      }
    }

  }, [watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier])

  useEffect(() => {
    if (watchedOriginAirport.length > 2) {
      dispatch(getShipperAirlineDropdown(watchedOriginAirport, ''));
    }
  }, [watchedOriginAirport])
  useEffect(() => {
    if (watchedDestinationAirport.length > 2)
      dispatch(getConsigneeAirlineDropdown(watchedDestinationAirport, ''));
  }, [watchedDestinationAirport])

  const handleNext = async () => {
    const currentValues = getValues();

    let fieldsToValidate = [];
    const obj = {};

    if (activeStep === 0) {
      fieldsToValidate = ['shipmentType', 'serviceLevel', 'date', 'time'];
    } else if (activeStep === 1) {
      fieldsToValidate = [
        'billingCustomer',
        'originAirport',
        'destinationAirport',
        'shipperZip',
        'consigneeZip',
        'shipperPhone',
        'consigneePhone',
      ];
    } else if (activeStep === 2 && isHazmatSelected) {
      fieldsToValidate = ['emergencyContactName', 'emergencyContactPhone'];
    } else if (activeStep === 3) {
      if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only') {
        fieldsToValidate = [
          'carrierInfo.selectCarrier',
          'carrierInfo.fromLocation',
          'carrierInfo.lineHaul.carrier',
          'carrierInfo.lineHaul.billNumber',
          'carrierInfo.lineHaul.toLocationType',
          'carrierInfo.lineHaul.toLocation',
          'carrierInfo.deliveryDetails.carrier',
          'carrierInfo.deliveryDetails.billNumber',
          'carrierInfo.deliveryDetails.toLocationType',
          'carrierInfo.deliveryDetails.toLocation',

        ];
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
          fieldsToValidate.push(
            'carrierInfo.toLocationType',
            'carrierInfo.toLocation',
          );
        }

        if (currentValues?.carrierInfo?.pickupAlert) {
          fieldsToValidate.push('carrierInfo.pickupNotes', 'carrierInfo.primaryEmail');
        }

        if (currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert) {
          fieldsToValidate.push('carrierInfo.deliveryDetails.lineHaulNotes', 'carrierInfo.deliveryDetails.deliveryNotes', 'carrierInfo.deliveryDetails.primaryEmail');
        }

      }
      if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery') {
        fieldsToValidate = [
          'carrierInfo.selectCarrier',
          'carrierInfo.fromLocation',
          'carrierInfo.lineHaul.carrier',
          'carrierInfo.lineHaul.billNumber',
          'carrierInfo.lineHaul.toLocationType',
          'carrierInfo.lineHaul.toLocation',

        ];
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
          fieldsToValidate.push(
            'carrierInfo.toLocationType',
            'carrierInfo.toLocation',
          );
        }

        if (currentValues?.carrierInfo?.pickupAlert) {
          fieldsToValidate.push('carrierInfo.pickupNotes', 'carrierInfo.primaryEmail');
        }

        if (currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert) {
          fieldsToValidate.push('carrierInfo.deliveryDetails.lineHaulNotes', 'carrierInfo.deliveryDetails.deliveryNotes', 'carrierInfo.deliveryDetails.primaryEmail');
        }

      }
      if (selectedRouting === 'pickup_linehaul') {
        fieldsToValidate = [
          'carrierInfo.selectCarrier',
          'carrierInfo.fromLocation',
          'carrierInfo.deliveryDetails.carrier',
          'carrierInfo.deliveryDetails.billNumber',
          'carrierInfo.deliveryDetails.toLocationType',
          'carrierInfo.deliveryDetails.toLocation',

        ];
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
          fieldsToValidate.push(
            'carrierInfo.toLocationType',
            'carrierInfo.toLocation',
          );
        }

        if (currentValues?.carrierInfo?.pickupAlert) {
          fieldsToValidate.push('carrierInfo.pickupNotes', 'carrierInfo.primaryEmail');
        }

        if (currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert) {
          fieldsToValidate.push('carrierInfo.deliveryDetails.lineHaulNotes', 'carrierInfo.deliveryDetails.deliveryNotes', 'carrierInfo.deliveryDetails.primaryEmail');
        }
      }
      if (selectedRouting === 'pickup_linehaul_delivery') {
        fieldsToValidate = [
          'carrierInfo.selectCarrier',
          'carrierInfo.fromLocation',
        ];
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
          fieldsToValidate.push(
            'carrierInfo.toLocationType',
            'carrierInfo.toLocation',
          );
        }

        if (currentValues?.carrierInfo?.pickupAlert) {
          fieldsToValidate.push('carrierInfo.pickupNotes', 'carrierInfo.primaryEmail');
        }

        if (currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert) {
          fieldsToValidate.push('carrierInfo.deliveryDetails.lineHaulNotes', 'carrierInfo.deliveryDetails.deliveryNotes', 'carrierInfo.deliveryDetails.primaryEmail');
        }
      }
    }
    if (activeStep === 3 && currentValues?.carrierInfo?.addPickupAccessorial && currentValues?.carrierInfo?.pickupAccessorials?.length === 0) {
      setErrorVisible(true);
    }
    if (activeStep === 3 && currentValues?.carrierInfo?.lineHaul?.linehaulAddAcc && currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials?.length === 0) {
      setErrorVisible(true);
    }
    if (activeStep === 3 && currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc && currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials?.length === 0) {
      setErrorVisible(true);
    }
    const units = getValues('handlingUnits');
    const lastUnit = units[units.length - 1];
    const hasTopLevelValid =
      !!lastUnit?.uom?.trim() &&
      !!lastUnit?.unitsCount?.toString().trim();
    const isItemsValid = Array.isArray(lastUnit?.items) && lastUnit.items.length > 0 &&
      lastUnit.items.every(item => {
        // Baseline checks for every item
        const baseFieldsValid =
          !!item?.pieces?.toString().trim() &&
          !!item?.piecesUom?.trim() &&
          !!item?.description?.trim();

        // If baseline fails, no need to check hazmat
        if (!baseFieldsValid) return false;

        // Hazmat conditional check
        if (item?.hazmatInfo === true) {
          const hazmat = item?.hazmatData;
          return (
            !!hazmat?.unNumber?.trim() &&
            !!hazmat?.shippingName?.trim() &&
            !!hazmat?.packagingGroup?.trim() &&
            !!hazmat?.hazmatClass?.trim() &&
            !!hazmat?.weight?.toString().trim() &&
            !!hazmat?.technicalName?.trim() &&
            !!hazmat?.contactPhone?.trim()
          );
        }

        return true;
      });
    const isLastUnitValid = hasTopLevelValid && isItemsValid;

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (activeStep < 4) {
        if (activeStep === 2) {
          if (isLastUnitValid) {
            setErrorVisible(false);
            setActiveStep((prev) => prev + 1);
          } else {
            setErrorVisible(true);
          }
        }

        if (activeStep !== 2) {
          setActiveStep((prev) => prev + 1);
        }
      }
    } else {
      setErrorVisible(true);
    }

    // adding to object
    // step 0
    obj.shipmentDetails = {
      "typeOfShipment": currentValues.shipmentType,
      "serviceLevel": currentValues.serviceLevel,
      "shipmentDate": currentValues.date
        ? new Date(currentValues.date).toLocaleDateString('en-CA')
        : "",
      "shipmentTime": currentValues.time
        ? new Date(currentValues.time).toLocaleTimeString('en-US', { hour12: false })
        : "",
      "orderReceivedPickupPending": "Y",
      "shipmentStatus": "Active"
    };
    // step 1
    obj.customerDetails = {
      "customerId": currentValues.billingCustomer.customerId,
      "stationId": currentValues.billingCustomer.stationId,
      "airportPickupService": watchedAirportPickupService ? "Y" : "N",
      "airportDeliveryService": watchedAirportDeliveryService ? "Y" : "N",
      "originAirportCode": currentValues.originAirport,
      "destinationAirportCode": currentValues.destinationAirport,
      // we have to update address when we select shipper details
      "shipperDetails": {
        'shipperId': currentValues?.shipperName?.shipperId || null,
        "shipperName": currentValues?.shipperName?.shipperName,
        "addressLine1": currentValues.shipperAddr1,
        "addressLine2": currentValues.shipperAddr2,
        "city": currentValues.shipperCity,
        "state": currentValues.shipperState,
        "zipCode": currentValues.shipperZip,
        "contactPersonName": currentValues.shipperContact,
        "phoneNumber": currentValues.shipperPhone,
        'entityId': currentValues?.shipperName?.entityId,
      },
      "pickupAirlineDetails": {
        "airlineId": currentValues?.shipperName?.shipperId || currentValues?.shipperName?.airlineId || null,
        "airlineNumber": Number(currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.shipperName?.airlineNumber) || null,
        "airlineCode": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.shipperName?.airlineCode || '',
        "airportCode": currentValues?.shipperName?.airportCode || watchedOriginAirport,
        "airlineName": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.shipperName?.airlineName || '',
        "addressLine1": currentValues?.shipperAddr1,
        "addressLine2": currentValues?.shipperAddr2,
        "city": currentValues.shipperCity,
        "state": currentValues.shipperState,
        "zipCode": currentValues.shipperZip,
        "contactPersonName": currentValues?.shipperContact,
        "phoneNumber": currentValues.shipperPhone,
        "handler": '',
        'entityId': currentValues?.shipperName?.entityId || null,
        "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
      },
      "consigneeDetails": {
        "consigneeId": currentValues?.consigneeName?.consigneeId || null,
        "consigneeName": currentValues?.consigneeName?.consigneeName,
        "addressLine1": currentValues.consigneeAddr1,
        "addressLine2": currentValues.consigneeAddr2,
        "city": currentValues.consigneeCity,
        "state": currentValues.consigneeState,
        "zipCode": currentValues.consigneeZip,
        "contactPersonName": currentValues.consigneeContact,
        "phoneNumber": currentValues.consigneePhone,
        'entityId': currentValues?.consigneeName?.entityId,
      },
      "deliveryAirlineDetails": {
        "airlineId": currentValues?.consigneeName?.consigneeId || currentValues?.consigneeName?.airlineId || null,
        "airlineNumber": Number(currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.consigneeName?.airlineNumber) || '',
        "airlineCode": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.consigneeName?.airlineCode || '',
        "airportCode": currentValues?.consigneeName?.airportCode || watchedDestinationAirport,
        "airlineName": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
        "addressLine1": currentValues.consigneeAddr1,
        "addressLine2": currentValues.consigneeAddr2,
        "city": currentValues.consigneeCity,
        "state": currentValues.consigneeState,
        "zipCode": currentValues.consigneeZip,
        "contactPersonName": currentValues?.consigneeContact,
        "phoneNumber": currentValues.consigneePhone,
        "handler": '',
        'entityId': currentValues?.consigneeName?.entityId || null,
        "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
      },
    };
    if (watchedAirportPickupService) {
      delete obj.customerDetails.shipperDetails;
    } else {
      delete obj.customerDetails.pickupAirlineDetails;
    }

    if (watchedAirportDeliveryService) {
      delete obj.customerDetails.consigneeDetails;
    } else {
      delete obj.customerDetails.deliveryAirlineDetails;
    }

    // step 2
    if (currentValues?.handlingUnits?.length > 0 && currentValues?.handlingUnits[0]?.uom) {
      obj.commodityDetails = {
        emergencyContactName: isHazmatSelected ? currentValues?.emergencyContactName : '',
        emergencyContactPhone: isHazmatSelected ? currentValues?.emergencyContactPhone : '',
        handlingUnits: currentValues?.handlingUnits.map(hu => ({
          handlingUnitUOM: hu.uom,
          handlingUnits: Number(hu.unitsCount) || 0, // Ensures it maps to a number
          unit: hu.unit,
          handlingLength: Number(hu.length) || 0,
          handlingWidth: Number(hu.width) || 0,
          handlingHeight: Number(hu.height) || 0,
          handlingWeight: Number(hu.weight) || 0,
          handlingWeightUnit: hu.weightUnit === 'lbs' ? 'LB' : hu.weightUnit === 'kgs' ? 'KG' : '', // Standardizes 'lbs' to 'LB'
          class: hu.class ? `Class ${hu.class}` : '', // Formats class number to "Class X"
          palletDetails: hu?.items?.map(item => ({
            pieces: Number(item?.pieces) || 0,
            piecesUOM: item?.piecesUom,
            description: item?.description,
            hazmat: item?.hazmatInfo ? 'Y' : 'N',
            hazmatDetails: item?.hazmatInfo ? {
              unNumber: item?.hazmatData?.unNumber,
              properShippingName: item?.hazmatData?.shippingName,
              hazardClass: `Class ${item?.hazmatData?.hazmatClass}`,
              packingGroup: `${item?.hazmatData?.packagingGroup}`,
              weight: Number(item?.hazmatData?.weight) || 0,
              technicalName: item?.hazmatData?.technicalName,
              contactPhoneNumber: item?.hazmatData?.contactPhone,
              hazmatDescription: item?.hazmatData?.description,
              // Converts boolean values to API's expected "Y" / "N" string flags
              limitedQuantity: item?.hazmatData?.limitedQuality ? "Y" : "N",
              marinePollutant: item?.hazmatData?.marinePollutant ? "Y" : "N",
              residueLastContained: item?.hazmatData?.residueLastContained ? "Y" : "N",
              reportableQuantity: item?.hazmatData?.reportableQuantity ? "Y" : "N",
              dotExemption: item?.hazmatData?.dotExemption ? "Y" : "N"
            } : null
          }))
        }))
      };
    }

    // step 3
    console.log(selectedRouting, watchedLinehaulSelectRouting);
    const [pickupTerminalId, pickupCarrierId] = watchedSelectedPickupCarrier.split('-');
    const [linehaulTerminalId, linehaulCarrierId] = watchedSelectedLineHaulCarrier.split('-');
    const [deliveryTerminalId, deliveryCarrierId] = watchedSelectedDeliveryCarrier.split('-');

    const [pickupToLocTerminalId, pickupToLocCarrierId] = watchedToLocation.split('-');
    const [linehaulToLocTerminalId, linehaulToLocCarrierId] = watchedLinehaulToLocation.split('-');
    const [deliveryToLocTerminalId, deliveryToLocCarrierId] = watchedDeliveryToLocation.split('-');

    // From Location
    const selectedPickupCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(pickupTerminalId) && item.carrierId === Number(pickupCarrierId)
    );
    const selectedLinehaulCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(linehaulTerminalId) && item.carrierId === Number(linehaulCarrierId)
    );
    const selectedDeliveryCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(deliveryTerminalId) && item.carrierId === Number(deliveryCarrierId)
    );
    // To Location
    const selectedPickupToCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(pickupToLocTerminalId) && item.carrierId === Number(pickupToLocCarrierId)
    );
    const selectedLinehaulToCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(linehaulToLocTerminalId) && item.carrierId === Number(linehaulToLocCarrierId)
    );
    const selectedDeliveryToCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(deliveryToLocTerminalId) && item.carrierId === Number(deliveryToLocCarrierId)
    );

    if (activeStep === 3 && isValid) {
      const pickupFromZip = currentValues?.carrierInfo?.manualAddress?.zip;
      let pickupToZip = '';
      if (currentValues?.carrierInfo?.pickupAgentTerminal) {
        pickupToZip = selectedPickupCarrierObject?.address?.zipCode;
      } else {
        pickupToZip = currentValues?.carrierInfo?.manualToAddress?.zip
      }
      dispatch(getZipToZipCarrierPickupRate(pickupFromZip, pickupToZip, Number(totals.totalWeight), selectedPickupCarrierObject?.terminalId));

      const linehaulFromZip = currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip;
      const linehaulToZip = currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zip;
      dispatch(getZipToZipCarrierLinehaulRate(linehaulFromZip, linehaulToZip, Number(totals.totalWeight), selectedLinehaulCarrierObject?.terminalId))

      const deliveryFromZip = currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zip;
      const deliveryToZip = currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zip;
      dispatch(getZipToZipCarrierDeliveryRate(deliveryFromZip, deliveryToZip, Number(totals.totalWeight), selectedDeliveryCarrierObject?.terminalId));
    }


    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only') {
      // obj to send
      // when pickupAgentTerminal is Y no need of pickupAgentTerminalDetails
      // fromLocationEntityId not there in from location
      obj.carrierDetails = {

        "pickupDetails": {
          "pickupRouting": "PICKUP_ONLY",
          "fromLocationType": "Shipper",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
          "carrierId": Number(pickupCarrierId),
          "terminalId": Number(pickupTerminalId),
          "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
          "editFromLocationDetails": {
            "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
            "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
            "city": currentValues?.carrierInfo?.manualAddress?.city,
            "state": currentValues?.carrierInfo?.manualAddress?.state,
            "zipCode": currentValues?.carrierInfo?.manualAddress?.zipCode
          },
          "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
          "pickupAgentTerminalDetails": {
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.toLocation,
            "toLocationEntityId": selectedPickupToCarrierObject?.entityId || null,
            "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
              "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
              "city": currentValues?.carrierInfo?.manualToAddress?.city,
              "state": currentValues?.carrierInfo?.manualToAddress?.state,
              "zipCode": currentValues?.carrierInfo?.manualToAddress?.zipCode
            }
          },
          "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
          "pickupAccessorialDetails": {
            "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
              ...rest,
              notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
            })),
          },
          "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
          "pickupAlertDetails": {
            "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
            "emailInfo": {
              "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
              "additionalEmails": currentValues?.carrierInfo?.additionalEmail,
            }
          }
        },
        "linehaulDetails": {
          "linehaulPrimaryInfo": {
            "linehaulRouting": "LINE_HAUL",
            "carrierId": Number(linehaulCarrierId),
            "terminalId": Number(linehaulTerminalId),
            "carrierBillNumber": currentValues?.carrierInfo?.lineHaul?.billNumber,
            "fromLocationType": "Carrier",
            "fromLocation": currentValues?.carrierInfo?.lineHaul?.fromLocation,
            "fromLocationEntityId": selectedLinehaulCarrierObject?.entityId,
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.lineHaul?.toLocation,
            // still to get
            "toLocationEntityId": selectedLinehaulToCarrierObject?.entityId,
            "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
            "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
            "pieces": currentValues?.carrierInfo?.lineHaul?.pcs,
            'weight': currentValues?.carrierInfo?.lineHaul?.weight,
            "editFromLocation": currentValues?.carrierInfo?.lineHaul?.manualFromLocation ? "Y" : "N",
            "editFromLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
              "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zipCode
            },
            "editToLocation": currentValues?.carrierInfo?.lineHaul?.manualToLocation ? 'Y' : 'N',
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.city,
              "state": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zipCode
            }
          },
          "linehaulCommonInfo": {
            "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
            "linehaulAccessorial": currentValues?.carrierInfo?.lineHaul?.linehaulAddAcc ? 'Y' : 'N',
            "linehaulAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                ...rest,
                notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
              })),
            }
          }
        },
        "deliveryDetails": {
          "deliveryPrimaryInfo": {
            "carrierId": Number(deliveryCarrierId),
            "terminalId": Number(deliveryTerminalId),
            "carrierBillNumber": currentValues?.carrierInfo?.deliveryDetails?.billNumber,
            "fromLocationType": "Carrier",
            "fromLocation": currentValues?.carrierInfo?.deliveryDetails?.fromLocation,
            "fromLocationEntityId": selectedDeliveryCarrierObject?.entityId,
            "toLocationType": "Consignee",
            "toLocation": currentValues?.carrierInfo?.deliveryDetails?.toLocation,
            "toLocationEntityId": selectedDeliveryToCarrierObject?.entityId,
            "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
            "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
            "pieces": currentValues?.carrierInfo?.deliveryDetails?.pcs,
            'weight': currentValues?.carrierInfo?.deliveryDetails?.weight,
            "editFromLocation": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocation ? "Y" : 'N',
            "editFromLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.city,
              "state": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zipCode
            },
            "editToLocation": currentValues?.carrierInfo?.deliveryDetails?.manualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.city,
              "state": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zipCode
            }
          },
          "deliveryCommonInfo": {
            "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
            "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
            "deliveryAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                ...rest,
                notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
              })),
            },
            "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
            "deliveryAlertDetails": {
              "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
              "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
              "emailInfo": {
                "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
              }
            }
          }
        }

      }
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery') {
      obj.carrierDetails = {

        "pickupDetails": {
          "pickupRouting": "PICKUP_ONLY",
          "fromLocationType": "Shipper",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
          "carrierId": Number(pickupCarrierId),
          "terminalId": Number(pickupTerminalId),
          "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
          "editFromLocationDetails": {
            "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
            "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
            "city": currentValues?.carrierInfo?.manualAddress?.city,
            "state": currentValues?.carrierInfo?.manualAddress?.state,
            "zipCode": currentValues?.carrierInfo?.manualAddress?.zipCode
          },
          "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
          "pickupAgentTerminalDetails": {
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.toLocation,
            "toLocationEntityId": selectedPickupCarrierObject?.entityId,
            "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
              "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
              "city": currentValues?.carrierInfo?.manualToAddress?.city,
              "state": currentValues?.carrierInfo?.manualToAddress?.state,
              "zipCode": currentValues?.carrierInfo?.manualToAddress?.zipCode
            }
          },
          "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
          "pickupAccessorialDetails": {
            "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
              ...rest,
              notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
            })),
          },
          "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
          "pickupAlertDetails": {
            "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
            "emailInfo": {
              "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
              "additionalEmails": currentValues?.carrierInfo?.additionalEmail,
            }
          }
        },
        "linehaulDetails": {
          "linehaulPrimaryInfo": {
            "linehaulRouting": "LINE_HAUL_DELIVERY",
            "carrierId": Number(linehaulCarrierId),
            "terminalId": Number(linehaulTerminalId),
            "carrierBillNumber": currentValues?.carrierInfo?.lineHaul?.billNumber,
            "fromLocationType": "Carrier",
            "fromLocation": currentValues?.carrierInfo?.lineHaul?.fromLocation,
            "fromLocationEntityId": selectedLinehaulCarrierObject?.entityId,
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.lineHaul?.toLocation,
            "toLocationEntityId": selectedLinehaulToCarrierObject?.entityId,
            "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
            "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
            "pieces": currentValues?.carrierInfo?.lineHaul?.pcs,
            'weight': currentValues?.carrierInfo?.lineHaul?.weight,
            "editFromLocation": currentValues?.carrierInfo?.lineHaul?.manualFromLocation ? "Y" : "N",
            "editFromLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
              "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zipCode
            },
            "editToLocation": currentValues?.carrierInfo?.lineHaul?.manualToLocation ? 'Y' : 'N',
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.city,
              "state": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zipCode
            }
          },
          "linehaulCommonInfo": {
            "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
            "linehaulAccessorial": currentValues?.carrierInfo?.lineHaul?.linehaulAddAcc ? 'Y' : 'N',
            "linehaulAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
            }
          }
        },
        "deliveryDetails": {

          "deliveryCommonInfo": {
            "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
            "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
            "deliveryAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
            },
            "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
            "deliveryAlertDetails": {
              "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
              "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
              "emailInfo": {
                "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
              }
            }
          }
        }

      }
    }
    if (selectedRouting === 'pickup_linehaul') {
      obj.carrierDetails = {

        "pickupDetails": {
          "pickupRouting": "PICKUP_LINE_HAUL",
          "fromLocationType": "Carrier",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
          "carrierId": Number(pickupCarrierId),
          "terminalId": Number(pickupTerminalId),
          "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
          "editFromLocationDetails": {
            "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
            "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
            "city": currentValues?.carrierInfo?.manualAddress?.city,
            "state": currentValues?.carrierInfo?.manualAddress?.state,
            "zipCode": currentValues?.carrierInfo?.manualAddress?.zipCode
          },
          "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
          "pickupAgentTerminalDetails": {
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.toLocation,
            "toLocationEntityId": selectedPickupToCarrierObject?.entityId,
            "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
              "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
              "city": currentValues?.carrierInfo?.manualToAddress?.city,
              "state": currentValues?.carrierInfo?.manualToAddress?.state,
              "zipCode": currentValues?.carrierInfo?.manualToAddress?.zipCode
            }
          },
          "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
          "pickupAccessorialDetails": {
            "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
              ...rest,
              notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
            })),
          },
          "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
          "pickupAlertDetails": {
            "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
            "emailInfo": {
              "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
              "additionalEmails": currentValues?.carrierInfo?.additionalEmail,
            }
          }
        },
        "linehaulDetails": {
          "linehaulCommonInfo": {
            "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
            "linehaulAccessorial": currentValues?.carrierInfo?.lineHaul?.linehaulAddAcc ? 'Y' : 'N',
            "linehaulAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
            }
          }
        },
        "deliveryDetails": {
          "deliveryPrimaryInfo": {
            "carrierId": Number(deliveryCarrierId),
            "terminalId": Number(deliveryTerminalId),
            "carrierBillNumber": currentValues?.carrierInfo?.deliveryDetails?.billNumber,
            "fromLocationType": "Consignee",
            "fromLocation": currentValues?.carrierInfo?.deliveryDetails?.fromLocation,
            "fromLocationEntityId": selectedDeliveryCarrierObject?.entityId,
            "toLocationType": "Consignee",
            "toLocation": currentValues?.carrierInfo?.deliveryDetails?.toLocation,
            "toLocationEntityId": selectedDeliveryToCarrierObject?.entityId,
            "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
            "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
            "pieces": currentValues?.carrierInfo?.deliveryDetails?.pcs,
            'weight': currentValues?.carrierInfo?.deliveryDetails?.weight,
            "editFromLocation": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocation ? "Y" : 'N',
            "editFromLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.city,
              "state": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zipCode
            },
            "editToLocation": currentValues?.carrierInfo?.deliveryDetails?.manualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line1,
              "line2": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line2,
              "city": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.city,
              "state": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.state,
              "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zipCode
            }
          },
          "deliveryCommonInfo": {
            "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
            "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
            "deliveryAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
            },
            "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
            "deliveryAlertDetails": {
              "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
              "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
              "emailInfo": {
                "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
              }
            }
          }
        }

      }
    }
    if (selectedRouting === 'pickup_linehaul_delivery') {
      obj.carrierDetails = {

        "pickupDetails": {
          "pickupRouting": "PICKUP_LINE_HAUL_DELIVERY",
          "fromLocationType": "Carrier",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
          "carrierId": Number(pickupCarrierId),
          "terminalId": Number(pickupTerminalId),
          "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
          "editFromLocationDetails": {
            "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
            "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
            "city": currentValues?.carrierInfo?.manualAddress?.city,
            "state": currentValues?.carrierInfo?.manualAddress?.state,
            "zipCode": currentValues?.carrierInfo?.manualAddress?.zipCode
          },
          "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
          "pickupAgentTerminalDetails": {
            "toLocationType": "Consignee",
            "toLocation": currentValues?.carrierInfo?.toLocation,
            "toLocationEntityId": selectedPickupToCarrierObject?.entityId,
            "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
            "editToLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
              "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
              "city": currentValues?.carrierInfo?.manualToAddress?.city,
              "state": currentValues?.carrierInfo?.manualToAddress?.state,
              "zipCode": currentValues?.carrierInfo?.manualToAddress?.zipCode
            }
          },
          "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
          "pickupAccessorialDetails": {
            "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
              ...rest,
              notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
            })),
          },
          "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
          "pickupAlertDetails": {
            "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
            "emailInfo": {
              "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
              "additionalEmails": currentValues?.carrierInfo?.additionalEmail,
            }
          }
        },
        "linehaulDetails": {
          "linehaulCommonInfo": {
            "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
            "linehaulAccessorial": currentValues?.carrierInfo?.lineHaul?.linehaulAddAcc ? 'Y' : 'N',
            "linehaulAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
            }
          }
        },
        "deliveryDetails": {
          "deliveryCommonInfo": {
            "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
            "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
            "deliveryAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
            },
            "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
            "deliveryAlertDetails": {
              "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
              "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
              "emailInfo": {
                "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
              }
            }
          }
        }

      }
    }

    // step 4
    // push zip to zip
    const transformedPickupArray = currentValues?.carrierRates?.pickUp?.pickupAccessorials?.map(item => {
      // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
      const factor = Number(item.input) || 0;
      const value = Number(item.chargeValue) || 0;

      return {
        rateType: item.accessorialName,
        multiplicationFactor: factor,
        multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '', // 
        rateValue: value,
        // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
        totalRate: factor === 0 ? value : factor * value
      };
    });
    transformedPickupArray.push({
      rateType: 'Zip to Zip',
      multiplicationFactor: null,
      multiplicationFactorUOM: '',
      rateValue: Number(currentValues?.carrierRates?.pickUp?.pickUpRate),
      totalRate: Number(currentValues?.carrierRates?.pickUp?.pickUpRate),
    });
    const transformedLinehaulArray = currentValues?.carrierRates?.lineHaul?.lineHaulAccessorials?.map(item => {
      // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
      const factor = Number(item.input) || 0;
      const value = Number(item.chargeValue) || 0;

      return {
        rateType: item.chargeType,
        multiplicationFactor: factor,
        multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '',
        rateValue: value,
        // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
        totalRate: factor === 0 ? value : factor * value
      };
    });
    transformedLinehaulArray.push({
      rateType: 'Zip to Zip',
      multiplicationFactor: null,
      multiplicationFactorUOM: '',
      rateValue: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate),
      totalRate: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate),
    });
    const transformedDeliveryArray = currentValues?.carrierRates?.delivery?.deliveryAccessorials?.map(item => {
      // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
      const factor = Number(item.input) || 0;
      const value = Number(item.chargeValue) || 0;

      return {
        rateType: item.chargeType,
        multiplicationFactor: factor,
        multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '', // 
        rateValue: value,
        // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
        totalRate: factor === 0 ? value : factor * value
      };
    });
    transformedDeliveryArray.push({
      rateType: 'Zip to Zip',
      multiplicationFactor: null,
      multiplicationFactorUOM: '',
      rateValue: Number(currentValues?.carrierRates?.delivery?.deliveryRate),
      totalRate: Number(currentValues?.carrierRates?.delivery?.deliveryRate),
    });
    const pickupSubTotalRate = transformedPickupArray.reduce((accumulator, item) => {
      // Force convert totalRate to a number safely, falling back to 0 if null/undefined
      const currentRate = Number(item.totalRate) || 0;
      return accumulator + currentRate;
    }, 0);
    const linehaulSubTotalRate = transformedLinehaulArray.reduce((accumulator, item) => {
      // Force convert totalRate to a number safely, falling back to 0 if null/undefined
      const currentRate = Number(item.totalRate) || 0;
      return accumulator + currentRate;
    }, 0);
    const deliverySubTotalRate = transformedDeliveryArray.reduce((accumulator, item) => {
      // Force convert totalRate to a number safely, falling back to 0 if null/undefined
      const currentRate = Number(item.totalRate) || 0;
      return accumulator + currentRate;
    }, 0);
    const transformedCustomerArray = currentValues?.customerRate?.customerAccessorials?.map(item => {
      // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
      const factor = Number(item.input) || 0;
      const value = Number(item.chargeValue) || 0;

      return {
        rateType: item.chargeType,
        multiplicationFactor: factor,
        multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '', // 
        rateValue: value,
        // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
        totalRate: factor === 0 ? value : factor * value
      };
    });
    transformedCustomerArray.push({
      rateType: 'Rate',
      multiplicationFactor: null,
      multiplicationFactorUOM: '',
      rateValue: Number(currentValues?.customerRate?.rate),
      totalRate: Number(currentValues?.customerRate?.rate),
    });
    transformedCustomerArray.push({
      rateType: 'Fuel Surcharge (35% charge)',
      multiplicationFactor: null,
      multiplicationFactorUOM: '',
      rateValue: Number(currentValues?.customerRate?.fuelSurchargeRate),
      totalRate: Number(currentValues?.customerRate?.fuelSurchargeRate),
    });

    obj.shipmentRateDetails = {
      "carrierRateDetails": {
        "pickupRateDetails": {
          "invoiceNumber": currentValues?.carrierRates?.pickUp?.invoiceNo,
          "rateDetails": transformedPickupArray,
          "pickupSubTotalRate": pickupSubTotalRate,
          "invoiceApprovalStatus": "N"
        },
        "linehaulRateDetails": {
          "invoiceNumber": currentValues?.carrierRates?.lineHaul?.invoiceNo,
          "rateDetails": transformedLinehaulArray,
          "linehaulSubTotalRate": linehaulSubTotalRate,
          "invoiceApprovalStatus": "N"
        },
        "deliveryRateDetails": {
          "invoiceNumber": currentValues?.carrierRates?.delivery?.invoiceNo,
          "rateDetails": transformedDeliveryArray,
          "deliverySubTotalRate": deliverySubTotalRate,
          "invoiceApprovalStatus": "N"
        },
        "totalCarrierRate": Number(pickupSubTotalRate + linehaulSubTotalRate + deliverySubTotalRate),
      },
      "customerRateDetails": {
        "rateDetails": transformedCustomerArray,
        "totalCustomerRate": Number(
          transformedCustomerArray.reduce((sum, item) => sum + Number(item.totalRate || 0), 0)
        )
      }
    }
    console.log(obj.shipmentRateDetails);

    if (activeStep === 4) {
      dispatch(postStep1(obj));
    }

    if (activeStep === 2 && hasInitialData()) {
      setValue('doDetails.handlingUnits', currentValues.handlingUnits);
      setValue('doDetails.emergencyContactName', currentValues.emergencyContactName);
      setValue('doDetails.emergencyContactPhone', currentValues.emergencyContactPhone);
    }
  };
  const onFormSubmit = async () => {
    // Your API call here
    const currentValues = getValues();

    let valid = false;
    const obj = {};

    // adding to object
    // step 0
    obj.shipmentDetails = {
      "typeOfShipment": currentValues.shipmentType,
      "serviceLevel": currentValues.serviceLevel,
      "shipmentDate": currentValues.date
        ? new Date(currentValues.date).toLocaleDateString('en-CA')
        : "",
      "shipmentTime": currentValues.time
        ? new Date(currentValues.time).toLocaleTimeString('en-US', { hour12: false })
        : "",
      "orderReceivedPickupPending": "Y",
      "shipmentStatus": "Active"
    };
    // step 1
    obj.customerDetails = {
      "customerId": currentValues.billingCustomer.customerId,
      "stationId": currentValues.billingCustomer.stationId,
      "airportPickupService": watchedAirportPickupService ? "Y" : "N",
      "airportDeliveryService": watchedAirportDeliveryService ? "Y" : "N",
      "originAirportCode": currentValues.originAirport,
      "destinationAirportCode": currentValues.destinationAirport,
      // we have to update address when we select shipper details
      "shipperDetails": {
        'shipperId': currentValues?.shipperName?.shipperId || null,
        "shipperName": currentValues?.shipperName?.shipperName,
        "addressLine1": currentValues.shipperAddr1,
        "addressLine2": currentValues.shipperAddr2,
        "city": currentValues.shipperCity,
        "state": currentValues.shipperState,
        "zipCode": currentValues.shipperZip,
        "contactPersonName": currentValues.shipperContact,
        "phoneNumber": currentValues.shipperPhone,
        'entityId': currentValues?.shipperName?.entityId,
      },
      "pickupAirlineDetails": {
        "airlineId": currentValues?.shipperName?.shipperId || currentValues?.shipperName?.airlineId || null,
        "airlineNumber": Number(currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.shipperName?.airlineNumber) || null,
        "airlineCode": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.shipperName?.airlineCode || '',
        "airportCode": currentValues?.shipperName?.airportCode || watchedOriginAirport,
        "airlineName": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.shipperName?.airlineName || '',
        "addressLine1": currentValues?.shipperAddr1,
        "addressLine2": currentValues?.shipperAddr2,
        "city": currentValues.shipperCity,
        "state": currentValues.shipperState,
        "zipCode": currentValues.shipperZip,
        "contactPersonName": currentValues?.shipperContact,
        "phoneNumber": currentValues.shipperPhone,
        "handler": '',
        'entityId': currentValues?.shipperName?.entityId || null,
        "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
      },
      "consigneeDetails": {
        "consigneeId": currentValues?.consigneeName?.consigneeId || null,
        "consigneeName": currentValues?.consigneeName?.consigneeName,
        "addressLine1": currentValues.consigneeAddr1,
        "addressLine2": currentValues.consigneeAddr2,
        "city": currentValues.consigneeCity,
        "state": currentValues.consigneeState,
        "zipCode": currentValues.consigneeZip,
        "contactPersonName": currentValues.consigneeContact,
        "phoneNumber": currentValues.consigneePhone,
        'entityId': currentValues?.consigneeName?.entityId,
      },
      "deliveryAirlineDetails": {
        "airlineId": currentValues?.consigneeName?.consigneeId || currentValues?.consigneeName?.airlineId || null,
        "airlineNumber": Number(currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.consigneeName?.airlineNumber) || '',
        "airlineCode": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.consigneeName?.airlineCode || '',
        "airportCode": currentValues?.consigneeName?.airportCode || watchedDestinationAirport,
        "airlineName": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
        "addressLine1": currentValues.consigneeAddr1,
        "addressLine2": currentValues.consigneeAddr2,
        "city": currentValues.consigneeCity,
        "state": currentValues.consigneeState,
        "zipCode": currentValues.consigneeZip,
        "contactPersonName": currentValues?.consigneeContact,
        "phoneNumber": currentValues.consigneePhone,
        "handler": '',
        'entityId': currentValues?.consigneeName?.entityId || null,
        "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
      },
    };
    if (watchedAirportPickupService) {
      delete obj.customerDetails.shipperDetails;
    } else {
      delete obj.customerDetails.pickupAirlineDetails;
    }

    if (watchedAirportDeliveryService) {
      delete obj.customerDetails.consigneeDetails;
    } else {
      delete obj.customerDetails.deliveryAirlineDetails;
    }

    // step 2
    if (currentValues?.handlingUnits?.length > 0 && currentValues?.handlingUnits[0]?.uom) {
      obj.commodityDetails = {
        emergencyContactName: isHazmatSelected ? currentValues?.emergencyContactName : '',
        emergencyContactPhone: isHazmatSelected ? currentValues?.emergencyContactPhone : '',
        handlingUnits: currentValues?.handlingUnits.map(hu => ({
          handlingUnitUOM: hu.uom,
          handlingUnits: Number(hu.unitsCount) || 0, // Ensures it maps to a number
          unit: hu.unit,
          handlingLength: Number(hu.length) || 0,
          handlingWidth: Number(hu.width) || 0,
          handlingHeight: Number(hu.height) || 0,
          handlingWeight: Number(hu.weight) || 0,
          handlingWeightUnit: hu.weightUnit === 'lbs' ? 'LB' : hu.weightUnit === 'kgs' ? 'KG' : '', // Standardizes 'lbs' to 'LB'
          class: hu.class ? `Class ${hu.class}` : '', // Formats class number to "Class X"
          palletDetails: hu?.items?.map(item => ({
            pieces: Number(item?.pieces) || 0,
            piecesUOM: item?.piecesUom,
            description: item?.description,
            hazmat: item?.hazmatInfo ? 'Y' : 'N',
            hazmatDetails: item?.hazmatInfo ? {
              unNumber: item?.hazmatData?.unNumber,
              properShippingName: item?.hazmatData?.shippingName,
              hazardClass: `Class ${item?.hazmatData?.hazmatClass}`,
              packingGroup: `${item?.hazmatData?.packagingGroup}`,
              weight: Number(item?.hazmatData?.weight) || 0,
              technicalName: item?.hazmatData?.technicalName,
              contactPhoneNumber: item?.hazmatData?.contactPhone,
              hazmatDescription: item?.hazmatData?.description,
              // Converts boolean values to API's expected "Y" / "N" string flags
              limitedQuantity: item?.hazmatData?.limitedQuality ? "Y" : "N",
              marinePollutant: item?.hazmatData?.marinePollutant ? "Y" : "N",
              residueLastContained: item?.hazmatData?.residueLastContained ? "Y" : "N",
              reportableQuantity: item?.hazmatData?.reportableQuantity ? "Y" : "N",
              dotExemption: item?.hazmatData?.dotExemption ? "Y" : "N"
            } : null
          }))
        }))
      };
    }

    // step 3
    console.log(selectedRouting, watchedLinehaulSelectRouting);
    const [pickupTerminalId, pickupCarrierId] = watchedSelectedPickupCarrier.split('-');

    const [pickupToLocTerminalId, pickupToLocCarrierId] = watchedToLocation.split('-');

    // From Location
    const selectedPickupCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(pickupTerminalId) && item.carrierId === Number(pickupCarrierId)
    );

    // To Location
    const selectedPickupToCarrierObject = carrierTerminalDropdown.find(
      (item) => item.terminalId === Number(pickupToLocTerminalId) && item.carrierId === Number(pickupToLocCarrierId)
    );

    if (isPickupPending) {
      dispatch(postStep1(obj));
    }
    if (selectedRouting === 'pickup_only' && watchedSelectedPickupCarrier && !isPickupPending) {
      // obj to send

      if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
        if (currentValues?.carrierInfo?.toLocationType && currentValues?.carrierInfo.toLocation) {
          valid = true;
        } else {
          valid = false;
        }
      }

      if (currentValues?.carrierInfo?.pickupAlert) {
        if (currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes && currentValues?.carrierInfo?.pickupAlertDetails?.primaryEmail) {
          valid = true;
        } else {
          valid = false;
        }
      }

      if (currentValues?.carrierInfo?.addPickupAccessorial && currentValues?.carrierInfo?.pickupAccessorials?.length === 0) {
        valid = false;
      } else {
        valid = true;
      }


      if (valid) {
        setErrorVisible(false);
        obj.carrierDetails = {

          "pickupDetails": {
            "pickupRouting": "PICKUP_ONLY",
            "fromLocationType": "Shipper",
            "fromLocation": currentValues?.carrierInfo?.fromLocation,
            "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
            "carrierId": Number(pickupCarrierId),
            "terminalId": Number(pickupTerminalId),
            "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
            "editFromLocationDetails": {
              "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
              "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
              "city": currentValues?.carrierInfo?.manualAddress?.city,
              "state": currentValues?.carrierInfo?.manualAddress?.state,
              "zipCode": currentValues?.carrierInfo?.manualAddress?.zipCode
            },
            "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
            "pickupAgentTerminalDetails": {
              "toLocationType": "Carrier",
              "toLocation": currentValues?.carrierInfo?.toLocation || selectedPickupCarrierObject.carrierName,
              "toLocationEntityId": selectedPickupToCarrierObject?.entityId || null,
              "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
              "editToLocationDetails": {
                "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1 || selectedPickupCarrierObject?.address?.addressLine1,
                "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2 || selectedPickupCarrierObject?.address?.addressLine2,
                "city": currentValues?.carrierInfo?.manualToAddress?.city || selectedPickupCarrierObject?.address?.city,
                "state": currentValues?.carrierInfo?.manualToAddress?.state || selectedPickupCarrierObject?.address?.state,
                "zipCode": currentValues?.carrierInfo?.manualToAddress?.zipCode || selectedPickupCarrierObject?.address?.zipCode,
              }
            },
            "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
            "pickupAccessorialDetails": {
              "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                ...rest,
                notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
              })),
            },
            "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
            "pickupAlertDetails": {
              "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
              "emailInfo": {
                "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
                "additionalEmails": currentValues?.carrierInfo?.additionalEmail,
              }
            }
          },
        }
        dispatch(postStep1(obj));
      } else {
        setErrorVisible(true);
      }
    }
  };

  useEffect(() => {
    console.log(shipperAirlineDropdown);
  }, [shipperAirlineDropdown])

  useEffect(() => {
    if (watchedAirportPickupService !== undefined) {
      // if they check or uncheck the values have to be empty for the new select
      setValue('shipperAddr1', '');
      setValue('shipperAddr2', '');
      setValue('shipperCity', '');
      setValue('shipperState', '');
      setValue('shipperZip', '');
      setValue('shipperContact', '');
      setValue('shipperPhone', '');
    }
  }, [watchedAirportPickupService])
  useEffect(() => {
    if (watchedAirportDeliveryService !== undefined) {
      // if they check or uncheck the values have to be empty for the new select
      setValue('consigneeAddr1', '');
      setValue('consigneeAddr2', '');
      setValue('consigneeCity', '');
      setValue('consigneeState', '');
      setValue('consigneeZip', '');
      setValue('consigneeContact', '');
      setValue('consigneePhone', '');
    }
  }, [watchedAirportDeliveryService])
  useEffect(() => {
    if (pickupAccessorialsByEntityId.length > 0) {
      const updatedAcc = pickupAccessorialsByEntityId.map((acc, index) => ({
        ...acc,
        isManual: false,
      }));
      setPICKUP_MASTER_Accessorials(updatedAcc);
    } else {
      setPICKUP_MASTER_Accessorials([]);
    }
  }, [pickupAccessorialsByEntityId])
  useEffect(() => {
    if (linehaulAccessorialsByEntityId.length > 0) {
      const updatedAcc = linehaulAccessorialsByEntityId.map((acc, index) => ({
        ...acc,
        isManual: false,
      }));
      setLINEHAUL_MASTER_Accessorials(updatedAcc);
    } else {
      setLINEHAUL_MASTER_Accessorials([]);
    }
  }, [linehaulAccessorialsByEntityId])
  useEffect(() => {
    if (deliveryAccessorialsByEntityId.length > 0) {
      const updatedAcc = deliveryAccessorialsByEntityId.map((acc, index) => ({
        ...acc,
        isManual: false,
      }));
      setDELIVERY_MASTER_Accessorials(updatedAcc);
    } else {
      setDELIVERY_MASTER_Accessorials([]);
    }
  }, [deliveryAccessorialsByEntityId])
  useEffect(() => {
    // apply accessorial details
    if (custommerRateModal && stationAccessorialData.length > 0) {
      const updatedAcc = stationAccessorialData.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc.chargeType.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : '',
      }));
      // setValue('customerRate.customerAccessorials', updatedAcc);
      setCUSTOMER_MASTER_ACCESSORIALS(updatedAcc);
    }
  }, [custommerRateModal, stationAccessorialData])
  // when there is change in ziprate of customer, making 35% for fuelsurcharge
  useEffect(() => {
    // if (customerZipRate) {
    const zipRateString = customerZipRate || "0";

    // 2. Convert to a number and calculate 35%
    const zipRateNum = Number(zipRateString) || 0;
    const calculatedPercentage = zipRateNum * 0.35;
    setValue('customerRate.fuelSurchargeRate', calculatedPercentage);
    // }
  }, [customerZipRate])
  useEffect(() => {
    if (shipmentSuccess && activeStep === 4 || (activeStep === 3 && getValues('carrierInfo.orderReceivedPending'))) {
      navigate(PATH_DASHBOARD?.general?.dashboard?.root);
    }
  }, [shipmentSuccess])
  useEffect(() => {
    if (shipmentError) {
      setSnackbarMessage(`${(shipmentError?.error && shipmentError?.message) ? `${shipmentError?.error}. ${shipmentError?.message}` : `${shipmentError?.message ?? shipmentError}`}`);
      setShipmentErrorFlag(true);
    }
  }, [shipmentError])



  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Optional: reset app state here if necessary before retry
        console.log("Error boundary reset triggered");
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>

        <Box sx={{ p: 2, mt: 2 }}>

          {/* HEADER & STEPPER */}
          <Box
            sx={{
              position: 'sticky',
              top: 60,
              zIndex: 1100,
              // No solid background color assigned here
              bgcolor: 'rgb(229, 229, 229)',
              backdropFilter: 'blur(8px)', // Blurs underlying text cleanly during scroll
              WebkitBackdropFilter: 'blur(8px)', // Ensures cross-browser Safari support
              p: 1,
              pb: 1,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>

              <Box display={'flex'} alignItems={'center'}>
                <IconButton size="small" sx={{ color: '#a22' }} onClick={() => {
                  if (location?.pathname?.includes('dashboard')) {
                    navigate(PATH_DASHBOARD?.general?.dashboard?.root);
                  }
                  if (location?.pathname?.includes('shipment-building')) {
                    navigate(PATH_DASHBOARD?.shipmentBuilding?.root);
                  }
                }}>
                  <Iconify icon="weui:back-filled" sx={{ mr: 1 }} />
                </IconButton>

                <Typography variant="subtitle2" fontWeight="bold">New Shipment</Typography>

              </Box>



              <Stepper
                activeStep={activeStep}
                alternativeLabel
                connector={<CustomConnector />} // Optional: for the thick red/black line
              >
                {STEPS.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconComponent={CustomStepIcon}
                      sx={{
                        '& .MuiStepLabel-label': {
                          mt: 1,
                          fontSize: '0.70rem',
                          fontWeight: activeStep === index ? 'bold' : 'normal',
                          color: '#000',
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>



              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => { reset(); setActiveStep(0); }} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Cancel</Button>

                {activeStep > 0 && (

                  <Button variant="outlined" onClick={handleBack} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Back</Button>

                )}

                {/* Conditional Submit Button for Step 3 */}
                {
                  activeStep !== 3 && <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                  >
                    {activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                }
                {activeStep === 3 && isPickupPending &&
                  <Button
                    variant="contained"
                    onClick={onFormSubmit} // Your final submit function
                    sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                  >
                    Submit
                  </Button>}

                {
                  activeStep === 3 && selectedRouting === 'pickup_only' && getValues('carrierInfo.selectCarrier') &&
                  <>
                    <Button
                      variant="contained"
                      onClick={onFormSubmit} // Your final submit function
                      sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                    >
                      Submit
                    </Button>

                  </>
                }
                {
                  activeStep === 3 && !isPickupPending && <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                  >
                    {activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                }



              </Box>

            </Box>
            {type !== 'Edit' && <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mb: 2 }}>
              {/* Action Buttons Row */}
              <Stack direction="row" spacing={1} alignItems="center">
                {activeStep === 2 && <Button
                  variant="contained"
                  size="small"
                  // startIcon={<Iconify icon="solar:document-bold" />}
                  sx={{ bgcolor: '#a22', textTransform: 'none', height: 26, fontSize: '0.7rem' }}
                  onClick={() => setDoDetailsModal(true)}
                >
                  DO Details
                </Button>}
                {(activeStep === 3 || activeStep === 4) && <Button
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: '#a22', textTransform: 'none', height: 26, fontSize: '0.7rem' }}
                  onClick={() => {
                    setCustomerRateModal(true);
                  }}
                >
                  Customer Rate
                </Button>}

                <IconButton size="small" sx={{ color: '#a22' }} onClick={() => {
                  setOpenNotesDialog(true);
                  notesRef.current = {};
                }}>
                  <Iconify icon="streamline-ultimate:notes-book-bold" />
                </IconButton>
              </Stack>
            </Box>}
            {type === 'Edit' && <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                p: 1.5,
                borderRadius: '4px',
                position: 'relative'
              }}
            >
              {/* LEFT SECTION */}
              <Box sx={{ flex: '0 1 300px', bgcolor: '#cdcdcd', p: 1, borderRadius: '8px' }}>
                <Stack spacing={0.5}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                    <Typography sx={{ ...labelStyle, width: '100px' }}>PRO :</Typography>
                    <Typography sx={valueStyle}>CPRO9289280207</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                    <Typography sx={{ ...labelStyle, width: '100px' }}>Status :</Typography>
                    <Typography sx={valueStyle}>{liveShipmentStatus}</Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        ml: 2,
                        bgcolor: '#a22',
                        height: 20,
                        fontSize: '0.65rem',
                        textTransform: 'none'
                      }}
                      onClick={() => setShipmentStatusModal(true)}
                    >
                      Update
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ ...labelStyle, width: '100px' }}>Shipment Type :</Typography>
                    <Typography sx={valueStyle}>Air Import</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* RIGHT SECTION */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                {/* Service Details Box */}
                <Box sx={{ bgcolor: '#bdbdbd', borderRadius: '8px', p: 1, minWidth: '250px' }}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #999', pb: 0.5, mb: 0.5 }}>
                    <Typography sx={{ ...labelStyle, flex: 1 }}>Service Level :</Typography>
                    <Typography sx={{ ...valueStyle, textAlign: 'right' }}>Weekend Delivery</Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ ...labelStyle, flex: 1 }}>Date Specific :</Typography>
                    <Typography sx={{ ...valueStyle, textAlign: 'right' }}>03/29/2026</Typography>
                  </Box>
                </Box>

                {/* Action Buttons Row */}
                <Stack direction="row" spacing={1} alignItems="center">
                  {activeStep === 2 && <Button
                    variant="contained"
                    size="small"
                    // startIcon={<Iconify icon="solar:document-bold" />}
                    sx={{ bgcolor: '#a22', textTransform: 'none', height: 26, fontSize: '0.7rem' }}
                    onClick={() => setDoDetailsModal(true)}
                  >
                    DO Details
                  </Button>}
                  {(activeStep === 3 || activeStep === 4) && <Button
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: '#a22', textTransform: 'none', height: 26, fontSize: '0.7rem' }}
                    onClick={() => {
                      setCustomerRateModal(true);
                    }}
                  >
                    Customer Rate
                  </Button>}

                  <IconButton size="small" sx={{ color: '#a22' }} onClick={() => {
                    setOpenNotesDialog(true);
                    notesRef.current = {};
                  }}>
                    <Iconify icon="streamline-ultimate:notes-book-bold" />
                  </IconButton>
                </Stack>
              </Box>
            </Box>}
          </Box>

          {/* dialog for update shipment status  */}
          <ShipmentStatusUpdateDialog
            open={shipmentStatusModal}
            onClose={() => setShipmentStatusModal(false)}
            setValue={setValue}
            getValues={getValues}
            control={control}
            errors={errors}
            liveShipmentStatus={liveShipmentStatus}
          />

          {/* dialog for DO details */}
          <DoDetailsDialog
            open={doDetailsModal}
            onClose={() => setDoDetailsModal(false)}
            getValues={getValues}
            setValue={setValue}
            control={control}
            doDetailsFields={doDetailsFields}
            isHazmatSelectedInDoDetails={isHazmatSelectedInDoDetails}
          />

          {/* dialog for customer rate  */}
          <CustomerRateDialog
            open={custommerRateModal}
            onClose={() => {
              setCustomerRateModal(false);
            }}
            getValues={getValues}
            setValue={setValue}
            control={control}
            totals={totals}
            customerRateAccFields={customerRateAccFields}
            appendCustomerRateAccFields={appendCustomerRateAccFields}
            watchedHU={watchedHU}
            masterAccessorials={CUSTOMER_MASTER_ACCESSORIALS}
          />

          {/* STEP 0 */}

          {activeStep === 0 && (

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
                        helperText={errors.shipmentType ? 'This field is required' : ''}
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

                    rules={{ required: true }}

                    render={({ field }) => (

                      <TextField {...field} select fullWidth label="Service Level *" variant="standard" error={!!errors.serviceLevel}>

                        {serviceLevels.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}

                      </TextField>

                    )}

                  />

                </Box>

                <Box sx={{ flex: '1 1 22%' }}>

                  <Controller

                    name="date"

                    control={control}

                    rules={{ required: true }}

                    render={({ field }) => (

                      <DatePicker {...field} label="Select Date *" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.date } }} />

                    )}

                  />

                </Box>

                <Box sx={{ flex: '1 1 22%' }}>

                  <Controller

                    name="time"

                    control={control}

                    rules={{ required: true }}

                    render={({ field }) => (

                      <TimePicker {...field} label="Select Time *" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.time } }} />

                    )}

                  />

                </Box>

              </Box>

            </Paper>

          )}



          {/* STEP 1 */}

          {activeStep === 1 && (

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: ' 1px solid rgba(143, 143, 143, 1)', pb: 1, mb: 3 }}>Customer Details</Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, }}>
                <Controller
                  name="billingCustomer"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value, ref } }) => (
                    <Autocomplete
                      freeSolo
                      options={customerStationDropdown}
                      value={value || null}

                      onChange={(event, newValue) => {
                        dispatch(getStationAccessorialData(newValue?.stationEntityId));
                        onChange(newValue);
                        if (!newValue) {
                          dispatch(searchCustomerStationDropdown(''));
                        }
                      }}

                      onInputChange={(event, newInputValue, reason) => {
                        if (reason === 'input') {
                          dispatch(searchCustomerStationDropdown(newInputValue));
                          onChange(newInputValue);
                        }
                      }}

                      // 1. Updated: Ensures the input field displays both names when a selection is active
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        if (option.inputValue) return option.inputValue;

                        const name = option.customerName || '';
                        const station = option.stationName ? ` | ${option.stationName}` : '';
                        return `${name}${station}`;
                      }}

                      // 2. Added: Customizes how options look inside the popup dropdown list
                      renderOption={(props, option) => {
                        // Safe destructuring of key to prevent React list warnings
                        const { key, ...optionProps } = props;

                        return (
                          <Box component="li" key={`${option.customerEntityId}-${option.stationEntityId} `} {...optionProps}>
                            {option.customerName} {option.stationName ? ` | ${option.stationName}` : ''}
                          </Box>
                        );
                      }}

                      isOptionEqualToValue={(option, val) =>
                        option.customerId === val?.customerId || option.customerName === val?.customerName
                      }

                      renderInput={(params) => (
                        <TextField
                          {...params}
                          inputRef={ref}
                          fullWidth
                          label={`Billing Customer *`}
                          variant="standard"
                          error={!!errors['billingCustomer']}
                          helperText={errors['billingCustomer'] ? 'This field is required' : ''}
                        />
                      )}
                      sx={{ width: '30%', mb: 2 }}
                    />
                  )}
                />


              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Controller
                        name="carrierInfo.airportPickupService"
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
                    label={<Typography variant="body2">Airport Pickup Service</Typography>}
                  />
                </Box>

                {renderTextField('originAirport', 'Origin Airport Code', watchedAirportPickupService)}

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Controller
                        name="carrierInfo.airportDeliveryService"
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
                    label={<Typography variant="body2">Airport Delivery Service</Typography>}
                  />
                </Box>

                {renderTextField('destinationAirport', 'Destination Airport Code', watchedAirportDeliveryService)}

              </Box>


              {/* Shipper Section */}

              <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 4, position: 'relative' }}>

                <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Shipper Details</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>

                  {!watchedAirportPickupService && (
                    <Controller
                      name="shipperName" // Note: This field will now hold an object: { shipperId, shipperName }
                      control={control}
                      rules={{ required: !watchedAirportPickupService }}
                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={shipperDropdown}

                          // Map the current form state to the Autocomplete value
                          value={value || null}

                          // Fixes the duplicate key warning by generating explicit, unique keys for each dropdown item
                          renderOption={(props, option, state) => {
                            const uniqueKey = option.shipperId
                              ? `shipper-${option.shipperId}`
                              : `custom-${option.shipperName}-${state.index}`;

                            return (
                              <li {...props} key={uniqueKey}>
                                {option.inputValue ? `Add "${option.inputValue}"` : option.shipperName}
                              </li>
                            );
                          }}

                          // Update React Hook Form state when a choice is made
                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              // User typed text and pressed Enter
                              onChange({ shipperId: null, shipperName: newValue });
                              console.log('value to api', newValue);
                            } else if (newValue && newValue.inputValue) {
                              // User clicked the "Add [Custom Text]" option
                              onChange({ shipperId: null, shipperName: newValue.inputValue });
                              console.log('value to api', newValue.inputValue);
                            } else if (newValue) {
                              // User selected an existing shipper object
                              onChange(newValue);
                              if (Object.keys(newValue).length > 0) {
                                setValue('shipperAddr1', newValue.addressLine1 || '');
                                setValue('shipperAddr2', newValue.addressLine2 || '');
                                setValue('shipperCity', newValue.city || '');
                                setValue('shipperState', newValue.state || '');
                                setValue('shipperZip', newValue.zipCode || '');
                                setValue('shipperContact', newValue.contactPersonName || '');
                                setValue('shipperPhone', newValue.phoneNumber || '');
                              }
                            } else {
                              // Handles cases where the clear (x) button is clicked
                              onChange(null);
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            }
                          }}

                          // Fallback mechanism for typing text freely without selecting dropdown choices
                          onInputChange={(event, newInputValue, reason) => {
                            // Only update as a raw string if typing manually (not clicking an option)
                            if (reason === 'input') {
                              // onChange({ shipperId: null, shipperName: newInputValue });
                              console.log('value to api', newInputValue);
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            }
                          }}

                          // Generates the dynamic "Add..." option if it does not match anything
                          filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const { inputValue } = params;

                            const isExisting = options.some(
                              (option) => inputValue.toLowerCase() === option.shipperName.toLowerCase()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue,
                                shipperName: `${inputValue}`,
                              });
                            }

                            return filtered;
                          }}

                          // Tells MUI how to read the text label out of your objects
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                              return option;
                            }
                            if (option.inputValue) {
                              return option.inputValue;
                            }
                            return option.shipperName || '';
                          }}

                          // Useful for object comparisons to determine selection highlighting
                          isOptionEqualToValue={(option, val) =>
                            option.shipperId === val?.shipperId || option.shipperName === val?.shipperName
                          }

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref} // Forwards validation focus back to React Hook Form
                              fullWidth
                              label={`Shipper Name ${watchedAirportPickupService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['shipperName']}
                              helperText={errors['shipperName'] ? 'This field is required' : ''}
                            />
                          )}
                          sx={{ width: '25%' }}
                        />
                      )}
                    />
                  )}

                  {watchedAirportPickupService && (
                    <Controller
                      name="shipperName"
                      control={control}
                      rules={{
                        required: watchedAirportPickupService ? 'This field is required' : false,
                        validate: (value) => {
                          if (!value) return true; // Handled by 'required' if empty

                          // 1. Skip custom text check if a valid selection was chosen from the dropdown list
                          if (typeof value === 'object' && value.airlineId) {
                            return true;
                          }

                          // 2. Fallback check for manually typed custom text strings
                          const textToValidate = typeof value === 'string' ? value : (value.airlineName || '');

                          // Check if the exact full string matches an existing option's formatted text
                          const isPreExisting = shipperAirlineDropdown.some((opt) => {
                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                          });
                          if (isPreExisting) return true;

                          // 3. Strict component checks for completely custom text entries
                          const parts = textToValidate.split('-').map(p => p.trim());

                          const numPart = parts[0] || '';
                          const codePart = parts[1] || '';
                          const namePart = parts[2] || '';

                          // Validate Airline Number (Matches the 4-digit requirement)
                          if (!/^\d{4}$/.test(numPart)) {
                            return 'Airline Number must be exactly 4 digits (Ex: 6788)';
                          }

                          // Validate Airline Code (Exactly 3 letters)
                          if (!/^[A-Za-z]{3}$/.test(codePart)) {
                            return 'Airline Code must be exactly 3 letters (Ex: AAA)';
                          }

                          // Validate Airline Name exists
                          if (!namePart) {
                            return 'Please provide the Airline Name at the end';
                          }

                          // Final structural confirmation (Digits - 3 Letters - Name)
                          const formatRegex = /^\d{4} - [A-Z]{3} - .+$/i;
                          if (!formatRegex.test(textToValidate.trim())) {
                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                          }

                          return true;
                        }
                      }}

                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={
                            watchedOriginAirport ? shipperAirlineDropdown.filter(
                              (item) => item.airportCode === watchedOriginAirport
                            ) : shipperAirlineDropdown
                          }
                          value={value || null}

                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              onChange({ airlineId: null, airlineName: newValue });
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            } else if (newValue && newValue.inputValue) {
                              onChange({ airlineId: null, airlineName: newValue.inputValue });
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            } else if (newValue) {
                              onChange(newValue);
                              // setValue('shipperAddr1', newValue.addressLine1 || '');
                              //   setValue('shipperAddr2', newValue.addressLine2 || '');
                              //   setValue('shipperCity', newValue.city || '');
                              //   setValue('shipperState', newValue.state || '');
                              //   setValue('shipperZip', newValue.zipCode || '');
                              //   setValue('shipperContact', newValue.contactPersonName || '');
                              //   setValue('shipperPhone', newValue.phoneNumber || '');
                            } else {
                              // Safe fallback when the input selection is cleared out entirely
                              onChange(null);
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            }
                          }}

                          // User-friendly typing mask handler matching the strict 4-digit/3-letter validation rules
                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                              let formatted = newInputValue;

                              if (!isDeleting) {
                                // Strip out illegal symbols, keep alphanumeric text and spaces/hyphens
                                let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                // Rule A: Auto-append " - " ONLY when exactly 4 digits are reached
                                if (/^\d{4}$/.test(clean)) {
                                  formatted = `${clean} - `;
                                }

                                // Rule B: Auto-format the airline code portion to uppercase and append " - "
                                const match = clean.match(/^(\d{4})\s*-\s*([A-Za-z]{3})$/);
                                if (match) {
                                  formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                }
                              }
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');

                              onChange({ airlineId: null, airlineName: formatted });
                            }
                          }}

                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            if (option.inputValue) return option.inputValue;

                            if (option.airlineId) {
                              const num = option.airlineNumber || '';
                              const code = option.airlineCode || '';
                              const name = option.airlineName || '';
                              const city = option.city || '';
                              const airCode = option.airportCode || '';
                              return `${num} - ${code} - ${name} - ${city} - ${airCode}`;
                            }

                            return option.airlineName || '';
                          }}

                          isOptionEqualToValue={(option, val) =>
                            option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                          }

                          // Resolves duplicate key warning by generating a unique string per element using its state index
                          renderOption={(props, option, state) => {
                            const { key, ...optionProps } = props;
                            const uniqueKey = option.airlineId
                              ? `airline-${option.airlineId}-${state.index}`
                              : `custom-airline-${state.index}`;

                            if (option.inputValue) {
                              return (
                                <Box
                                  component="li"
                                  key={uniqueKey}
                                  {...optionProps}
                                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                                >
                                  Add : "{option.inputValue}"
                                </Box>
                              );
                            }

                            const num = option.airlineNumber || '';
                            const code = option.airlineCode || '';
                            const name = option.airlineName || '';
                            const city = option.city || '';
                            const airCode = option.airportCode || '';

                            return (
                              <Box component="li" key={uniqueKey} {...optionProps}>
                                {`${num} - ${code} - ${name} - ${city} - ${airCode}`}
                              </Box>
                            );
                          }}

                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            const searchStr = (inputValue || '').toLowerCase().trim();

                            const filtered = options.filter((option) => {
                              return (
                                String(option.airlineNumber || '').toLowerCase().includes(searchStr) ||
                                String(option.airlineCode || '').toLowerCase().includes(searchStr) ||
                                String(option.airlineName || '').toLowerCase().includes(searchStr) ||
                                String(option.city || '').toLowerCase().includes(searchStr) ||
                                String(option.airportCode || '').toLowerCase().includes(searchStr)
                              );
                            });

                            const isExisting = options.some(
                              (option) => searchStr === String(option.airlineName || '').toLowerCase().trim()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue,
                                airlineName: `${inputValue}`,
                              });
                            }

                            return filtered;
                          }}

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref}
                              fullWidth
                              label={`Airline Name ${watchedAirportPickupService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['shipperName']}
                              helperText={errors['shipperName']?.message || 'Format: Airline Number - Airline Code - Airline Name'}
                            />
                          )}
                          sx={{ width: '25%' }}
                        />
                      )}
                    />
                  )}


                  {renderTextField('shipperAddr1', 'Address Line 1')}

                  {renderTextField('shipperAddr2', 'Address Line 2')}

                  {renderTextField('shipperCity', 'City')}

                  {renderTextField('shipperState', 'State')}

                  {renderZipCodeField('shipperZip')}

                  {renderTextField('shipperContact', 'Contact Person Name')}

                  {renderPhoneField('shipperPhone', 'Phone Number')}

                </Box>

              </Box>



              {/* Consignee Section */}

              <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, position: 'relative' }}>

                <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Consignee Details</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>


                  {!watchedAirportDeliveryService && (
                    <Controller
                      name="consigneeName" // This field will hold the chosen object structure
                      control={control}
                      rules={{ required: !watchedAirportDeliveryService }}
                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={consigneeDropdown}

                          // Bind form state object or fallback to null
                          value={value || null}

                          // Fixes the duplicate key warning by generating explicit, unique keys for each dropdown item
                          renderOption={(props, option, state) => {
                            const uniqueKey = option.consigneeId
                              ? `consignee-${option.consigneeId}`
                              : `custom-${option.consigneeName}-${state.index}`;

                            return (
                              <li {...props} key={uniqueKey}>
                                {option.inputValue ? `Add "${option.inputValue}"` : option.consigneeName}
                              </li>
                            );
                          }}

                          // Handles selection clicks or pressing 'Enter'
                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              // User typed text and manually hit Enter
                              onChange({ consigneeId: null, consigneeName: newValue });
                            } else if (newValue && newValue.inputValue) {
                              // User clicked the custom dynamic 'Add "..."' option
                              onChange({ consigneeId: null, consigneeName: newValue.inputValue });
                            } else if (newValue) {
                              // User selected an existing item from the dropdown
                              onChange(newValue);
                              if (Object.keys(newValue).length > 0) {
                                setValue('consigneeAddr1', newValue.addressLine1 || '');
                                setValue('consigneeAddr2', newValue.addressLine2 || '');
                                setValue('consigneeCity', newValue.city || '');
                                setValue('consigneeState', newValue.state || '');
                                setValue('consigneeZip', newValue.zipCode || '');
                                setValue('consigneeContact', newValue.contactPersonName || '');
                                setValue('consigneePhone', newValue.phoneNumber || '');
                              }
                            } else {
                              // Safe fallback if the user clears out the text entirely
                              onChange(null);
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            }
                          }}

                          // Captures custom text changes if user clicks away without selecting/hitting Enter
                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              // onChange({ consigneeId: null, consigneeName: newInputValue });
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            }
                          }}

                          // Generates the "Add [Custom Text]" selection item if it is not in the array
                          filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const { inputValue } = params;

                            const isExisting = options.some(
                              (option) => inputValue.toLowerCase() === option.consigneeName.toLowerCase()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue,
                                consigneeName: `${inputValue}`,
                              });
                            }

                            return filtered;
                          }}

                          // Tells MUI how to display text from your specific object structure
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                              return option;
                            }
                            if (option.inputValue) {
                              return option.inputValue;
                            }
                            return option.consigneeName || '';
                          }}

                          // Ensures proper matching for active highlighted selections
                          isOptionEqualToValue={(option, val) =>
                            option.consigneeId === val?.consigneeId || option.consigneeName === val?.consigneeName
                          }

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref} // Keeps form validation ref focus working properly
                              fullWidth
                              label={`Consignee Name ${watchedAirportDeliveryService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['consigneeName']}
                              helperText={errors['consigneeName'] ? 'This field is required' : ''}
                            />
                          )}
                          sx={{ width: '25%' }}
                        />
                      )}
                    />
                  )}

                  {watchedAirportDeliveryService && (
                    <Controller
                      name="consigneeName"
                      control={control}
                      rules={{
                        required: watchedAirportDeliveryService ? 'This field is required' : false,
                        validate: (value) => {
                          if (!value) return true; // Handled by 'required' if empty

                          // 1. Skip custom text check if a valid selection was chosen from the dropdown list
                          if (typeof value === 'object' && value.airlineId) {
                            return true;
                          }

                          // 2. Fallback check for manually typed custom text strings
                          const textToValidate = typeof value === 'string' ? value : (value.airlineName || '');

                          // Check if the exact full string matches an existing option's formatted text
                          const isPreExisting = consigneeAirlineDropdown.some((opt) => {
                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                          });
                          if (isPreExisting) return true;

                          // 3. Strict component checks for completely custom text entries
                          const parts = textToValidate.split('-').map(p => p.trim());

                          const numPart = parts[0] || '';
                          const codePart = parts[1] || '';
                          const namePart = parts[2] || '';

                          // Validate Airline Number (Matches the 4-digit requirement)
                          if (!/^\d{4}$/.test(numPart)) {
                            return 'Airline Number must be exactly 4 digits (Ex: 6788)';
                          }

                          // Validate Airline Code (Exactly 3 letters)
                          if (!/^[A-Za-z]{3}$/.test(codePart)) {
                            return 'Airline Code must be exactly 3 letters (Ex: AAA)';
                          }

                          // Validate Airline Name exists
                          if (!namePart) {
                            return 'Please provide the Airline Name at the end';
                          }

                          // Final structural confirmation (Digits - 3 Letters - Name)
                          const formatRegex = /^\d{4} - [A-Z]{3} - .+$/i;
                          if (!formatRegex.test(textToValidate.trim())) {
                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                          }

                          return true;
                        }
                      }}

                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={
                            watchedDestinationAirport ? consigneeAirlineDropdown.filter(
                              (item) => item.airportCode === watchedDestinationAirport
                            ) : consigneeAirlineDropdown
                          }
                          value={value || null}

                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              onChange({ airlineId: null, airlineName: newValue });
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            } else if (newValue && newValue.inputValue) {
                              onChange({ airlineId: null, airlineName: newValue.inputValue });
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            } else if (newValue) {
                              onChange(newValue);
                              // setValue('consigneeAddr1', newValue.addressLine1 || '');
                              // setValue('consigneeAddr2', newValue.addressLine2 || '');
                              // setValue('consigneeCity', newValue.city || '');
                              // setValue('consigneeState', newValue.state || '');
                              // setValue('consigneeZip', newValue.zipCode || '');
                              // setValue('consigneeContact', newValue.contactPersonName || '');
                              // setValue('consigneePhone', newValue.phoneNumber || '');
                            } else {
                              // Safe fallback when the input selection is cleared out entirely via 'X' button
                              onChange(null);
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            }
                          }}

                          // User-friendly typing mask handler matching the strict 4-digit/3-letter validation rules
                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                              let formatted = newInputValue;

                              if (!isDeleting) {
                                // Strip out illegal symbols, keep alphanumeric text and spaces/hyphens
                                let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                // Rule A: Auto-append " - " ONLY when exactly 4 digits are reached
                                if (/^\d{4}$/.test(clean)) {
                                  formatted = `${clean} - `;
                                }

                                // Rule B: Auto-format the airline code portion to uppercase and append " - "
                                const match = clean.match(/^(\d{4})\s*-\s*([A-Za-z]{3})$/);
                                if (match) {
                                  formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                }
                              }

                              onChange({ airlineId: null, airlineName: formatted });
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            }
                          }}

                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            if (option.inputValue) return option.inputValue;

                            if (option.airlineId) {
                              const num = option.airlineNumber || '';
                              const code = option.airlineCode || '';
                              const name = option.airlineName || '';
                              const city = option.city || '';
                              const airCode = option.airportCode || '';
                              return `${num} - ${code} - ${name} - ${city} - ${airCode}`;
                            }

                            return option.airlineName || '';
                          }}

                          isOptionEqualToValue={(option, val) =>
                            option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                          }

                          // Resolves duplicate key warning by generating a unique key using state index
                          renderOption={(props, option, state) => {
                            const { key, ...optionProps } = props;
                            const uniqueKey = option.airlineId
                              ? `consignee-airline-${option.airlineId}-${state.index}`
                              : `custom-consignee-airline-${state.index}`;

                            if (option.inputValue) {
                              return (
                                <Box
                                  component="li"
                                  key={uniqueKey}
                                  {...optionProps}
                                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                                >
                                  Add :  "{option.inputValue}"
                                </Box>
                              );
                            }

                            const num = option.airlineNumber || '';
                            const code = option.airlineCode || '';
                            const name = option.airlineName || '';
                            const city = option.city || '';
                            const airCode = option.airportCode || '';

                            return (
                              <Box component="li" key={uniqueKey} {...optionProps}>
                                {`${num} - ${code} - ${name} - ${city} - ${airCode}`}
                              </Box>
                            );
                          }}

                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            const searchStr = (inputValue || '').toLowerCase().trim();

                            const filtered = options.filter((option) => {
                              return (
                                String(option.airlineNumber || '').toLowerCase().includes(searchStr) ||
                                String(option.airlineCode || '').toLowerCase().includes(searchStr) ||
                                String(option.airlineName || '').toLowerCase().includes(searchStr) ||
                                String(option.city || '').toLowerCase().includes(searchStr) ||
                                String(option.airportCode || '').toLowerCase().includes(searchStr)
                              );
                            });

                            const isExisting = options.some(
                              (option) => searchStr === String(option.airlineName || '').toLowerCase().trim()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue,
                                airlineName: `${inputValue}`,
                              });
                            }

                            return filtered;
                          }}

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref}
                              fullWidth
                              label={`Airline Name ${watchedAirportDeliveryService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['consigneeName']}
                              helperText={errors['consigneeName']?.message || 'Format: Airline Number - Airline Code - Airline Name'}
                            />
                          )}
                          sx={{ width: '25%' }}
                        />
                      )}
                    />
                  )}


                  {renderTextField('consigneeAddr1', 'Address Line 1')}

                  {renderTextField('consigneeAddr2', 'Address Line 2')}

                  {renderTextField('consigneeCity', 'City')}

                  {renderTextField('consigneeState', 'State')}

                  {renderZipCodeField('consigneeZip')}

                  {renderTextField('consigneeContact', 'Contact Person Name')}

                  {renderPhoneField('consigneePhone', 'Phone Number')}

                </Box>

              </Box>

            </Paper>

          )}

          {/* STEP 2 */}

          {activeStep === 2 && (
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Box sx={{ flex: '1 1 120px' }}>
                      <Controller name={`handlingUnits.${huIdx}.uom`} control={control} render={({ field }) => (
                        <TextField {...field} select fullWidth label="Handling Units UOM *" variant="standard" InputLabelProps={{ shrink: true }}
                          SelectProps={{
                            displayEmpty: true,
                            MenuProps: {
                              // Crucial: disables internal centering logic so origins work
                              getContentAnchorEl: null,
                              // Prevents layout shifts and menu misplacement on scroll
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
                                  marginTop: '4px', // Your custom gap
                                  maxHeight: 300,
                                  maxWidth: 300    // Recommended to prevent long lists from going off-screen
                                }
                              }
                            },
                          }}
                        >
                          {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </TextField>
                      )} />
                    </Box>
                    <Box sx={{ flex: '1 1 100px' }}>
                      <Controller
                        name={`handlingUnits.${huIdx}.unitsCount`}
                        control={control}
                        // 1. Validation rule ensuring only numeric entries are valid
                        rules={{
                          required: "Handling units count is required",
                          pattern: {
                            value: /^[0-9]+$/,
                            message: "Please enter a valid number"
                          }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            // 2. Overriding the onChange handler to physically block letters/symbols instantly
                            onChange={(e) => {
                              const cleanValue = e.target.value.replace(/[^0-9]/g, ''); // Strips everything except digits 0-9
                              field.onChange(cleanValue);
                            }}
                            fullWidth
                            label="Handling Units *"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            // 3. Optional: Tells mobile browsers to display a numeric keypad layout
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            // 4. Displays error states if validation fails
                            error={!!errors?.handlingUnits?.[huIdx]?.unitsCount}
                            helperText={errors?.handlingUnits?.[huIdx]?.unitsCount?.message || ""}
                          />
                        )}
                      />

                    </Box>
                    <Box sx={{ flex: '1 1 80px' }}>
                      <Controller name={`handlingUnits.${huIdx}.unit`} control={control} render={({ field }) => (
                        <TextField {...field} select fullWidth label="Unit *" variant="standard" InputLabelProps={{ shrink: true }}>
                          <MenuItem value="in">in</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                        </TextField>
                      )} />
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
                      <Box display={'flex'} alignItems={'flex-end'}>
                        <Controller name={`handlingUnits.${huIdx}.weight`} control={control} render={({ field }) => (
                          <TextField {...field} fullWidth label="Weight" variant="standard" InputLabelProps={{ shrink: true }} />
                        )} />
                        <Controller name={`handlingUnits.${huIdx}.weightUnit`} control={control} render={({ field }) => (
                          <TextField {...field} select sx={{ width: '100px' }} label="" variant="standard" InputLabelProps={{ shrink: true }}>
                            <MenuItem value="lbs">lbs</MenuItem>
                            <MenuItem value="kgs">kgs</MenuItem>
                          </TextField>
                        )} />
                      </Box>
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
                              renderValue: (selected) => selected || <em>Select Class</em>,
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
                      <Controller name="emergencyContactName" control={control} render={({ field }) => (
                        <TextField {...field} fullWidth label="Contact Name" variant="standard" required={isHazmatSelected} />
                      )} />
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
          )}


          {/* STEP 3 */}

          {activeStep === 3 && (
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
                        <Controller name="carrierInfo.manualAddress.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedFromLocationFlag} />
                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller name="carrierInfo.manualAddress.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedFromLocationFlag} />} />
                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller name="carrierInfo.manualAddress.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedFromLocationFlag} />
                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller name="carrierInfo.manualAddress.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedFromLocationFlag} />
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
                              value={watchedConsigneeName.consigneeName ?? ''}// Your hardcoded static value displayed to the user
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
                          <Controller name="carrierInfo.manualToAddress.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedToLocationFlag} />
                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller name="carrierInfo.manualToAddress.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedToLocationFlag} />
                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller name="carrierInfo.manualToAddress.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedToLocationFlag} />
                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller name="carrierInfo.manualToAddress.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedToLocationFlag} />
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

                      {/* Input field captures the "Enter" key */}
                      <Controller
                        name="carrierInfo.pickupAlertDetails.pickupNotes"
                        control={control}
                        defaultValue=""
                        rules={{
                          required: watchedCarrierInfo.pickupAlert ? 'Pickup notes is required' : '',
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Notes"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            required={watchedCarrierInfo.pickupAlert}
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
                            control={control}
                            render={({ field }) => <TextField {...field} fullWidth label="Carrier's Bill Number *" variant="standard" />}
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
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} />
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
                                  value={watchedConsigneeName.consigneeName ?? ''}// Your hardcoded static value displayed to the user
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
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} />
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
                            rules={{ required: true }}
                            render={({ field, fieldState: { error, isTouched } }) => (
                              <DatePicker
                                {...field}
                                label="ETA Date"
                                slotProps={{
                                  textField: {
                                    variant: 'standard',
                                    fullWidth: true,
                                    // FIX 1: Uses the exact field error slice from the render arguments
                                    // FIX 2: (Optional) Only shows error if the user has interacted with it
                                    error: !!error && isTouched
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
                                      <IconButton onClick={() => removeLineHaulAcc(index)} size="small"><Iconify icon="material-symbols:delete-rounded" /></IconButton>
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
                            control={control}
                            render={({ field }) => <TextField {...field} fullWidth label="Carrier's Bill Number *" variant="standard" />}
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
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} />} />
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
                                    const uniqueKey = `delivery-tolocation-${option.terminalId}-${option.carrierId}-${state.index}`;
                                    return (
                                      <li {...props} key={uniqueKey}>
                                        {option.carrierName && option.terminalName
                                          ? `${option.carrierName} | ${option.terminalName}`
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
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} />
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
                            rules={{ required: true }}
                            render={({ field, fieldState: { error, isTouched } }) => (
                              <DatePicker
                                {...field}
                                label="ETA Date"
                                slotProps={{
                                  textField: {
                                    variant: 'standard',
                                    fullWidth: true,
                                    // FIX: Targets the specific error block for delivery details
                                    // only after the user interacts with the input (isTouched)
                                    error: !!error && isTouched
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
                                      <IconButton onClick={() => removeDeliveryAcc(index)} size="small"><Iconify icon="material-symbols:delete-rounded" /></IconButton>
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

                <Snackbar open={carrierTerminalSelectError} autoHideDuration={3000} onClose={() => setCarrierTerminalSelectError(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>

                  <Alert severity="information" variant="filled">Please select a carrier and terminal for {watchedLineHaulToggledAddress}.</Alert>

                </Snackbar>

              </>}

            </Paper>
          )}

          {/* step 4 */}

          {
            activeStep === 4 && (<Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, borderBottom: ' 1px solid rgba(143, 143, 143, 1)' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, }}>
                  Carrier Rates
                </Typography>
              </Box>
              <CarrierSection
                type={type}
                fields={carrierRatesPickUpAccessorials}
                sectionName={`Pickup Carrier ${watchedCarrierRateInfo.pickUp.pickUpCarrier ? `-  ${carrierTerminalDropdown.find(
                  (item) => item.terminalId === Number(watchedSelectedPickupCarrier.split('-')?.[0]) && item.carrierId === Number(watchedSelectedPickupCarrier.split('-')?.[1])
                )?.carrierName || ''}` : ''}`}
                rate={'carrierRates.pickUp.pickUpRate'}
                totalSubCharges={(
                  parseFloat(watchedCarrierRateInfo.pickUp.pickUpRate || 0) +
                  watchedCarrierRateInfo.pickUp.pickupAccessorials.reduce((sum, item) => {
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
                watchedCarrierRateInfo={watchedCarrierRateInfo}
                setValue={setValue}
                path="carrierRates.pickUp.pickupAccessorials"
                control={control}
                getValues={getValues}
                totals={totals}
                apiZipRate={`${watchedCarrierRateInfo.pickUp.apiPickUpRate || ''}`}
                invoiceNo={'watchedCarrierRateInfo.pickUp.invoiceNo'}
              />
              <CarrierSection
                type={type}
                fields={carrierRatesLineHaulAccessorials}
                sectionName={`Line Haul Carrier ${watchedCarrierRateInfo.lineHaul.lineHaulCarrier ? `-  ${carrierTerminalDropdown.find(
                  (item) => item.terminalId === Number(watchedSelectedLineHaulCarrier.split('-')?.[0]) && item.carrierId === Number(watchedSelectedLineHaulCarrier.split('-')?.[1])
                )?.carrierName || ''}` : ''}`}
                rate={'carrierRates.lineHaul.lineHaulRate'}
                totalSubCharges={(
                  parseFloat(watchedCarrierRateInfo.lineHaul.lineHaulRate || 0) +
                  watchedCarrierRateInfo.lineHaul.lineHaulAccessorials.reduce((sum, item) => {
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
                watchedCarrierRateInfo={watchedCarrierRateInfo}
                setValue={setValue}
                path="carrierRates.lineHaul.lineHaulAccessorials"
                control={control}
                getValues={getValues}
                totals={totals}
                apiZipRate={`${watchedCarrierRateInfo.lineHaul.apiLineHaulRate || ''}`}
                invoiceNo={`watchedCarrierRateInfo.lineHaul.invoiceNo`}
              />
              <CarrierSection
                type={type}
                fields={carrierRatesDeliveryAccessorials}
                sectionName={`Delivery Carrier ${watchedCarrierRateInfo.delivery.deliveryCarrier ? `-  ${carrierTerminalDropdown.find(
                  (item) => item.terminalId === Number(watchedSelectedDeliveryCarrier.split('-')?.[0]) && item.carrierId === Number(watchedSelectedDeliveryCarrier.split('-')?.[1])
                )?.carrierName || ''}` : ''}`}
                rate='carrierRates.delivery.deliveryRate'
                totalSubCharges={(
                  parseFloat(watchedCarrierRateInfo.delivery.deliveryRate || 0) +
                  watchedCarrierRateInfo.delivery.deliveryAccessorials.reduce((sum, item) => {
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
                watchedCarrierRateInfo={watchedCarrierRateInfo}
                setValue={setValue}
                path="carrierRates.delivery.deliveryAccessorials"
                control={control}
                getValues={getValues}
                totals={totals}
                apiZipRate={`${watchedCarrierRateInfo.delivery.apiDeliveryRate || ''}`}
                invoiceNo={`watchedCarrierRateInfo.delivery.invoiceNo`}
              />

              {/* Grand total  */}
              <Box sx={{ bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', p: 1.5, borderRadius: 1, mt: 2, justifyContent: 'flex-end', gap: 12, mr: '10%' }}>
                  <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ minWidth: 100 }}>
                    {(
                      // 1. PickUp Section
                      // ((selectedRouting === "Line haul & Delivery" || selectedRouting === "Line haul")
                      //   ? 
                      (parseFloat(watchedCarrierRateInfo.pickUp.pickUpRate || 0) +
                        watchedCarrierRateInfo.pickUp.pickupAccessorials.reduce((sum, item) => {
                          const charge = parseFloat(item.chargeValue) || 0;
                          const input = (item.input !== undefined && item.input !== "" && item.input !== null) ? parseFloat(item.input) : null;
                          return sum + (input !== null ? charge * input : charge);
                        }, 0))
                      // : 0) 
                      +

                      // 2. LineHaul Section
                      // ((selectedRouting === "None")
                      //   ? 
                      (parseFloat(watchedCarrierRateInfo.lineHaul.lineHaulRate || 0) +
                        watchedCarrierRateInfo.lineHaul.lineHaulAccessorials.reduce((sum, item) => {
                          const charge = parseFloat(item.chargeValue) || 0;
                          const input = (item.input !== undefined && item.input !== "" && item.input !== null) ? parseFloat(item.input) : null;
                          return sum + (input !== null ? charge * input : charge);
                        }, 0))
                      // : 0) 
                      +

                      // 3. Delivery Section
                      // ((selectedRouting === "Line haul & Delivery" || selectedRouting === "None")
                      //   ?
                      (parseFloat(watchedCarrierRateInfo.delivery.deliveryRate || 0) +
                        watchedCarrierRateInfo.delivery.deliveryAccessorials.reduce((sum, item) => {
                          const charge = parseFloat(item.chargeValue) || 0;
                          const input = (item.input !== undefined && item.input !== "" && item.input !== null) ? parseFloat(item.input) : null;
                          return sum + (input !== null ? charge * input : charge);
                        }, 0))
                      // : 0)
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/*  invoice approval section */}


            </Paper>)
          }



          <Snackbar open={errorVisible} autoHideDuration={3000} onClose={() => setErrorVisible(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>

            <Alert severity="error" variant="filled">Please fill required fields.</Alert>

          </Snackbar>

          <Snackbar
            open={handlingUnitWtFlag}
            autoHideDuration={3000}
            onClose={(event, reason) => {
              // 1. Close the alert
              setHandlingUnitWtFlag(false);

              // 2. Prevent logic if the user clicked away (optional)
              if (reason === 'clickaway') return;

              // 3. Correctly update the state/array
              const updatedHU = [...watchedHU]; // Create a copy
              const lastIndex = updatedHU.length - 1;

              if (updatedHU[0] && updatedHU[lastIndex]) {
                updatedHU[lastIndex].weightUnit = updatedHU[0].weightUnit;
                setValue('handlingUnits', updatedHU); // Update the form state if needed
              }
              if (updatedHU[0] && updatedHU[lastIndex]) {
                updatedHU[lastIndex].unit = updatedHU[0].unit;
                setValue('handlingUnits', updatedHU); // Update the form state if needed
              }
            }}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert severity="error" variant="filled">
              All items must have the same weight unit as the first item
            </Alert>
          </Snackbar>

          <Snackbar
            open={shipmentErrorFlag}
            autoHideDuration={3000}
            onClose={() => {
              setShipmentErrorFlag(false);
              dispatch(setError());
            }}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={() => {
                setShipmentErrorFlag(false);
                dispatch(setError());
              }}
              severity="error"
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>


        </Box>
        {/* Place this at the end of your return block */}
        <HazmatDialog
          state={hazmatModal}
          onClose={() => setHazmatModal({ ...hazmatModal, open: false })}
          setValue={setValue}
          getValues={getValues}
        />
        <Dialog open={openNotesDialogForShipmentAccs} onClose={handleNotesCloseConfirmForShipmentAccs} onKeyDown={(event) => {
          if (event.key === 'Escape') {
            handleNotesCloseConfirmForShipmentAccs();
          }
        }}
          sx={{
            '& .MuiDialog-paper': { // Target the paper class
              width: '1000px',
              height: '80%',
              maxHeight: 'none',
              maxWidth: 'none',
            }
          }}
        >
          <DialogContent>
            <>
              <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Internal Note Section</Typography>
                <Iconify icon="carbon:close" onClick={() => handleNotesCloseConfirmForShipmentAccs()} sx={{ cursor: 'pointer' }} />
              </Stack>
              <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            <Box sx={{ pt: 2 }}>
              <NotesTableForAccessorials notes={notesRefArray.current} handleCloseConfirm={handleNotesCloseConfirmForShipmentAccs}
                getValues={getValues} setValue={setValue} index={notesRefArrayIndex.current} updatePickupAcc={updatePickupAcc}
                updateLineHaulAcc={updateLineHaulAcc}
                updateDeliveryAcc={updateDeliveryAcc}
                field={notesRefArrayObj.current} activeAccType={activeAccType} />
            </Box>
          </DialogContent>
        </Dialog>
        <Dialog open={openNotesDialog} onClose={handleNotesCloseConfirm} onKeyDown={(event) => {
          if (event.key === 'Escape') {
            handleNotesCloseConfirm();
          }
        }}
          sx={{
            '& .MuiDialog-paper': { // Target the paper class
              width: '1000px',
              height: '80%',
              maxHeight: 'none',
              maxWidth: 'none',
            }
          }}
        >
          <DialogContent>
            <>
              <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Internal Note Section</Typography>
                <Iconify icon="carbon:close" onClick={() => handleNotesCloseConfirm()} sx={{ cursor: 'pointer' }} />
              </Stack>
              <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            <Box sx={{ pt: 2 }}>
              <NotesTable notes={notesRef.current} handleCloseConfirm={handleNotesCloseConfirm} />
            </Box>
          </DialogContent>
        </Dialog>

      </LocalizationProvider >
    </ErrorBoundary>

  );

};



export default ShipmentForm; 
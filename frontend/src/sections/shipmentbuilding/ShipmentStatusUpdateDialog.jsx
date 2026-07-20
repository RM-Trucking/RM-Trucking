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

const shipmentStatusOptions = [
  {
    label: 'Order received Pickup Pending',
    value: 'ORDER_RECEIVED_PICKUP_PENDING'
  },
  {
    label: 'Order received Pickup Setup',
    value: 'ORDER_RECEIVED_PICKUP_SETUP'
  },
  {
    label: 'Dispatched / RSL',
    value: 'DISPATCHED_RSL'
  },
  {
    label: 'Picked',
    value: 'PICKED'
  },
  {
    label: 'At Warehouse',
    value: 'AT_WAREHOUSE'
  },
  {
    label: 'To be recovered',
    value: 'TO_BE_RECOVERED'
  },
  {
    label: 'To be Routed',
    value: 'TO_BE_ROUTED'
  },
  {
    label: 'Added to Queue',
    value: 'ADDED_TO_QUEUE'
  },
  {
    label: 'Manifested',
    value: 'MANIFESTED'
  },
  {
    label: 'Carrier Picked Up',
    value: 'CARRIER_PICKED_UP'
  },
  {
    label: 'In Transit',
    value: 'IN_TRANSIT'
  },
  {
    label: 'Delivered',
    value: 'DELIVERED'
  },
  {
    label: 'Appointment',
    value: 'APPOINTMENT'
  },
  {
    label: 'Recovered Short',
    value: 'RECOVERED_SHORT'
  }
];

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

                    <TextField {...field} select fullWidth label="Type of Shipment *" variant="standard" error={!!errors?.shipmentStatus?.status} SelectProps={{
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

                      {shipmentStatusOptions.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}

                    </TextField>

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentStatus.date"

                  control={control}

                  render={({ field }) => (

                    <DatePicker {...field} label="Date" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.date } }} />

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentStatus.time"

                  control={control}

                  render={({ field }) => (

                    <TimePicker {...field} label="Time" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.time } }} />

                  )}

                />

              </Box>
              <Box sx={{ flex: '1 1 22%' }}>
                <Controller name="shipmentStatus.location" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField {...field} fullWidth label="Current Location *" variant="standard" error={!!errors?.location} />
                )} />
              </Box>
            </Box>
            {liveShipmentStatus === 'Delivered' && <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
              <Box width={"25%"}>
                <Controller name="shipmentStatus.signature" control={control} render={({ field }) => (
                  <TextField fullWidth {...field} label="Signature" variant="standard" error={!!errors?.signature} />
                )} />
              </Box>
              <Box width={"22%"}>

                <Controller

                  name="shipmentStatus.deliveryDate"

                  control={control}

                  render={({ field }) => (

                    <DatePicker required {...field} label="Delivery Date*" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.deliveryDate } }} />

                  )}

                />

              </Box>
              <Box width={"22%"}>

                <Controller

                  name="shipmentStatus.deliveryTime"

                  control={control}

                  render={({ field }) => (

                    <TimePicker required {...field} label="Delivery Time*" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.deliveryTime } }} />

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

                    <DatePicker required {...field} label="Appointment Date*" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.appointmentDate } }} />

                  )}

                />

              </Box>
              <Box width={'22%'}>

                <Controller

                  name="shipmentStatus.appointmentTime"

                  control={control}

                  render={({ field }) => (

                    <TimePicker required {...field} label="Appointment Time*" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors?.appointmentTime } }} />

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
export default ShipmentStatusUpdateDialog; 
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

const HandleCancelDialog = ({ open, onClose, onSave, }) => {
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Information</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', }}>
            Are you sure you want to cancel?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ color: '#000', borderColor: '#000' }}>Cancel</Button>
          <Button onClick={onSave} variant="contained" sx={{ bgcolor: '#a22' }}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HandleCancelDialog; 

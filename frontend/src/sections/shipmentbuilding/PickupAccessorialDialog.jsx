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

  const handleCancelAllSelections = () => {
    // 1. Map through the entire array and explicitly set 'selected' to false for every item
    const resetList = MASTER_ACCESSORIALS.map((item) => ({
      ...item,
      selected: false, // Forces all items from true to false
    }));

    // 2. Push the completely cleaned list back into your React state
    setMASTER_Accessorials(resetList);
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
          <Button onClick={handleCancelAllSelections} variant="outlined" sx={{ color: '#000', borderColor: '#000' }}>Cancel</Button>
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

export default PickupAccessorialDialog; 
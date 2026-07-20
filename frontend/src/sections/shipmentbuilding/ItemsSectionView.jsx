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

import HazmatDialogView from './HazmatDialogView';

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
export default ItemsSectionView; 
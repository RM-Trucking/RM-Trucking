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

const ItemsSection = ({ huIndex, control, watchedHU, openHazmat, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `handlingUnits.${huIndex}.items`,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' // 'error' | 'warning' | 'info' | 'success'
  });
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', pb: 2.5 }}>
              {/* 1. Changed alignItems to 'flex-start' so inputs don't stretch vertically when an error appears */}
              {/* 2. Added pb: 2.5 (padding-bottom) to make permanent safe space for the absolute positioned text below */}

              <Box sx={{ display: 'flex', alignItems: 'center', pt: 2 }}>
                <Iconify icon="solar:box-bold" />
                <Typography variant="caption" sx={{ minWidth: 100, fontWeight: 'bold', ml: 1 }}>
                  {fields.length === 1 ? "Pallet Details" : `Item ${itemIndex + 1}`}
                </Typography>
              </Box>

              <Box sx={{ flex: '0 1 120px' }}>
                <Controller
                  name={`handlingUnits.${huIndex}.items.${itemIndex}.pieces`}
                  control={control}
                  rules={{
                    required: "Pieces count is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Must be a whole number"
                    }
                  }}
                  render={({ field, formState }) => {
                    const pieceError = formState.errors?.handlingUnits?.[huIndex]?.items?.[itemIndex]?.pieces;

                    return (
                      <TextField
                        {...field}
                        onChange={(e) => {
                          const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(cleanValue);
                        }}
                        label="Pieces *"
                        variant="standard"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        error={!!pieceError}
                        helperText={pieceError?.message || ""}
                        // FIX: Forces error text to absolute position to stop row stretching
                        FormHelperTextProps={{
                          sx: { position: 'absolute', bottom: -20, left: 0, whiteSpace: 'nowrap' }
                        }}
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
                          getContentAnchorEl: null,
                          disableScrollLock: true,
                          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                          transformOrigin: { vertical: 'top', horizontal: 'left' },
                          PaperProps: { sx: { marginTop: '4px', maxHeight: 300, maxWidth: 300 } }
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
                  rules={{
                    required: "Description is required",
                    maxLength: { value: 255, message: "Description cannot exceed 255 characters" }
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val.slice(0, 255));
                      }}
                      label="Description *"
                      variant="standard"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!error}
                      helperText={error ? error.message : ''}
                      inputProps={{ maxLength: 255 }}
                      // FIX: Forces error text to absolute position to stop row stretching
                      FormHelperTextProps={{
                        sx: { position: 'absolute', bottom: -20, left: 0 }
                      }}
                    />
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
                            if (e.target.checked) { openHazmat(huIndex, itemIndex) }
                            else {
                              // Clear hazmatData if unchecked
                              setValue(`handlingUnits.${huIndex}.items.${itemIndex}.hazmatData`, null);
                            };
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
            setSnackbar({
              open: true,
              message: 'Please fill item details before adding more.',
              severity: 'error'
            });
          }
        }}
        sx={{ bgcolor: '#a22', textTransform: 'none', mt: 1, '&:hover': { bgcolor: '#811' } }}
      >
        Add Item
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Optional position tweak
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default ItemsSection; 
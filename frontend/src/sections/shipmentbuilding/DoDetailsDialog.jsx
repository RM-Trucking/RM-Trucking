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
import ItemsSectionView from './ItemsSectionView';
import CommoditiesList from './CommoditiesList';

const commonBtnStyle = {

  height: '24px',

  fontWeight: 600,

  textTransform: 'none',

  borderRadius: '4px',

  boxShadow: 'none',

  px: 2,

  fontSize: '0.8rem',

};
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

export default DoDetailsDialog; 

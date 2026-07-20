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

export default HazmatDialogView; 
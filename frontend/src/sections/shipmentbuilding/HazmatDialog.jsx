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
const HazmatDialog = ({ state, onClose, setValue, getValues }) => {
  const { open, huIdx, itemIdx } = state;
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' // 'error' | 'warning' | 'info' | 'success'
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({
      open: false,
      message: '',
      severity: 'error'
    });
  };

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
      setSnackbar({
        open: false,
        message: '',
        severity: 'error'
      });
      // 2. Fetch data for the SPECIFIC item currently being edited 
      const existingData = getValues(`handlingUnits.${huIdx}.items.${itemIdx}.hazmatData`);
      if (existingData) {
        setEditMode(true);
        setLocalData(existingData);
      } else {
        setEditMode(false);
        // 3. CRITICAL: If Item 2 is new, reset to empty so Item 1's data doesn't persist
        setLocalData(emptyHazmat);
      }
    }
  }, [open, huIdx, itemIdx, getValues]);



  if (!open) return null;

  const hanldeClose = () => {
    setLocalData(emptyHazmat);
    onClose();
  }

  const handleSave = () => {
    const requiredFields = [
      { key: 'unNumber', label: 'UN Number' },
      { key: 'shippingName', label: 'Shipping Name' },
      { key: 'packagingGroup', label: 'Packaging Group' },
      { key: 'hazmatClass', label: 'Hazmat Class' },
      { key: 'weight', label: 'Weight' },
      { key: 'weightUnit', label: 'UOM' },
      { key: 'contactPhone', label: 'Contact Phone' }
    ];

    // 1. Check for empty required fields
    const missingFields = requiredFields.filter(field => !String(localData[field.key])?.trim());

    if (missingFields.length > 0) {
      const newErrors = {};
      missingFields.forEach(field => {
        newErrors[field.key] = `${field.label} is required`;
      });
      setErrors(prev => ({ ...prev, ...newErrors }));

      setSnackbar({
        open: true,
        message: `Required fields missing: ${missingFields.map(f => f.label).join(', ')}`,
        severity: 'error'
      });
      return;
    }

    // 2. FIXED: Explicitly run the UN Number validation on submit
    const unNumberError = validateUNNumber(localData.unNumber || "");
    if (unNumberError) {
      setErrors(prev => ({ ...prev, unNumber: unNumberError }));
      setSnackbar({
        open: true,
        message: unNumberError, // Displays "UN Number cannot be more than 4 digits" or similar
        severity: 'error'
      });
      return; // STOPS THE SAVE PATH
    }

    // 3. Validate phone format
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}.*$/;
    if (!phoneRegex.test(localData.contactPhone)) {
      setErrors(prev => ({ ...prev, contactPhone: 'Invalid phone format' }));
      setSnackbar({
        open: true,
        message: 'Invalid phone format. Expected: (XXX) XXX-XXXX',
        severity: 'error'
      });
      return;
    }

    // Success path (Only runs if all above checks pass cleanly)
    setValue(`handlingUnits.${huIdx}.items.${itemIdx}.hazmatData`, localData);
    onClose();
  };


  const handleChange = (field, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };
  const validateUNNumber = (value) => {
    if (!value) return "UN Number is required";

    // Regex matches 'UN' (case-insensitive) followed by exactly 4 digits
    const unRegex = /^UN\d{4}$/i;
    if (!unRegex.test(value)) {
      return "Must start with 'UN' followed by 4 digits (e.g., UN1234)";
    }
    return "";
  };
  const hazmatClassOptions = [
    {
      label: "Class 1.1: Explosives - Mass explosion hazard",
      value: "Class 1.1"
    },
    {
      label: "Class 1.2: Explosives - Projection hazard",
      value: "Class 1.2"
    },
    {
      label: "Class 1.3: Explosives - Fire hazard",
      value: "Class 1.3"
    },
    {
      label: "Class 1.4: Explosives - Minor explosion hazard",
      value: "Class 1.4"
    },
    {
      label: "Class 1.5: Explosives - Very insensitive substances",
      value: "Class 1.5"
    },
    {
      label: "Class 1.6: Explosives - Extremely insensitive articles",
      value: "Class 1.6"
    },
    {
      label: "Class 2.1: Gases - Flammable gases",
      value: "Class 2.1"
    },
    {
      label: "Class 2.2: Gases - Non-flammable, non-toxic compressed gases",
      value: "Class 2.2"
    },
    {
      label: "Class 2.3: Gases - Toxic/poisonous gases by inhalation",
      value: "Class 2.3"
    },
    {
      label: "Class 3: Flammable Liquids",
      value: "Class 3"
    },
    {
      label: "Class 4.1: Flammable Solids - Self-reactive substances",
      value: "Class 4.1"
    },
    {
      label: "Class 4.2: Spontaneously Combustible Materials",
      value: "Class 4.2"
    },
    {
      label: "Class 4.3: Dangerous When Wet Materials",
      value: "Class 4.3"
    },
    {
      label: "Class 5.1: Oxidizing Substances",
      value: "Class 5.1"
    },
    {
      label: "Class 5.2: Organic Peroxides",
      value: "Class 5.2"
    },
    {
      label: "Class 6.1: Poisonous (toxic) Materials",
      value: "Class 6.1"
    },
    {
      label: "Class 6.2: Infectious Substances",
      value: "Class 6.2"
    },
    {
      label: "Class 7: Radioactive Materials",
      value: "Class 7"
    },
    {
      label: "Class 8: Corrosives",
      value: "Class 8"
    },
    {
      label: "Class 9: Miscellaneous Dangerous Goods",
      value: "Class 9"
    }
  ];

  const allUNNumbers = Array.from({ length: 3600 }, (_, i) => `UN${(i + 1).toString().padStart(4, '0')}`);
  const shippingNames = [
    "ACETONE",
    "ACETONITRILE",
    "AEROSOLS, flammable",
    "AEROSOLS, non-flammable, toxic",
    "ALCOHOLS, N.O.S.",
    "AMMUNITION, SMOKE",
    "ARGON, COMPRESSED",
    "BATTERIES, WET, FILLED WITH ACID",
    "BUTANES",
    "CARBON, ACTIVATED",
    "CHLORINE",
    "CHLOROFORM",
    "CORROSIVE LIQUID, ACIDIC, INORGANIC, N.O.S.",
    "CORROSIVE LIQUID, FLAMMABLE, N.O.S.",
    "DIESEL FUEL",
    "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S.",
    "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, SOLID, N.O.S.",
    "ETHANOL",
    "ETHANOL SOLUTION",
    "EXTINGUISHERS, FIRE",
    "FLAMMABLE LIQUID, N.O.S.",
    "FLAMMABLE SOLID, ORGANIC, N.O.S.",
    "FLARES, AERIAL",
    "GAS OIL",
    "GASOLINE",
    "HELIUN, COMPRESSED",
    "HYDROCHLORIC ACID",
    "HYDROGEN, REFRIGERATED LIQUID",
    "HYPOCHLORITE SOLUTION",
    "ISOPROPANOL",
    "ISOPROPYL ALCOHOL",
    "KEROSENE",
    "LITHIUM ION BATTERIES",
    "LITHIUM METAL BATTERIES",
    "LIQUEFIED PETROLEUM GAS",
    "METHANOL",
    "MOTOR SPIRIT",
    "NITROGEN, COMPRESSED",
    "NITROGEN, REFRIGERATED LIQUID",
    "OXIDIZING LIQUID, N.O.S.",
    "OXYGEN, COMPRESSED",
    "OXYGEN, REFRIGERATED LIQUID",
    "PAINT",
    "PAINT RELATED MATERIAL",
    "PERFUMERY PRODUCTS",
    "PETROLEUM DISTILLATES, N.O.S.",
    "POTASSIUM CYANIDE, SOLID",
    "RADIOACTIVE MATERIAL, EXCEPTED PACKAGE",
    "SODIUM HYDROXIDE SOLUTION",
    "SULFURIC ACID",
    "TOXIC LIQUID, ORGANIC, N.O.S.",
    "TURPENTINE",
    "XENON, COMPRESSED",
    "XYLENES"
  ];


  return (
    <Dialog open={open} onClose={onClose} sx={{
      '& .MuiPaper-root': { borderRadius: '12px' }, '& .MuiDialog-paper': { // Target the paper class
        width: '1000px',
        height: 'auto',
        maxHeight: 'none',
        maxWidth: 'none',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', py: 2 }}>{editMode ? 'Edit' : 'Add'} Hazmat Info</DialogTitle>

      <DialogContent sx={{ mt: 2, pb: 4 }}>
        {/* Row 1: UN, Shipping Name, PKG Group, Class */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 22%' }}>
            <Autocomplete
              freeSolo
              options={allUNNumbers}
              value={localData.unNumber || ""}

              onChange={(event, newValue) => {
                const val = newValue || "";
                handleChange('unNumber', val);

                // Trigger validation on selection
                const errorMsg = validateUNNumber(val);
                setErrors?.(prev => ({ ...prev, unNumber: errorMsg }));
              }}

              onInputChange={(event, newInputValue) => {
                // Optional: Automatically force uppercase as they type
                const upperVal = (newInputValue || "").toUpperCase();
                handleChange('unNumber', upperVal);

                // Trigger validation on typing
                const errorMsg = validateUNNumber(upperVal);
                setErrors?.(prev => ({ ...prev, unNumber: errorMsg }));
              }}

              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  variant="standard"
                  label="UN Number"
                  fullWidth
                  // Displays styling and message dynamically based on your error state tracker
                  error={!!errors?.unNumber}
                  helperText={errors?.unNumber || " "}
                />
              )}
            />

          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <Autocomplete
              freeSolo
              options={shippingNames}

              // 1. FIXED: Convert state to a string format or fallback safely
              value={localData.shippingName || ""}

              // Handles selection changes from the menu list or Enter press
              onChange={(event, newValue) => {
                const val = typeof newValue === 'string' ? newValue : (newValue?.label || "");
                // 2. FIXED: Slice value to 100 characters max
                handleChange('shippingName', val.slice(0, 100));
              }}

              // Handles character-by-character user text entry
              onInputChange={(event, newInputValue, reason) => {
                // 3. FIXED: Only intercept on manual keyboard inputs to protect standard state updates
                if (reason === 'input') {
                  handleChange('shippingName', (newInputValue || "").slice(0, 100));
                }
              }}

              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  variant="standard"
                  label="Shipping Name"
                  fullWidth
                  // 4. FIXED: Wire up errors dynamically if tracking via an validation error map
                  error={!!errors?.shippingName}
                  helperText={errors?.shippingName || " "}

                  // 5. FIXED: Hard native element layout limit set to 100 characters
                  inputProps={{
                    ...params.inputProps,
                    maxLength: 100
                  }}
                />
              )}
            />


          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField
              label="Packaging Group"
              required
              variant="standard"
              fullWidth
              value={localData.packagingGroup || ""}
              onChange={(e) => {
                // 1. FIXED: Truncates text instantly to a 50 character maximum limit
                const val = e.target.value;
                handleChange('packagingGroup', val.slice(0, 50));
              }}
              // 2. FIXED: Wire up errors dynamically if tracking via an validation error state map
              error={!!errors?.packagingGroup}
              helperText={errors?.packagingGroup || ""}
              // 3. FIXED: Hard browser barrier blocking physical keyboard strokes at character 50
              inputProps={{
                maxLength: 50
              }}
            />

          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <Autocomplete
              freeSolo
              options={hazmatClassOptions}
              value={
                hazmatClassOptions.find(opt => opt.value === localData.hazmatClass) ||
                localData.hazmatClass ||
                ""
              }
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.label || "";
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  handleChange('hazmatClass', newValue.slice(0, 50)); // Truncates option if string is somehow long
                } else if (newValue && newValue.value) {
                  handleChange('hazmatClass', newValue.value);
                } else {
                  handleChange('hazmatClass', "");
                }
              }}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  // FIXED: Prevents state from saving typed characters past index 50
                  handleChange('hazmatClass', (newInputValue || "").slice(0, 50));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  variant="standard"
                  label="Class"
                  fullWidth
                  error={!!errors?.hazmatClass}
                  helperText={errors?.hazmatClass || " "}
                  // FIXED: Hard browser barrier blocking physical keyboard strokes past 50 characters
                  inputProps={{
                    ...params.inputProps,
                    maxLength: 50
                  }}
                />
              )}
            />


          </Box>
        </Box>



        {/* Row 2: Weight, Technical Name, Contact Phone */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 20%', }}>
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
          </Box>
          <Box sx={{ flex: '1 1 15%', }}>
            <TextField
              label="UOM"
              required
              variant="standard"
              fullWidth // Added to maintain consistent sizing layout
              value={localData.weightUnit || ""}
              onChange={(e) => {
                // 1. FIXED: Truncates text instantly to a 10 character maximum limit
                const val = e.target.value;
                handleChange('weightUnit', val.slice(0, 10));
              }}
              // 2. FIXED: Wire up errors dynamically if tracking via a validation error state map
              error={!!errors?.weightUnit}
              helperText={errors?.weightUnit || ""}
              // 3. FIXED: Hard browser barrier blocking physical keyboard strokes at character 10
              inputProps={{
                maxLength: 10
              }}
            />

          </Box>
          <Box sx={{ flex: '1 1 25%' }}>
            <TextField
              label="Technical Name"
              variant="standard"
              fullWidth
              // Fallback to empty string if value is undefined or null to prevent un-controlled input warnings
              value={localData.technicalName || ""}
              onChange={(e) => {
                // 1. FIXED: Truncates pasted text immediately to a 100 character maximum limit
                const val = e.target.value;
                handleChange('technicalName', val.slice(0, 100));
              }}
              // 2. FIXED: Wire up errors dynamically if tracking via an validation error state map
              error={!!errors?.technicalName}
              helperText={errors?.technicalName || ""}
              // 3. FIXED: Hard browser barrier blocking physical keyboard strokes past character 100
              inputProps={{
                maxLength: 100
              }}
            />

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
              // Safe fallback to prevent uncontrolled input console warnings
              value={localData.description || ""}
              onChange={(e) => {
                // 1. FIXED: Truncates pasted text immediately to a 255 character maximum limit
                const val = e.target.value;
                handleChange('description', val.slice(0, 255));
              }}
              InputProps={{ disableUnderline: true }}
              // 2. FIXED: Wire up errors dynamically if tracking via a validation error state map
              error={!!errors?.description}
              helperText={errors?.description || ""}
              // 3. FIXED: Hard browser barrier blocking physical keyboard strokes past 255 characters
              inputProps={{
                maxLength: 255
              }}
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
      </DialogContent>



      <DialogActions sx={{ p: 3, justifyContent: 'flex-start', gap: 2 }}>
        <Button onClick={hanldeClose} variant="outlined" sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000', px: 4 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ ...commonBtnStyle, bgcolor: '#a22', px: 4, '&:hover': { bgcolor: '#811' } }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HazmatDialog; 
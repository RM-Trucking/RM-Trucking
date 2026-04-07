import React, { useState, useEffect } from 'react';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';

import {
  Box, Stepper, Step, StepLabel, Typography, TextField, MenuItem,
  Button, Paper, Alert, Snackbar, Checkbox, FormControlLabel, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, StepConnector, stepConnectorClasses, styled,

} from '@mui/material';

import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';



// --- CONSTANTS & LISTS --- 
const shipmentTypes = [

  'Air Import',

  'Air Export',

  'Ocean Import',

  'Ocean Export',

  'Domestic',

  'Non-Forwarder Domestic',

];

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



const customers = ['Customer 1', 'Customer 2', 'Customer 3'];
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
                  render={({ field }) => (
                    <TextField {...field} label="Pieces *" variant="standard" fullWidth InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Box>

              <Box sx={{ flex: '1 1 80px' }}>
                <Controller
                  name={`handlingUnits.${huIndex}.items.${itemIndex}.piecesUom`}
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Pieces UOM *" variant="standard" fullWidth InputLabelProps={{ shrink: true }}>
                      {['Skid', 'Pallet', 'Box', 'Crate'].map((u) => (
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
                  {`${hazData.unNumber}, ${hazData.shippingName}, (${hazData.technicalName}), ${hazData.class}, ${hazData.packagingGroup}, ${hazData.weight} lbs`}
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
            append({ pieces: '', piecesUom: 'Skid', description: '', hazmatInfo: false, hazmatData: null });
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
            <TextField select label="UN Number *" variant="standard" fullWidth value={localData.unNumber} onChange={(e) => handleChange('unNumber', e.target.value)}>
              <MenuItem value="UN1567">UN1567</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField select label="Shipping Name *" variant="standard" fullWidth value={localData.shippingName} onChange={(e) => handleChange('shippingName', e.target.value)}>
              <MenuItem value="Hazard Substance,liquid.n.o.s">Hazard Substance,liquid.n.o.s</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField label="Packaging Group *" variant="standard" fullWidth value={localData.packagingGroup} onChange={(e) => handleChange('packagingGroup', e.target.value)} />
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField label="Class *" variant="standard" fullWidth value={localData.hazmatClass} onChange={(e) => handleChange('hazmatClass', e.target.value)} />
          </Box>
        </Box>



        {/* Row 2: Weight, Technical Name, Contact Phone */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 22%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <Box display={'flex'} alignItems={'flex-end'}>
              <TextField label="Weight *" variant="standard" fullWidth value={localData.weight} onChange={(e) => handleChange('weight', e.target.value)} />
              <TextField select variant="standard" value={localData.weightUnit} onChange={(e) => handleChange('weightUnit', e.target.value)} sx={{ width: '80px' }}>
                <MenuItem value="lbs">lbs</MenuItem>
                <MenuItem value="kgs">kgs</MenuItem>
              </TextField>
            </Box>
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField label="Technical Name *" variant="standard" fullWidth value={localData.technicalName} onChange={(e) => handleChange('technicalName', e.target.value)} />
          </Box>
          <Box sx={{ flex: '1 1 22%' }}>
            <TextField
              label="Contact phone *"
              variant="standard"
              fullWidth
              value={localData.contactPhone || ''}
              inputProps={{ maxLength: 20 }}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith(' ')) return; // Prevent leading spaces [cite: 37]

                // Apply the same formatting mask used in Step 1 
                const formattedValue = formatPhoneNumber(val).slice(0, 20);
                // Update data
                handleChange('contactPhone', formattedValue);

                // Real-time Validation Logic 
                const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}.*$/;
                if (!formattedValue) {
                  setErrors(prev => ({ ...prev, contactPhone: 'Phone number is required' }));
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
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.weight}</td>
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

const ShipmentForm = () => {

  const [activeStep, setActiveStep] = useState(0);
  const [errorVisible, setErrorVisible] = useState(false);
  // This state controls the opening, closing, and index of the Hazmat modal
  const [hazmatModal, setHazmatModal] = useState({ open: false, huIdx: null, itemIdx: null });



  const {
    control,
    trigger,
    formState: { errors },
    reset,
    getValues, setValue

  } = useForm({

    defaultValues: {

      // Step 0 

      shipmentType: '',

      serviceLevel: '',

      date: null,

      time: null,

      // Step 1 - Customer 

      billingCustomer: '',

      originAirport: '',

      destinationAirport: '',

      // Step 1 - Shipper 

      shipperName: '',

      shipperAddr1: '',

      shipperAddr2: '',

      shipperCity: '',

      shipperZip: '',

      shipperContact: '',

      shipperPhone: '',

      // Step 1 - Consignee 

      consigneeName: '',

      consigneeAddr1: '',

      consigneeAddr2: '',

      consigneeCity: '',

      consigneeZip: '',

      consigneeContact: '',

      consigneePhone: '',

      // Step 2 - Handling Units 

      handlingUnits: [{
        uom: 'Skid', unitsCount: '02', unit: 'in', length: '20', width: '20', height: '20', weight: '200', weightUnit: 'lbs', class: '40',
        items: [{ pieces: '50', piecesUom: 'Skid', description: '24 Bottles of Nitric acid', hazmatInfo: false }]
      }],
      emergencyContactName: '',
      emergencyContactPhone: ''

    },

  });

  const { fields: huFields, append: appendHU, remove: removeHU } = useFieldArray({ control, name: "handlingUnits" });

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
      lastUnit.unitsCount &&
      lastUnit.length &&
      lastUnit.width &&
      lastUnit.height &&
      lastUnit.weight &&
      lastUnit.class;

    if (isFilled) {
      appendHU({
        uom: '',
        unitsCount: '',
        unit: 'in',
        length: '',
        width: '',
        height: '',
        weight: '',
        weightUnit: 'lbs',
        class: '',
        items: [{
          pieces: '',
          piecesUom: 'Skid', // Added missing piecesUom
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

  // This checks if any item has hazmat checked to show the Emergency Contact
  const isHazmatSelected = watchedHU?.some((hu) =>
    hu.items?.some((item) => item.hazmatInfo)
  );


  const handleNext = async () => {

    // let fieldsToValidate = [];

    // if (activeStep === 0) {

    //   fieldsToValidate = ['shipmentType', 'serviceLevel', 'date', 'time'];

    // } else if (activeStep === 1) {

    //   fieldsToValidate = [

    //     'billingCustomer',

    //     'originAirport',

    //     'destinationAirport',

    //     'shipperZip',

    //     'consigneeZip',

    //     'shipperPhone',

    //     'consigneePhone',

    //   ];

    // }



    // const isValid = await trigger(fieldsToValidate);

    // if (isValid) {

    setActiveStep((prev) => prev + 1);

    // } else {

    //   setErrorVisible(true);

    // }

  };



  const handleBack = () => setActiveStep((prev) => prev - 1);

  // --- HELPER: RENDER ZIP CODE --- 

  const renderZipCodeField = (name) => (

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

        control={control}

        rules={{

          validate: (value) => {

            if (!value || value.length <= 5) return true;

            const parts = value.split('-');

            if (parts.length === 2 && parts[1].length === 5) {

              const startSuffix = parseInt(parts[0].slice(-2));

              const endSuffix = parseInt(parts[1].slice(-2));

              if (endSuffix === startSuffix) return 'End range cannot be equal to start';

              if (endSuffix < startSuffix) return 'End range must be greater than start';

              return true;

            }

            return 'Complete the range (#####-#####)';

          },

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

            inputProps={{ maxLength: 11 }}

            onChange={(e) => {

              const input = e.target.value;

              const raw = input.replace(/[^\d]/g, '');

              const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

              if (!input || raw.length === 0 || (isDeleting && (input.length <= 5 || !input.includes('-')))) {

                onChange(raw.slice(0, 5));

                return;

              }

              let formatted = '';

              if (raw.length <= 5) {

                formatted = raw;

              } else {

                const first5 = raw.slice(0, 5);

                const prefix = first5.slice(0, 3);

                let suffixPart = raw.slice(5);

                if (!suffixPart.startsWith(prefix)) {

                  const userTypedDigits = suffixPart.replace(prefix, '').slice(0, 2);

                  suffixPart = prefix + userTypedDigits;

                }

                formatted = `${first5}-${suffixPart.slice(0, 5)}`;

              }

              onChange(formatted);

            }}

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

          maxLength: { value: 20, message: 'Phone number cannot exceed 20 characters' },

          pattern: {

            value: /^\(\d{3}\) \d{3}-\d{4}.*$/,

            message: 'Invalid phone format',

          },

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

              if (val.startsWith(' ')) return;

              const formattedValue = formatPhoneNumber(val).slice(0, 20);

              onChange(formattedValue);

            }}

          />

        )}

      />

    </Box>

  );



  const renderTextField = (name, label, required = false) => (

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>

      <Controller

        name={name}

        control={control}

        rules={{ required }}

        render={({ field }) => (

          <TextField

            {...field}

            fullWidth

            label={`${label}${required ? ' *' : ''}`}

            variant="standard"

            error={!!errors[name]}

          />

        )}

      />

    </Box>

  );



  return (

    <LocalizationProvider dateAdapter={AdapterDayjs}>

      <Box sx={{ p: 2, mt: 2 }}>

        {/* HEADER & STEPPER */}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>

          <Box display={'flex'} alignItems={'center'}>

            <Iconify icon="weui:back-filled" sx={{ mr: 1 }} />

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
                      fontSize: '0.75rem',
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



            <Button variant="contained" onClick={handleNext} sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}>

              {activeStep === 4 ? 'Finish' : 'Next'}

            </Button>

          </Box>

        </Box>



        {/* STEP 0 */}

        {activeStep === 0 && (

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>

            <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>Shipment Details</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

              <Box sx={{ flex: '1 1 22%' }}>

                <Controller

                  name="shipmentType"

                  control={control}

                  rules={{ required: true }}

                  render={({ field }) => (

                    <TextField {...field} select fullWidth label="Type of Shipment *" variant="standard" error={!!errors.shipmentType}>

                      {shipmentTypes.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}

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

            <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>Customer Details</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>

              <Box sx={{ flex: '1 1 30%' }}>

                <Controller name="billingCustomer" control={control} rules={{ required: true }} render={({ field }) => (

                  <TextField {...field} select fullWidth label="Billing Customer *" variant="standard" error={!!errors.billingCustomer}>

                    {customers.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}

                  </TextField>

                )} />

              </Box>

              {renderTextField('originAirport', 'Origin Airport Code', true)}

              {renderTextField('destinationAirport', 'Destination Airport Code', true)}

            </Box>



            {/* Shipper Section */}

            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 4, position: 'relative' }}>

              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Shipper Details</Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>

                {renderTextField('shipperName', 'Shipper Name')}

                {renderTextField('shipperAddr1', 'Address Line 1')}

                {renderTextField('shipperAddr2', 'Address Line 2')}

                {renderTextField('shipperCity', 'City')}

                {renderZipCodeField('shipperZip')}

                {renderTextField('shipperContact', 'Contact Person Name')}

                {renderPhoneField('shipperPhone', 'Phone Number')}

              </Box>

            </Box>



            {/* Consignee Section */}

            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, position: 'relative' }}>

              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Consignee Details</Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>

                {renderTextField('consigneeName', 'Consignee Name')}

                {renderTextField('consigneeAddr1', 'Address Line 1')}

                {renderTextField('consigneeAddr2', 'Address Line 2')}

                {renderTextField('consigneeCity', 'City')}

                {renderZipCodeField('consigneeZip')}

                {renderTextField('consigneeContact', 'Contact Person Name')}

                {renderPhoneField('consigneePhone', 'Phone Number')}

              </Box>

            </Box>

          </Paper>

        )}

        {/* STEP 2 */}

        {activeStep === 2 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
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
                        uom: 'Skid', unitsCount: '01', unit: 'in', length: '', width: '', height: '', weight: '', weightUnit: 'lbs', class: '',
                        items: [{ pieces: '', piecesUom: 'Skid', description: '', hazmatInfo: false }]
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
                      <TextField {...field} select fullWidth label="Handling Units UOM *" variant="standard" InputLabelProps={{ shrink: true }}>
                        {['Skid', 'Pallet', 'Box', 'Crate'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </TextField>
                    )} />
                  </Box>
                  <Box sx={{ flex: '1 1 100px' }}>
                    <Controller name={`handlingUnits.${huIdx}.unitsCount`} control={control} render={({ field }) => (
                      <TextField {...field} fullWidth label="Handling Units *" variant="standard" InputLabelProps={{ shrink: true }} />
                    )} />
                  </Box>
                  <Box sx={{ flex: '1 1 80px' }}>
                    <Controller name={`handlingUnits.${huIdx}.unit`} control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth label="Unit *" variant="standard" InputLabelProps={{ shrink: true }}>
                        <MenuItem value="in">in</MenuItem>
                        <MenuItem value="cm">cm</MenuItem>
                      </TextField>
                    )} />
                  </Box>
                  {['Length', 'Width', 'Height'].map((dim) => (
                    <Box key={dim} sx={{ flex: '1 1 140px', }}>
                      <Box display={'flex'} alignItems={'flex-end'}>
                        <Controller name={`handlingUnits.${huIdx}.${dim.toLowerCase()}`} control={control} render={({ field }) => (
                          <TextField {...field} fullWidth label={`Handling ${dim} *`} variant="standard" InputLabelProps={{ shrink: true }} />
                        )} />
                        <Controller name={`handlingUnits.${huIdx}.unit`} control={control} render={({ field }) => (
                          <TextField {...field} select sx={{ width: '80px' }} label="" variant="standard">
                            <MenuItem value="in">in</MenuItem>
                            <MenuItem value="cm">cm</MenuItem>
                          </TextField>
                        )} />
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ flex: '1 1 90px' }}>
                    <Box display={'flex'} alignItems={'flex-end'}>
                      <Controller name={`handlingUnits.${huIdx}.weight`} control={control} render={({ field }) => (
                        <TextField {...field} fullWidth label="Weight *" variant="standard" InputLabelProps={{ shrink: true }} />
                      )} />
                      <Controller name={`handlingUnits.${huIdx}.weightUnit`} control={control} render={({ field }) => (
                        <TextField {...field} select sx={{ width: '100px' }} label="" variant="standard" InputLabelProps={{ shrink: true }}>
                          <MenuItem value="in">lbs</MenuItem>
                          <MenuItem value="cm">kgs</MenuItem>
                        </TextField>
                      )} />
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 80px' }}>
                    <Controller name={`handlingUnits.${huIdx}.class`} control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth label="Class *" variant="standard" InputLabelProps={{ shrink: true }}>
                        {[40, 50, 60, 70, 85, 92.5, 100].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </TextField>
                    )} />
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
                      <TextField {...field} fullWidth label="Contact Name *" variant="standard" />
                    )} />
                  </Box>
                  <Box sx={{ flex: '1 1 30%' }}>
                    <Controller name="emergencyContactPhone" control={control} render={({ field }) => (
                      <TextField {...field} fullWidth label="Phone Number *" variant="standard"
                        onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                      />
                    )} />
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Commodities List Table */}
            <CommoditiesList watchedHU={watchedHU} />
          </Box>
        )}



        {activeStep > 2 && (

          <Paper sx={{ p: 10, textAlign: 'center' }} variant="outlined">

            <Typography variant="h5">Step {activeStep + 1} Content</Typography>

          </Paper>

        )}



        <Snackbar open={errorVisible} autoHideDuration={3000} onClose={() => setErrorVisible(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>

          <Alert severity="error" variant="filled">Please check required fields.</Alert>

        </Snackbar>

      </Box>
      {/* Place this at the end of your return block */}
      <HazmatDialog
        state={hazmatModal}
        onClose={() => setHazmatModal({ ...hazmatModal, open: false })}
        setValue={setValue}
        getValues={getValues}
      />

    </LocalizationProvider >

  );

};



export default ShipmentForm; 
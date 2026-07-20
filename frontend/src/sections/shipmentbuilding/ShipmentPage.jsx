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
import ShipmentStatusUpdateDialog from './ShipmentStatusUpdateDialog';
import ItemsSection from './ItemsSection';
import ItemsSectionView from './ItemsSectionView';
import HazmatDialog from './HazmatDialog';
import CommoditiesList from './CommoditiesList';
import PickupAccessorialDialog from './PickupAccessorialDialog';
import AddAccessorialDialog from './AddAccessorialDialog';
import CarrierSection from './CarrierSection';
import DoDetailsDialog from './DoDetailsDialog';
import CustomerRateDialog from './CustomerRateDialog';
import HandleCancelDialog from './HandleCancelDialog';

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
  const zipToZipCarrierPickupRate = useSelector((state) => state?.shipmentdata?.zipToZipCarrierPickupRate);
  const zipToZipCarrierLinehaulRate = useSelector((state) => state?.shipmentdata?.zipToZipCarrierLinehaulRate);
  const zipToZipCarrierDeliveryRate = useSelector((state) => state?.shipmentdata?.zipToZipCarrierDeliveryRate);
  const operationalMessage = useSelector((state) => state?.shipmentdata?.operationalMessage);
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
  const [errorVisibleFields, setErrorVisibleFields] = useState([]);
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
  const [handleCancelModal, setHandleCancelModal] = useState(false);
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
          uom: '', unitsCount: '', unit: 'in', length: '', width: '', height: '', weight: '', weightUnit: 'lbs', class: '', calculatedFC: '', freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
          items: [{
            pieces: '', piecesUom: '', description: '', hazmatInfo: false, hazmatData: {

              "contactPhone": "",
              "description": "",
              "dotExemption": false,
              "hazmatClass": "",
              "limitedQuality": false,
              marinePollutant: false,
              packagingGroup: "",
              reportableQuantity: false,
              residueLastContained: false,
              shippingName: "",
              technicalName: "",
              unNumber: "",
              weight: "",
              weightUnit: "lbs"
            }
          }]
        }],
        emergencyContactName: '',
        emergencyContactPhone: '',
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
  const { fields: customerRateAccFields, append: appendCustomerRateAccFields, replace: replaceCustomerRateAccFields } = useFieldArray({ control, name: "customerRate.customerAccessorials" });

  // Watch for any hazmat info selection to toggle Emergency Contact 
  const watchedHandlingUnits = useWatch({ control, name: "handlingUnits" });
  const watchedServiceLevel = useWatch({ control, name: "serviceLevel" });

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
        unit: lastUnit.unit,
        length: '',
        width: '',
        height: '',
        weight: '',
        weightUnit: lastUnit.weightUnit,
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

      // Extract current weight and unit string
      const currentWeight = Number(hu.weight || 0);
      const weightUnit = (hu.weightUnit || '').trim().toLowerCase();

      // 1. Convert to LBS if the item unit is registered as KGS
      if (weightUnit === 'kgs' || weightUnit === 'kg') {
        totalWeight += currentWeight * 2.20462;
      } else {
        totalWeight += currentWeight;
      }
    });

    return {
      totalHU,
      totalPieces,
      totalHM,
      // 2. Round up the weight value to 2 decimals, or display empty string if 0
      totalWeight: totalWeight === 0 ? "" : Number(totalWeight.toFixed(2))
    };
  };


  let totals = calculateTotals(watchedHU);

  useEffect(() => {
    totals = calculateTotals(watchedHU);
  }, [watchedHU]);

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
          validate: (value) => {
            if (!value) return true;

            // 1. Block "all zeros"
            const rawDigits = value.replace(/[^\d]/g, '');
            if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

            // 2. Format check for 5-digit or standard 5+4 format (#####-####)
            const zipRegex = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
            if (!zipRegex.test(value)) {
              return 'Zip Code must be 5 digits or standard 9-digit format (Ex: 12345-6789)';
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
            helperText={error?.message || 'Ex: 12345 or 12345-6789'}
            value={value || ''}
            onChange={(e) => {
              const input = e.target.value;

              // Allow only digits and a single dash character
              let raw = input.replace(/[^\d-]/g, '');

              // Removed the automatic dash insertion here so users can type naturally

              // Prevent typing more than 10 characters (#####-####)
              onChange(raw.slice(0, 10));
            }}
            // Maximum length updated to 10 characters for #####-#### layout
            inputProps={{ maxLength: 10, inputMode: 'numeric' }}
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
            // Accommodates 5 digits, 5+4 format (#####-####), or custom 5-5 range formats (#####-#####)
            const zipRegex = /(^\d{5}$)|(^\d{5}-\d{4,5}$)/;
            if (!zipRegex?.test(value)) {
              return 'Zip Code must be 5 digits, a range (#####-#####), or standard +4 format (#####-####)';
            }

            // 3. Range-specific constraints (only if a range/dash is present)
            if (value.includes('-')) {
              const parts = value.split('-');
              const firstZip = parts[0];
              const secondZip = parts[1];

              // Skip range mathematical checks if it is just a standard 4-digit +4 extension
              if (secondZip.length === 5) {
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
            helperText={error?.message || 'Ex: 12345, 12345-6789, or 12345-12346'}
            value={value || ''}
            onChange={(e) => {
              const input = e.target.value;
              // Allow only digits and a single dash character
              let raw = input.replace(/[^\d-]/g, '');

              // FIXED: The automatic dash insertion code block has been removed

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
            if (!value) return true;
            const digitsOnly = value.replace(/\D/g, '');
            const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);
            if (isAllZeros) return 'Phone number cannot be all zeros';
            return true;
          }
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            value={field.value || ''}
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

              // 2. CRITICAL FIX: If deleting trailing formatting symbols, don't re-apply them immediately
              const isDeletingFormatting =
                e.nativeEvent.inputType === 'deleteContentBackward' &&
                (val.endsWith(')') || val.endsWith(' ') || val.endsWith('-'));

              if (isDeletingFormatting) {
                field.onChange(val); // Let the raw deletion pass through to the state safely
                return;
              }

              // 3. Format and enforce string limit
              const formattedValue = formatPhoneNumber(val).slice(0, 20);
              field.onChange(formattedValue);
            }}
          />
        )}
      />
    </Box>
  );

  const renderTextField = (name, label, required = false) => {
    const labelLower = label.toLowerCase();
    const nameLower = name.toLowerCase();

    // Check field characteristics
    const isCityOrState = ['city', 'state'].some(keyword =>
      nameLower.includes(keyword) || labelLower.includes(keyword)
    );
    const isAirport = nameLower.includes('airport');

    // FIXED 1: Determine dynamic maxLength values based on the field's label string
    let maxCharLimit = null;
    if (labelLower.includes('address line 1') || labelLower.includes('address line 2')) {
      maxCharLimit = 255;
    } else if (labelLower.includes('city') || labelLower.includes('state') || labelLower.includes('contact person name')) {
      maxCharLimit = 100;
    }

    // Dynamic Rules configuration builder
    let validationRules = {};

    if (isAirport) {
      validationRules = {
        required: required ? `${label} is required` : false,
        maxLength: {
          value: 10,
          message: `${label} cannot exceed 10 characters`
        },
        pattern: {
          value: /^[A-Z]{3,10}$/,
          message: 'Must be between 3 and 10 letters'
        },
        validate: (value) => !value || value.trim().length > 0 || `${label} cannot be only spaces`
      };
    } else {
      // FIXED 2: Append custom maxLength validation constraints to standard text fields
      validationRules = {
        required: required ? `${label} is required` : false, // Fixed boolean required bug to show clean string errors
        ...(maxCharLimit && {
          maxLength: {
            value: maxCharLimit,
            message: `${label} cannot exceed ${maxCharLimit} characters`
          }
        })
      };
    }

    return (
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
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
                  if (val.startsWith(' ')) return;
                  val = val
                    .replace(/[^a-zA-Z]/g, '')
                    .toUpperCase()
                    .slice(0, 10);
                  field.onChange(val);
                } else {
                  if (isCityOrState) {
                    val = val.replace(/[^A-Za-z\s.-]/g, '');
                  }
                  // FIXED 3: Truncate normal strings inside onChange handler to prevent copy-paste length overflows
                  if (maxCharLimit) {
                    val = val.slice(0, maxCharLimit);
                  }
                  field.onChange(val);
                }
              }}
              fullWidth
              label={`${label}${required ? ' *' : ''}`}
              variant="standard"
              error={!!errors[name]}
              helperText={errors[name]?.message || ""}

              // FIXED 4: Inject the calculated maxLength attribute straight into the underlying HTML input node
              inputProps={{
                ...(isAirport && { maxLength: 10 }),
                ...(!isAirport && maxCharLimit && { maxLength: maxCharLimit })
              }}
            />
          )}
        />
      </Box>
    );
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
        const unitsCount = Number(hu.unitsCount);
        const length = hu.unit === 'cm' ? parseFloat(hu.length) / 2.54 : parseFloat(hu.length);
        const width = hu.unit === 'cm' ? parseFloat(hu.width) / 2.54 : parseFloat(hu.width);
        const height = hu.unit === 'cm' ? parseFloat(hu.height) / 2.54 : parseFloat(hu.height);
        const weight = hu.weightUnit === 'kg' ? (parseFloat(hu.weight) * 2.20462) / unitsCount : parseFloat(hu.weight) / unitsCount;

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

  }, [watchedLineHaulToggledAddress, watchedSelectedLineHaulCarrier]);

  useEffect(() => {
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
  }, [watchedSelectedPickupCarrier])
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
    let validAccessorials = true;
    let obj = {};

    // Array to collect missing or invalid fields at the very end
    const missingRequiredFields = [];

    // 1. Step-based validation fields mapping
    if (activeStep === 0) {
      fieldsToValidate = ['shipmentType', 'serviceLevel'];
      if (watchedServiceLevel?.includes('(Date Specific)')) {
        fieldsToValidate.push('date', 'time');
      }
    } else if (activeStep === 1) {
      fieldsToValidate = [
        'billingCustomer', 'shipperPhone', 'consigneePhone',
      ];
      if (watchedAirportPickupService) {
        fieldsToValidate.push('originAirport');
      }
      if (watchedAirportDeliveryService) {
        fieldsToValidate.push('destinationAirport');
      }

    } else if (activeStep === 2 && isHazmatSelected) {
      fieldsToValidate = ['emergencyContactName', 'emergencyContactPhone'];
    } else if (activeStep === 3) {
      fieldsToValidate = getRoutingFields(selectedRouting, watchedLinehaulSelectRouting);

      // Add common carrier conditional fields
      const { carrierInfo } = currentValues || {};
      if (!carrierInfo?.pickupAgentTerminal) {
        fieldsToValidate.push('carrierInfo.toLocationType', 'carrierInfo.toLocation');
      }
      if (carrierInfo?.pickupAlert) {
        const isSpecialRouting = selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery';
        const prefix = isSpecialRouting ? 'carrierInfo.' : 'carrierInfo.pickupAlertDetails.';
        fieldsToValidate.push(`${prefix}pickupNotes`, `${prefix}primaryEmail`);
      }
      if (carrierInfo?.deliveryDetails?.carrier && carrierInfo?.deliveryDetails?.deliveryAlert) {
        fieldsToValidate.push(
          'carrierInfo.deliveryDetails.lineHaulNotes',
          'carrierInfo.deliveryDetails.deliveryNotes',
          'carrierInfo.deliveryDetails.primaryEmail'
        );
      }

      // Accessorials cross-checking & manual error tracking
      if (carrierInfo?.addPickupAccessorial && carrierInfo?.pickupAccessorials?.length === 0) {
        validAccessorials = false;
        missingRequiredFields.push('Pickup Accessorials');
      }
      if (carrierInfo?.lineHaul?.linehaulAddAcc && carrierInfo?.lineHaul?.linehaulAccessorials?.length === 0) {
        validAccessorials = false;
        missingRequiredFields.push('Linehaul Accessorials');
      }
      if (carrierInfo?.deliveryDetails?.deliveryAddAcc && carrierInfo?.deliveryDetails?.deliveryAccessorials?.length === 0) {
        validAccessorials = false;
        missingRequiredFields.push('Delivery Accessorials');
      }
    }

    // 2. Validate handling units structure (Step 2 specific)

    const validationResult = validateHandlingUnits(getValues('handlingUnits'));

    if (activeStep === 2 && !validationResult.isValid) {
      missingRequiredFields.push(validationResult.reason);
      // This will push "Handling Units" OR "Hazmat Info Details" automatically
    }

    // 3. Form control execution block
    const isValid = await trigger(fieldsToValidate);

    // 4. Collect React Hook Form native errors if validation failed
    if (!isValid) {
      fieldsToValidate.forEach(fieldPath => {
        const hasError = fieldPath.split('.').reduce((obj, key) => obj?.[key], errors);
        const actualValue = getValues(fieldPath);

        // If RHF says it's invalid OR the value is blank/missing
        if (hasError || actualValue === undefined || actualValue === "" || actualValue === null) {
          const lastWord = fieldPath.split('.').pop();

          // 1. Format the field name (e.g., "billNumber" -> "Bill Number")
          const formattedWord = lastWord
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());

          // 2. Determine the contextual location prefix
          let prefix = "Pickup "; // Default fallback
          if (fieldPath.includes("carrierInfo.lineHaul.")) {
            prefix = "Linehaul ";
          } else if (fieldPath.includes("carrierInfo.deliveryDetails.")) {
            prefix = "Delivery ";
          }
          const finalPrefix = activeStep === 3 ? prefix : '';
          const readableWord = `${finalPrefix}${formattedWord}`;

          if (!missingRequiredFields.includes(readableWord)) {
            missingRequiredFields.push(readableWord);
          }
        }
      });

    }

    // 5. Final evaluation block
    if (isValid && validAccessorials && (activeStep !== 2 || validationResult.isValid)) {
      setErrorVisible(false);
      if (activeStep < 4) {
        setActiveStep((prev) => prev + 1);
      }
    } else {
      setErrorVisible(true);

      // Output array containing all final required fields that failed
      console.log("Required fields missing or invalid:", missingRequiredFields);
      setErrorVisibleFields(missingRequiredFields);

      // Optional: Save this to a component state if you need to print it on screen
      // setFailedFields(missingRequiredFields);
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
      "orderReceivedPickupPending": currentValues?.carrierInfo?.orderReceivedPending ? "Y" : "N",
      "status": currentValues?.carrierInfo?.orderReceivedPending ? "ORDER_RECEIVED_PICKUP_PENDING" : "ORDER_RECEIVED_PICKUP_SETUP",
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
        'entityId': currentValues?.shipperName?.entityId || null,
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
        'entityId': currentValues?.consigneeName?.entityId || null,
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


    if (selectedRouting === 'pickup_only') {
      // obj to send
      // when pickupAgentTerminal is Y no need of pickupAgentTerminalDetails
      // fromLocationEntityId not there in from location
      obj.carrierDetails = {

        "pickupDetails": {
          "pickupRouting": "PICKUP_ONLY",
          "fromLocationType": "Shipper",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
            "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
            "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
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
      }
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
          "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
            "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
            "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
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
            "fromLocationEntityId": selectedLinehaulCarrierObject?.terminalEntityId || null,
            "toLocationType": "Carrier",
            "toLocation": currentValues?.carrierInfo?.lineHaul?.toLocation,
            // still to get
            "toLocationEntityId": selectedLinehaulToCarrierObject?.terminalEntityId || null,
            "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
            "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
            "pieces": Number(currentValues?.carrierInfo?.lineHaul?.pcs) || null,
            'weight': Number(currentValues?.carrierInfo?.lineHaul?.weight) || null,
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
            "fromLocationEntityId": selectedDeliveryCarrierObject?.terminalEntityId || null,
            "toLocationType": "Consignee",
            "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
            "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
            "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
            "pieces": Number(currentValues?.carrierInfo?.deliveryDetails?.pcs) || null,
            'weight': Number(currentValues?.carrierInfo?.deliveryDetails?.weight) || null,
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
          "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
            "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
            "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
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
            "fromLocationEntityId": selectedLinehaulCarrierObject?.terminalEntityId || null,
            "toLocationType": "Consignee",
            "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
            "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
            "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
            "pieces": Number(currentValues?.carrierInfo?.lineHaul?.pcs) || null,
            'weight': Number(currentValues?.carrierInfo?.lineHaul?.weight) || null,
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
          "fromLocationType": "Shipper",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
            "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
            "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
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
            "fromLocationType": "Carrier",
            "fromLocation": currentValues?.carrierInfo?.deliveryDetails?.fromLocation,
            "fromLocationEntityId": selectedDeliveryCarrierObject?.terminalEntityId || null,
            "toLocationType": "Consignee",
            "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
            "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
            "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
            "pieces": Number(currentValues?.carrierInfo?.deliveryDetails?.pcs) || null,
            'weight': Number(currentValues?.carrierInfo?.deliveryDetails?.weight) || null,
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
          "fromLocationType": "Shipper",
          "fromLocation": currentValues?.carrierInfo?.fromLocation,
          "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
            "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
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
    if (currentValues?.carrierRates?.pickUp?.pickUpRate) {
      transformedPickupArray.push({
        rateType: 'Zip to Zip',
        multiplicationFactor: null,
        multiplicationFactorUOM: '',
        rateValue: Number(currentValues?.carrierRates?.pickUp?.pickUpRate),
        totalRate: Number(currentValues?.carrierRates?.pickUp?.pickUpRate),
      });
    }
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
    if (currentValues?.carrierRates?.lineHaul?.lineHaulRate) {
      transformedLinehaulArray.push({
        rateType: 'Zip to Zip',
        multiplicationFactor: null,
        multiplicationFactorUOM: '',
        rateValue: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate),
        totalRate: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate),
      });
    }
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
    if (currentValues?.carrierRates?.delivery?.deliveryRate) {
      transformedDeliveryArray.push({
        rateType: 'Zip to Zip',
        multiplicationFactor: null,
        multiplicationFactorUOM: '',
        rateValue: Number(currentValues?.carrierRates?.delivery?.deliveryRate),
        totalRate: Number(currentValues?.carrierRates?.delivery?.deliveryRate),
      });
    }
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
    if (currentValues?.customerRate?.rate) {
      transformedCustomerArray.push({
        rateType: 'Rate',
        multiplicationFactor: null,
        multiplicationFactorUOM: '',
        rateValue: Number(currentValues?.customerRate?.rate),
        totalRate: Number(currentValues?.customerRate?.rate),
      });
    }
    if (currentValues?.customerRate?.fuelSurchargeRate) {
      transformedCustomerArray.push({
        rateType: 'Fuel Surcharge (35% charge)',
        multiplicationFactor: null,
        multiplicationFactorUOM: '',
        rateValue: Number(currentValues?.customerRate?.fuelSurchargeRate),
        totalRate: Number(currentValues?.customerRate?.fuelSurchargeRate),
      });
    }


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
    if (transformedPickupArray && transformedPickupArray.length === 0) {
      delete obj.shipmentRateDetails.carrierRateDetails.pickupRateDetails;
    }
    if (transformedLinehaulArray && transformedLinehaulArray.length === 0) {
      delete obj.shipmentRateDetails.carrierRateDetails.linehaulRateDetails;
    }
    if (transformedDeliveryArray && transformedDeliveryArray.length === 0) {
      delete obj.shipmentRateDetails.carrierRateDetails.deliveryRateDetails;
    }

    if (transformedPickupArray && transformedPickupArray.length === 0 && transformedLinehaulArray && transformedLinehaulArray.length === 0 && transformedDeliveryArray && transformedDeliveryArray.length === 0) {
      delete obj.shipmentRateDetails.carrierRateDetails;
    }

    if (transformedCustomerArray && transformedCustomerArray.length === 0) {
      delete obj.shipmentRateDetails.customerRateDetails;
    }

    if (transformedPickupArray && transformedPickupArray.length === 0 && transformedLinehaulArray && transformedLinehaulArray.length === 0 && transformedDeliveryArray && transformedDeliveryArray.length === 0 && transformedCustomerArray && transformedCustomerArray.length === 0) {
      delete obj.shipmentRateDetails;
    }
    if (activeStep === 4) {
      dispatch(postStep1(obj));
    }

    if (activeStep === 2 && hasInitialData()) {
      setValue('doDetails.handlingUnits', currentValues.handlingUnits);
      setValue('doDetails.emergencyContactName', currentValues.emergencyContactName);
      setValue('doDetails.emergencyContactPhone', currentValues.emergencyContactPhone);
    }
  };
  // Helper 1: Extract routing fields logic for step 3
  const getRoutingFields = (routing, linehaulRouting) => {
    const base = ['carrierInfo.selectCarrier', 'carrierInfo.fromLocation'];

    if (routing === 'pickup_only' && linehaulRouting === 'linehaul_only') {
      return [
        ...base,
        'carrierInfo.lineHaul.carrier', 'carrierInfo.lineHaul.billNumber',
        'carrierInfo.lineHaul.toLocationType', 'carrierInfo.lineHaul.toLocation',
        'carrierInfo.deliveryDetails.carrier', 'carrierInfo.deliveryDetails.billNumber',
        'carrierInfo.deliveryDetails.toLocationType',
      ];
    }
    if (routing === 'pickup_only' && linehaulRouting === 'linehaul_delivery') {
      return [
        ...base,
        'carrierInfo.lineHaul.carrier', 'carrierInfo.lineHaul.billNumber',
        'carrierInfo.lineHaul.toLocationType', 'carrierInfo.lineHaul.toLocation',
      ];
    }
    if (routing === 'pickup_linehaul') {
      return [
        ...base,
        'carrierInfo.deliveryDetails.carrier', 'carrierInfo.deliveryDetails.billNumber',
        'carrierInfo.deliveryDetails.toLocationType',
      ];
    }
    return base;
  };

  // Helper 2: Validate handling units array structure for step 2
  // Helper 2: Validate handling units array structure for step 2
  const validateHandlingUnits = (units) => {
    if (!Array.isArray(units) || units.length === 0) {
      return { isValid: false, reason: 'Handling Units' };
    }

    for (const unit of units) {
      const hasTopLevelValid = !!unit?.uom?.trim() && !!unit?.unitsCount?.toString().trim();
      if (!hasTopLevelValid) return { isValid: false, reason: 'Handling Units' };

      if (!Array.isArray(unit?.items) || unit.items.length === 0) {
        return { isValid: false, reason: 'Handling Unit Items' };
      }

      for (const item of unit.items) {
        const baseFieldsValid = !!item?.pieces?.toString().trim() && !!item?.piecesUom?.trim() && !!item?.description?.trim();
        if (!baseFieldsValid) return { isValid: false, reason: 'Handling Unit Items' };

        if (item?.hazmatInfo === true) {
          const hazmat = item?.hazmatData;
          const hazmatValid = (
            !!hazmat?.unNumber?.trim() && !!hazmat?.shippingName?.trim() &&
            !!hazmat?.packagingGroup?.trim() && !!hazmat?.hazmatClass?.trim() &&
            !!hazmat?.weight?.toString().trim() && !!hazmat?.technicalName?.trim() &&
            !!hazmat?.contactPhone?.trim()
          );

          // If hazmatInfo is true but details are missing, flag it uniquely
          if (!hazmatValid) return { isValid: false, reason: 'Hazmat Info Details' };
        }
      }
    }

    return { isValid: true, reason: null };
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
      "orderReceivedPickupPending": currentValues?.carrierInfo?.orderReceivedPending ? "Y" : "N",
      "status": currentValues?.carrierInfo?.orderReceivedPending ? "ORDER_RECEIVED_PICKUP_PENDING" : "ORDER_RECEIVED_PICKUP_SETUP",
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
        'entityId': currentValues?.shipperName?.entityId || null,
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
        'entityId': currentValues?.consigneeName?.entityId || null,
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
            "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
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
              "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject.carrierName : selectedPickupToCarrierObject.carrierName,
              "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
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
    if (shipmentSuccess && operationalMessage) {
      navigate(PATH_DASHBOARD?.shipmentBuilding?.root);
    }
  }, [shipmentSuccess, operationalMessage, navigate])
  useEffect(() => {
    if (shipmentError) {
      setSnackbarMessage(`${(shipmentError?.error && shipmentError?.message) ? `${shipmentError?.error}. ${shipmentError?.message}` : `${shipmentError?.message ?? shipmentError}`}`);
      setShipmentErrorFlag(true);
    }
  }, [shipmentError])
  useEffect(() => {
    setValue('carrierRates.pickUp.apiPickUpRate', zipToZipCarrierPickupRate || 0);
  }, [zipToZipCarrierPickupRate])
  useEffect(() => {
    setValue('carrierRates.lineHaul.apiLineHaulRate', zipToZipCarrierLinehaulRate || 0);
  }, [zipToZipCarrierLinehaulRate])
  useEffect(() => {
    setValue('carrierRates.delivery.apiDeliveryRate', zipToZipCarrierDeliveryRate || 0);
  }, [zipToZipCarrierDeliveryRate])



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
                <Button variant="outlined" onClick={() => {
                  setHandleCancelModal(true);
                }} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Cancel</Button>

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
            </Box>
            }
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
            replaceCustomerRateAccFields={replaceCustomerRateAccFields}
            watchedHU={watchedHU}
            masterAccessorials={CUSTOMER_MASTER_ACCESSORIALS}
          />

          <HandleCancelDialog
            open={handleCancelModal}
            onClose={() => setHandleCancelModal(false)}
            onSave={() => {
              // Handle cancel save logic here
              if (activeStep === 0) {
                reset();
                setActiveStep(0);
                setHandleCancelModal(false);
                navigate(PATH_DASHBOARD?.shipmentBuilding?.root);
              } else {
                reset();
                setActiveStep(0);
                setHandleCancelModal(false);
              }
            }}
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
                        helperText={errors.shipmentType ? 'Shipment Type is required' : ''}
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
                    // 1. FIXED: Pass the explicit string message instead of just 'true'
                    rules={{ required: "Service Level is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="Service Level *"
                        variant="standard"
                        error={!!errors.serviceLevel}
                        // 2. FIXED: Displays the precise validation message when an error exists
                        helperText={errors.serviceLevel ? errors.serviceLevel.message : ''}
                      >
                        {serviceLevels.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />


                </Box>

                <Box sx={{ flex: '1 1 22%' }}>

                  <Controller
                    name="date"
                    control={control}
                    rules={{
                      // 1. Keeps your conditional required message contract intact
                      required: watchedServiceLevel?.includes('(Date Specific)') ? 'Date is required' : false,

                      validate: (value) => {
                        const isRequired = watchedServiceLevel?.includes('(Date Specific)');

                        // Check if the current value is structurally empty or blank
                        const isEmpty = !value || value === '';

                        // 2. FIXED: If it is empty and required, return false to let the 'required' string error show up
                        if (isEmpty) {
                          return isRequired ? "Date is required" : true;
                        }

                        // If it is a Dayjs object structure but flagged invalid (like when a user clears a field manually)
                        if (dayjs.isDayjs(value) && !value.isValid()) {
                          return isRequired ? "Date is required" : true;
                        }

                        const dateObj = dayjs(value);

                        // 3. Throw an error for '00/00/0000' strings
                        if (!dateObj.isValid()) {
                          return "Please enter a valid date";
                        }

                        if (dateObj.year() < 1000) {
                          return "Year is invalid";
                        }

                        return true;
                      }
                    }}
                    render={({ field: { onChange, value, ...fieldParams } }) => (
                      <DatePicker
                        {...fieldParams}
                        // Allows user typing to display normally without locking or snapping back to blank midway
                        value={value ? dayjs(value) : null}
                        onChange={(newValue) => {
                          // If the user cleared out the text field, explicitly push null to the state
                          if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                            onChange(null);
                          } else {
                            onChange(newValue);
                          }
                        }}
                        label={`Select Date ${watchedServiceLevel?.includes('(Date Specific)') ? '*' : ''}`}
                        slotProps={{
                          textField: {
                            variant: 'standard',
                            fullWidth: true,
                            error: !!errors.date,
                            helperText: errors.date ? errors.date.message : ''
                          }
                        }}
                      />
                    )}
                  />

                </Box>

                <Box sx={{ flex: '1 1 22%' }}>

                  <Controller
                    name="time"
                    control={control}
                    rules={{
                      // 1. FIXED: Pass the explicit string message instead of a boolean value
                      required: watchedServiceLevel?.includes('(Date Specific)') ? 'Time is required' : false,

                      validate: (value) => {
                        const isRequired = watchedServiceLevel?.includes('(Date Specific)');
                        const isEmpty = !value || value === '';

                        // 2. Handle empty conditions against requirement states
                        if (isEmpty) {
                          return isRequired ? "Time is required" : true;
                        }

                        // 3. Catch structural library validation failures (like typing 00:00 incorrectly or broken shapes)
                        if (dayjs.isDayjs(value) && !value.isValid()) {
                          return isRequired ? "Time is required" : "Please enter a valid time";
                        }

                        return true;
                      }
                    }}
                    render={({ field: { onChange, value, ...fieldParams } }) => (
                      <TimePicker
                        {...fieldParams}
                        ampm={false} // Maintains 24-hour military clock layout formatting
                        value={value ? dayjs(value) : null}
                        onChange={(newValue) => {
                          // If the user manually backs out characters or clears it, pass a clean null state
                          if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                            onChange(null);
                          } else {
                            onChange(newValue);
                          }
                        }}
                        label={`Select Time ${watchedServiceLevel?.includes('(Date Specific)') ? '*' : ''}`}
                        slotProps={{
                          textField: {
                            variant: 'standard',
                            fullWidth: true,
                            error: !!errors.time,
                            // 4. FIXED: Renders the precise validation string message underneath the input row
                            helperText: errors.time ? errors.time.message : ''
                          }
                        }}
                      />
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
                          helperText={errors['billingCustomer'] ? 'Billing Customer is required' : ''}
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
                      name="shipperName"
                      control={control}
                      rules={{
                        validate: (value) => {
                          const isRequired = !!watchedAirportPickupService;
                          const currentText = value?.shipperName || "";
                          const hasText = !!currentText.trim();

                          // 1. Mandatory structural baseline check
                          if (isRequired && !hasText) {
                            return "Shipper Name is required";
                          }

                          // 2. FIXED: Validation rule checking for strings exceeding 100 characters
                          if (currentText.length > 100) {
                            return "Shipper Name cannot exceed 100 characters";
                          }
                          return true;
                        }
                      }}
                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={shipperDropdown}
                          value={value || null}

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

                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              // Slice incoming values to strictly match 100 chars
                              onChange({ shipperId: null, shipperName: newValue.slice(0, 100) });
                            } else if (newValue && newValue.inputValue) {
                              onChange({ shipperId: null, shipperName: newValue.inputValue.slice(0, 100) });
                            } else if (newValue) {
                              onChange(newValue);
                              if (Object.keys(newValue).length > 0) {
                                setValue('shipperAddr1', newValue?.addressLine1 || '');
                                setValue('shipperAddr2', newValue?.addressLine2 || '');
                                setValue('shipperCity', newValue?.city || '');
                                setValue('shipperState', newValue?.state || '');
                                setValue('shipperZip', newValue?.zipCode || '');
                                setValue('shipperContact', newValue?.contactPersonName || '');
                                setValue('shipperPhone', newValue?.phoneNumber || '');
                              }
                            } else {
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

                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              // Slice layout text inputs to block long text loops
                              onChange({ shipperId: null, shipperName: newInputValue.slice(0, 100) });
                              setValue('shipperAddr1', '');
                              setValue('shipperAddr2', '');
                              setValue('shipperCity', '');
                              setValue('shipperState', '');
                              setValue('shipperZip', '');
                              setValue('shipperContact', '');
                              setValue('shipperPhone', '');
                            }
                          }}

                          filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const { inputValue } = params;

                            const isExisting = options.some(
                              (option) => inputValue.toLowerCase() === option.shipperName.toLowerCase()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue: inputValue.slice(0, 100),
                                shipperName: `${inputValue.slice(0, 100)}`,
                              });
                            }

                            return filtered;
                          }}

                          getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                              return option;
                            }
                            if (option.inputValue) {
                              return option.inputValue;
                            }
                            return option.shipperName || '';
                          }}

                          isOptionEqualToValue={(option, val) =>
                            option.shipperId === val?.shipperId || option.shipperName === val?.shipperName
                          }

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref}
                              fullWidth
                              label={`Shipper Name ${watchedAirportPickupService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['shipperName']}
                              helperText={errors['shipperName'] ? errors['shipperName'].message : ''}

                              // 3. FIXED: UI barrier stopping user from typing past character 100
                              inputProps={{
                                ...params.inputProps,
                                maxLength: 100
                              }}
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
                        required: watchedAirportPickupService ? 'Shipper Name is required' : false,
                        validate: (value) => {
                          if (!value) return true;

                          if (typeof value === 'object' && value.airlineId) {
                            return true;
                          }

                          const textToValidate = typeof value === 'object' ? (value.airlineName || '') : (value || '');
                          const parts = textToValidate.split('-').map(p => p.trim());
                          const numPart = parts[0] || '';
                          const codePart = parts[1] || '';
                          const namePart = parts[2] || '';

                          // FIXED 1: Schema-level check ensuring the name segment alone doesn't pass 100 characters
                          if (namePart.length > 100) {
                            return 'Airline Name cannot exceed 100 characters';
                          }

                          const isPreExisting = shipperAirlineDropdown.some((opt) => {
                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                          });
                          if (isPreExisting) return true;

                          if (!/^\d{3}$/.test(numPart)) {
                            return 'Airline Number must be exactly 3 digits (Ex: 001)';
                          }

                          if (!/^[A-Za-z]{2,3}$/.test(codePart)) {
                            return 'Airline Code must be 2 or 3 letters (Ex: AA or AAA)';
                          }

                          if (!namePart) {
                            return 'Please provide the Airline Name at the end';
                          }

                          const formatRegex = /^\d{3} - [A-Z]{2,3} - .+$/i;
                          if (!formatRegex.test(textToValidate.trim())) {
                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                          }

                          return true;
                        }
                      }}
                      render={({ field: { onChange, value, ref } }) => {
                        // Helper function to safely crop only the name portion to 100 characters max
                        const enforceNameLimit = (text) => {
                          if (!text) return '';
                          const sections = text.split(' - ');
                          if (sections.length >= 3) {
                            // Recombine everything after the second hyphen and cap it at 100 characters
                            const prefix = `${sections[0]} - ${sections[1]} - `;
                            const namePart = sections.slice(2).join(' - ');
                            return prefix + namePart.slice(0, 100);
                          }
                          return text;
                        };

                        return (
                          <Autocomplete
                            freeSolo
                            options={
                              watchedOriginAirport
                                ? shipperAirlineDropdown.filter((item) => item.airportCode === watchedOriginAirport)
                                : shipperAirlineDropdown
                            }
                            value={value || null}
                            onChange={(event, newValue) => {
                              if (typeof newValue === 'string') {
                                // FIXED 2: Cap name segment on entry
                                onChange({ airlineId: null, airlineName: enforceNameLimit(newValue) });
                              } else if (newValue && newValue.inputValue) {
                                onChange({ airlineId: null, airlineName: enforceNameLimit(newValue.inputValue) });
                              } else if (newValue) {
                                onChange(newValue);
                              } else {
                                onChange(null);
                              }

                              const isSelection = newValue && !newValue.inputValue && typeof newValue !== 'string';
                              setValue('shipperAddr1', isSelection ? newValue?.addressLine1 || '' : '');
                              setValue('shipperAddr2', isSelection ? newValue?.addressLine2 || '' : '');
                              setValue('shipperCity', isSelection ? newValue?.city || '' : '');
                              setValue('shipperState', isSelection ? newValue?.state || '' : '');
                              setValue('shipperZip', isSelection ? newValue?.zipCode || '' : '');
                              setValue('shipperContact', isSelection ? newValue?.contactPersonName || '' : '');
                              setValue('shipperPhone', isSelection ? newValue?.phoneNumber || '' : '');
                            }}
                            onInputChange={(event, newInputValue, reason) => {
                              if (reason === 'input') {
                                const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                                let formatted = newInputValue;

                                if (!isDeleting) {
                                  let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                  if (/^\d{3}$/.test(clean)) {
                                    formatted = `${clean} - `;
                                  }

                                  const match = clean.match(/^(\d{3})\s*-\s*([A-Za-z]{2,3})$/);
                                  if (match) {
                                    formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                  }
                                }

                                // FIXED 3: Enforce strict 100-character cap on name segment while actively typing
                                onChange({ airlineId: null, airlineName: enforceNameLimit(formatted) });
                              }
                            }}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              if (option.inputValue) return option.inputValue;
                              if (option.airlineId) {
                                return `${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`;
                              }
                              return option.airlineName || '';
                            }}
                            isOptionEqualToValue={(option, val) =>
                              option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                            }
                            renderOption={(props, option, state) => {
                              const { key, ...optionProps } = props;
                              const uniqueKey = option.airlineId
                                ? `airline-${option.airlineId}-${state.index}`
                                : `custom-airline-${state.index}`;

                              if (option.inputValue) {
                                return (
                                  <Box component="li" key={uniqueKey} {...optionProps} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    Add : "{option.inputValue}"
                                  </Box>
                                );
                              }

                              return (
                                <Box component="li" key={uniqueKey} {...optionProps}>
                                  {`${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`}
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
                                  // FIXED 4: Cap custom filtering suggestion text lengths
                                  inputValue: enforceNameLimit(inputValue),
                                  airlineName: enforceNameLimit(inputValue)
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

                                // FIXED 5: Set hard layout barrier to 111 (Handles 11 prefix characters + 100 character custom name)
                                inputProps={{
                                  ...params.inputProps,
                                  maxLength: 111
                                }}
                              />
                            )}
                            sx={{ width: '25%' }}
                          />
                        );
                      }}
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
                      name="consigneeName"
                      control={control}
                      rules={{
                        validate: (value) => {
                          const isRequired = !!watchedAirportDeliveryService;
                          const currentText = value?.consigneeName || "";
                          const hasText = !!currentText.trim();

                          // 1. Mandatory requirement check
                          if (isRequired && !hasText) {
                            return "Consignee Name is required";
                          }

                          // 2. FIXED: Validation rule checking for strings exceeding 100 characters
                          if (currentText.length > 100) {
                            return "Consignee Name cannot exceed 100 characters";
                          }
                          return true;
                        }
                      }}
                      render={({ field: { onChange, value, ref } }) => (
                        <Autocomplete
                          freeSolo
                          options={consigneeDropdown}
                          value={value || null}

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

                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              // Truncate manual entries to 100 characters max
                              onChange({ consigneeId: null, consigneeName: newValue.slice(0, 100) });
                            } else if (newValue && newValue.inputValue) {
                              onChange({ consigneeId: null, consigneeName: newValue.inputValue.slice(0, 100) });
                            } else if (newValue) {
                              onChange(newValue);
                              if (Object.keys(newValue).length > 0) {
                                setValue('consigneeAddr1', newValue?.addressLine1 || '');
                                setValue('consigneeAddr2', newValue?.addressLine2 || '');
                                setValue('consigneeCity', newValue?.city || '');
                                setValue('consigneeState', newValue?.state || '');
                                setValue('consigneeZip', newValue?.zipCode || '');
                                setValue('consigneeContact', newValue?.contactPersonName || '');
                                setValue('consigneePhone', newValue?.phoneNumber || '');
                              }
                            } else {
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

                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              // Truncate characters to enforce the 100 limit during manual typing/copy-paste
                              onChange({ consigneeId: null, consigneeName: newInputValue.slice(0, 100) });
                              setValue('consigneeAddr1', '');
                              setValue('consigneeAddr2', '');
                              setValue('consigneeCity', '');
                              setValue('consigneeState', '');
                              setValue('consigneeZip', '');
                              setValue('consigneeContact', '');
                              setValue('consigneePhone', '');
                            }
                          }}

                          filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const { inputValue } = params;

                            const isExisting = options.some(
                              (option) => inputValue.toLowerCase() === option.consigneeName.toLowerCase()
                            );

                            if (inputValue !== '' && !isExisting) {
                              filtered.unshift({
                                inputValue: inputValue.slice(0, 100),
                                consigneeName: `${inputValue.slice(0, 100)}`,
                              });
                            }

                            return filtered;
                          }}

                          getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                              return option;
                            }
                            if (option.inputValue) {
                              return option.inputValue;
                            }
                            return option.consigneeName || '';
                          }}

                          isOptionEqualToValue={(option, val) =>
                            option.consigneeId === val?.consigneeId || option.consigneeName === val?.consigneeName
                          }

                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={ref}
                              fullWidth
                              label={`Consignee Name ${watchedAirportDeliveryService ? ' *' : ''}`}
                              variant="standard"
                              error={!!errors['consigneeName']}
                              helperText={errors['consigneeName'] ? errors['consigneeName'].message : ''}

                              // 3. FIXED: Hard boundary blocking native keyboard strokes past 100 characters
                              inputProps={{
                                ...params.inputProps,
                                maxLength: 100
                              }}
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
                        required: watchedAirportDeliveryService ? 'Consignee name is required' : false,
                        validate: (value) => {
                          if (!value) return true;

                          const textToValidate = typeof value === 'object' ? (value.airlineName || '') : (value || '');
                          const parts = textToValidate.split('-').map(p => p.trim());
                          const numPart = parts[0] || '';
                          const codePart = parts[1] || '';
                          const namePart = parts[2] || '';

                          // FIXED 1: Schema-level check ensuring the name segment alone doesn't pass 100 characters
                          if (namePart.length > 100) {
                            return 'Airline Name cannot exceed 100 characters';
                          }

                          if (typeof value === 'object' && value.airlineId) {
                            return true;
                          }

                          const isPreExisting = consigneeAirlineDropdown.some((opt) => {
                            const fullString = `${opt.airlineNumber} - ${opt.airlineCode} - ${opt.airlineName}`;
                            return textToValidate.trim().toLowerCase() === fullString.toLowerCase();
                          });
                          if (isPreExisting) return true;

                          if (!/^\d{3}$/.test(numPart)) {
                            return 'Airline Number must be exactly 3 digits (Ex: 176)';
                          }

                          if (!/^[A-Za-z]{2,3}$/.test(codePart)) {
                            return 'Airline Code must be 2 or 3 letters (Ex: EK or AAA)';
                          }

                          if (!namePart) {
                            return 'Please provide the Airline Name at the end';
                          }

                          const formatRegex = /^\d{3} - [A-Z]{2,3} - .+$/i;
                          if (!formatRegex.test(textToValidate.trim())) {
                            return 'Format error. Use: Airline Number - Airline Code - Airline Name';
                          }

                          return true;
                        }
                      }}
                      render={({ field: { onChange, value, ref } }) => {
                        // Helper function to safely crop only the name portion to 100 characters max
                        const enforceNameLimit = (text) => {
                          if (!text) return '';
                          const sections = text.split(' - ');
                          if (sections.length >= 3) {
                            const prefix = `${sections[0]} - ${sections[1]} - `;
                            const namePart = sections.slice(2).join(' - ');
                            return prefix + namePart.slice(0, 100);
                          }
                          return text;
                        };

                        return (
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
                                // FIXED 2: Cap name segment on entry
                                onChange({ airlineId: null, airlineName: enforceNameLimit(newValue) });
                              } else if (newValue && newValue.inputValue) {
                                onChange({ airlineId: null, airlineName: enforceNameLimit(newValue.inputValue) });
                              } else if (newValue) {
                                onChange(newValue);
                              } else {
                                onChange(null);
                              }

                              const isSelection = newValue && !newValue.inputValue && typeof newValue !== 'string';
                              setValue('consigneeAddr1', isSelection ? newValue?.addressLine1 || '' : '');
                              setValue('consigneeAddr2', isSelection ? newValue?.addressLine2 || '' : '');
                              setValue('consigneeCity', isSelection ? newValue?.city || '' : '');
                              setValue('consigneeState', isSelection ? newValue?.state || '' : '');
                              setValue('consigneeZip', isSelection ? newValue?.zipCode || '' : '');
                              setValue('consigneeContact', isSelection ? newValue?.contactPersonName || '' : '');
                              setValue('consigneePhone', isSelection ? newValue?.phoneNumber || '' : '');
                            }}
                            onInputChange={(event, newInputValue, reason) => {
                              if (reason === 'input') {
                                const isDeleting = event?.nativeEvent?.inputType === 'deleteContentBackward';
                                let formatted = newInputValue;

                                if (!isDeleting) {
                                  let clean = newInputValue.replace(/[^A-Za-z0-9\s-]/g, '');

                                  if (/^\d{3}$/.test(clean)) {
                                    formatted = `${clean} - `;
                                  }

                                  const match = clean.match(/^(\d{3})\s*-\s*([A-Za-z]{2,3})$/);
                                  if (match) {
                                    formatted = `${match[1]} - ${match[2].toUpperCase()} - `;
                                  }
                                }

                                // FIXED 3: Enforce strict 100-character cap on name segment while actively typing
                                onChange({ airlineId: null, airlineName: enforceNameLimit(formatted) });
                              }
                            }}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              if (option.inputValue) return option.inputValue;
                              if (option.airlineId) {
                                return `${option.airlineNumber || ''} - ${option.airlineCode || ''} - ${option.airlineName || ''} - ${option.city || ''} - ${option.airportCode || ''}`;
                              }
                              return option.airlineName || '';
                            }}
                            isOptionEqualToValue={(option, val) =>
                              option.airlineId === val?.airlineId || option.airlineName === val?.airlineName
                            }
                            renderOption={(props, option, state) => {
                              const { key, ...optionProps } = props;
                              const uniqueKey = option.airlineId
                                ? `consignee-airline-${option.airlineId}-${state.index}`
                                : `custom-consignee-airline-${state.index}`;

                              if (option.inputValue) {
                                return (
                                  <Box component="li" key={uniqueKey} {...optionProps} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
                                  // FIXED 4: Cap custom filtering suggestion text lengths
                                  inputValue: enforceNameLimit(inputValue),
                                  airlineName: `${enforceNameLimit(inputValue)}`,
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

                                // FIXED 5: Set hard layout barrier to 111 (Handles 11 prefix characters + 100 character custom name)
                                inputProps={{
                                  ...params.inputProps,
                                  maxLength: 111
                                }}
                              />
                            )}
                            sx={{ width: '25%' }}
                          />
                        );
                      }}
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
                      <Controller
                        name={`handlingUnits.${huIdx}.uom`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Handling Units UOM *"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            SelectProps={{
                              displayEmpty: true,
                              // FIXED: Displays the grayed-out placeholder when the value is empty
                              renderValue: (selected) => {
                                if (!selected || selected === "") {
                                  return <span style={{ color: '#aaa', fontSize: '12px' }}>Select the Handling Units</span>;
                                }
                                return selected;
                              },
                              MenuProps: {
                                getContentAnchorEl: null,
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
                          >
                            {/* FIXED: Added a disabled/hidden placeholder menu option */}
                            <MenuItem value="" disabled sx={{ display: 'none' }}>
                              Select the Handling Units
                            </MenuItem>

                            {['Crate', 'Skid', 'Drum', 'Pail', 'Bundle', 'Bag', 'Barrel', 'Basket', 'Box', 'Carton', 'Jerrican', 'Package', 'Pallet', 'Cylinder', 'Tote', 'Roll', 'Reel', 'Tube'].map(u => (
                              <MenuItem key={u} value={u}>{u}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                    </Box>
                    <Box sx={{ flex: '1 1 100px' }}>
                      <Controller
                        name={`handlingUnits.${huIdx}.unitsCount`}
                        control={control}
                        rules={{
                          required: "Handling units count is required",
                          pattern: {
                            value: /^[0-9]+$/,
                            message: "Please enter a valid number"
                          },
                          // 1. FIXED: Schema validation check blocking numbers over 10 digits long
                          maxLength: {
                            value: 10,
                            message: "Handling units cannot exceed 10 digits"
                          }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            onChange={(e) => {
                              // 2. FIXED: Strips out non-digits AND slices the value to a maximum of 10 digits
                              const cleanValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                              field.onChange(cleanValue);
                            }}
                            fullWidth
                            label="Handling Units *"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}

                            // 3. FIXED: Merged your numeric constraints with a hard browser maxLength blocker
                            inputProps={{
                              inputMode: 'numeric',
                              pattern: '[0-9]*',
                              maxLength: 10
                            }}

                            error={!!errors?.handlingUnits?.[huIdx]?.unitsCount}
                            helperText={errors?.handlingUnits?.[huIdx]?.unitsCount?.message || ""}
                          />
                        )}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 20px' }}>
                      <Controller
                        name={`handlingUnits.${huIdx}.unit`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Unit *"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            SelectProps={{
                              displayEmpty: true,
                              MenuProps: {
                                getContentAnchorEl: null,
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
                                    maxWidth: 100
                                  }
                                }
                              },
                            }}
                          >
                            <MenuItem key='in' value={'in'}>in</MenuItem>
                            <MenuItem key='cm' value={'cm'}>cm</MenuItem>
                          </TextField>
                        )}
                      />

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

                      <Controller name={`handlingUnits.${huIdx}.weight`} control={control} render={({ field }) => (
                        <TextField {...field} fullWidth label="Weight" variant="standard" InputLabelProps={{ shrink: true }} />
                      )} />

                    </Box>

                    <Box display={'flex'} alignItems={'flex-end'} sx={{ flex: '1 1 20px' }}>
                      <Controller
                        name={`handlingUnits.${huIdx}.weightUnit`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label=""
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            SelectProps={{
                              displayEmpty: true,
                              MenuProps: {
                                getContentAnchorEl: null,
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
                                    maxWidth: 100
                                  }
                                }
                              },
                            }}
                          >
                            <MenuItem key='lbs' value={'lbs'}>lbs</MenuItem>
                            <MenuItem key='kgs' value={'kgs'}>kgs</MenuItem>
                          </TextField>
                        )}
                      />

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
                              renderValue: (selected) => selected || <em style={{ fontSize: '12px' }}>Select Class</em>,
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
                    setValue={setValue}
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
                      <Controller
                        name="emergencyContactName"
                        control={control}
                        rules={{
                          required: 'Contact Name is required',
                          // 1. FIXED: Schema validation check blocking data payloads past 100 characters
                          maxLength: {
                            value: 100,
                            message: 'Contact Name cannot exceed 100 characters'
                          }
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            onChange={(e) => {
                              // 2. FIXED: Truncates pasted text immediately to a 100 character maximum limit
                              const val = e.target.value;
                              field.onChange(val.slice(0, 100));
                            }}
                            fullWidth
                            label="Contact Name"
                            variant="standard"
                            required={isHazmatSelected}
                            // 3. FIXED: Attaches the error indicator and string feedback message dynamically
                            error={!!error}
                            helperText={error ? error.message : ''}
                            // 4. FIXED: Hard browser barrier blocking physical keyboard strokes at character 100
                            inputProps={{
                              maxLength: 100
                            }}
                          />
                        )}
                      />

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
                              // if(reason === 'input'){
                              //   dispatch(getCarrierTerminalDropdown(newInputValue));
                              // }
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
                        <Controller
                          name="carrierInfo.manualAddress.line1"
                          control={control}
                          render={({ field }) => (
                            <StyledTextField
                              {...field}
                              fullWidth
                              label="Address Line 1"
                              variant="standard"
                              InputLabelProps={{ shrink: true }}
                              // This enforces a hard limit of 255 characters at the HTML input element level
                              inputProps={{ maxLength: 255 }}
                            />
                          )}
                          disabled={!watchedFromLocationFlag}
                        />

                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller
                          name="carrierInfo.manualAddress.line2"
                          control={control}
                          render={({ field }) => (
                            <StyledTextField
                              {...field}
                              fullWidth
                              label="Address Line 2"
                              variant="standard"
                              InputLabelProps={{ shrink: true }}
                              disabled={!watchedFromLocationFlag}
                              // This natively blocks typing beyond 255 characters
                              inputProps={{ maxLength: 255 }}
                            />
                          )}
                        />

                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller
                          name="carrierInfo.manualAddress.city"
                          control={control}
                          render={({ field }) => (
                            <StyledTextField
                              {...field}
                              fullWidth
                              label="City"
                              variant="standard"
                              InputLabelProps={{ shrink: true }}
                              // Hard cap typing at 100 characters natively
                              inputProps={{ maxLength: 100 }}
                            />
                          )}
                          disabled={!watchedFromLocationFlag}
                        />

                      </Box>
                      <Box sx={{ flex: '1 1 18%' }}>
                        <Controller
                          name="carrierInfo.manualAddress.state"
                          control={control}
                          render={({ field }) => (
                            <StyledTextField
                              {...field}
                              fullWidth
                              label="State"
                              variant="standard"
                              InputLabelProps={{ shrink: true }}
                              // Limits input length to 100 characters natively
                              inputProps={{ maxLength: 100 }}
                            />
                          )}
                          disabled={!watchedFromLocationFlag}
                        />

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
                              value={watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? ''}
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
                          <Controller
                            name="carrierInfo.manualToAddress.line1"
                            control={control}
                            render={({ field }) => (
                              <StyledTextField
                                {...field}
                                fullWidth
                                label="Address Line 1"
                                variant="standard"
                                InputLabelProps={{ shrink: true }}
                                // Hard cap typing at 255 characters natively
                                inputProps={{ maxLength: 255 }}
                              />
                            )}
                            disabled={!watchedToLocationFlag}
                          />

                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller
                            name="carrierInfo.manualToAddress.line2"
                            control={control}
                            render={({ field }) => (
                              <StyledTextField
                                {...field}
                                fullWidth
                                label="Address Line 2"
                                variant="standard"
                                InputLabelProps={{ shrink: true }}
                                // Hard cap typing at 255 characters natively
                                inputProps={{ maxLength: 255 }}
                              />
                            )}
                            disabled={!watchedToLocationFlag}
                          />

                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller
                            name="carrierInfo.manualToAddress.city"
                            control={control}
                            render={({ field }) => (
                              <StyledTextField
                                {...field}
                                fullWidth
                                label="City"
                                variant="standard"
                                InputLabelProps={{ shrink: true }}
                                // Hard cap typing at 100 characters natively
                                inputProps={{ maxLength: 100 }}
                              />
                            )}
                            disabled={!watchedToLocationFlag}
                          />

                        </Box>
                        <Box sx={{ flex: '1 1 18%' }}>
                          <Controller
                            name="carrierInfo.manualToAddress.state"
                            control={control}
                            render={({ field }) => (
                              <StyledTextField
                                {...field}
                                fullWidth
                                label="State"
                                variant="standard"
                                InputLabelProps={{ shrink: true }}
                                // Hard cap typing at 100 characters natively
                                inputProps={{ maxLength: 100 }}
                              />
                            )}
                            disabled={!watchedToLocationFlag}
                          />

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

                      <Controller
                        name="carrierInfo.pickupAlertDetails.pickupNotes"
                        control={control}
                        defaultValue=""
                        rules={{
                          required: watchedCarrierInfo.pickupAlert ? 'Pickup notes is required' : '',
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Notes"
                            variant="standard"
                            InputLabelProps={{ shrink: true }}
                            required={!!watchedCarrierInfo?.pickupAlert}
                            error={!!error}
                            helperText={error?.message || ""}
                            inputProps={{ maxLength: 255 }}
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
                                // Natively restricts entry to 255 characters max
                                inputProps={{ maxLength: 255 }}
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
                                      // SAFE FIX: Merge your maxLength constraint into Autocomplete's core properties object
                                      inputProps={{
                                        ...params.inputProps,
                                        maxLength: 255
                                      }}
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
                            rules={{ required: true }}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Carrier's Bill Number"
                                required
                                variant="standard"
                                // Natively restricts entry to 50 characters max
                                inputProps={{ maxLength: 50 }}
                              />
                            )}
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
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
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
                                  value={watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? ''}
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
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 100 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.lineHaul.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulToLocationFlag} inputProps={{ maxLength: 100 }} />
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
                            rules={{
                              validate: (value) => {
                                if (!value || value === '') return true;

                                const dateObj = dayjs(value);
                                if (!dateObj.isValid()) {
                                  return "Please enter a valid date";
                                }
                                if (dateObj.year() < 1000) {
                                  return "Year is invalid";
                                }
                                return true;
                              }
                            }}
                            render={({ field: { onChange, value, ...fieldParams }, fieldState: { error } }) => (
                              <DatePicker
                                {...fieldParams}
                                value={value && dayjs(value).isValid() ? dayjs(value) : null}
                                onChange={(newValue) => {
                                  if (!newValue || (dayjs.isDayjs(newValue) && !newValue.isValid())) {
                                    onChange(null);
                                  } else {
                                    onChange(newValue);
                                  }
                                }}
                                label="ETA Date"
                                slotProps={{
                                  textField: {
                                    variant: 'standard',
                                    fullWidth: true,
                                    error: !!error,
                                    helperText: error ? error.message : '',

                                    // FIXED: Intercept keystrokes immediately to block "00/00/0000" layouts
                                    onBeforeInput: (e) => {
                                      const target = e.target;
                                      const inputVal = target.value;
                                      const insertedChar = e.data;

                                      // 1. Block '0' if it is the very first character typed
                                      if (insertedChar === '0' && (!inputVal || inputVal.trim() === '')) {
                                        e.preventDefault();
                                        return;
                                      }

                                      // 2. Block '0' if they are typing it directly after a slash (e.g., "12/0" for month/day filler)
                                      // This stops patterns like "12/00/0000" or "01/00/2024"
                                      if (insertedChar === '0' && inputVal.endsWith('/')) {
                                        e.preventDefault();
                                        return;
                                      }
                                    }
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
                                // 1. Sets a hard maximum value of 10 nines (9,999,999,999) 
                                // 2. Blocks the decimal point key "." from being pressed
                                inputProps={{
                                  max: 9999999999
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Optional: Extra insurance to slice text if pasted over 10 digits
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.length > 10) {
                                    e.target.value = value.slice(0, 10);
                                  }
                                  field.onChange(e);
                                }}
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
                                // 1. Enforces the hard maximum numeric value (8 digits before decimal)
                                inputProps={{
                                  max: 99999999.99,
                                  step: "0.01" // Signals to browsers that 2 decimal places are expected
                                }}
                                // 2. Blocks exponent characters 'e', '+', or '-' from breaking the number
                                onKeyDown={(e) => {
                                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Regex check: Enforces a maximum of 10 total digits and 2 decimal places
                                onChange={(e) => {
                                  const val = e.target.value;

                                  // Allows empty string, or any number that matches up to 8 digits and up to 2 decimals
                                  // Total maximum string length (including dot) will be 11 characters
                                  const isValidDecimal = /^\d{0,8}(\.\d{0,2})?$/.test(val);

                                  if (isValidDecimal || val === '') {
                                    field.onChange(e);
                                  } else {
                                    // If the typed character violates (10,2), block it by ignoring the change
                                    e.preventDefault();
                                  }
                                }}
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
                            inputProps={{ maxLength: 255 }}
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
                            rules={{ required: true }}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Carrier's Bill Number"
                                required
                                variant="standard"
                                // Natively restricts entry to 50 characters max
                                inputProps={{ maxLength: 50 }}
                              />
                            )}
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
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 255 }} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 255 }} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 100 }} />} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} disabled={!watchedDeliveryFromLocationFlag} inputProps={{ maxLength: 100 }} />} />
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
                                    // FIXED: Converted to a clean, single-line concatenation string to prevent Vite parsing crashes
                                    const uniqueKey = "delivery-tolocation-" + option.terminalId + "-" + option.carrierId + "-" + state.index;
                                    return (
                                      <li {...props} key={uniqueKey}>
                                        {option.carrierName && option.terminalName
                                          ? option.carrierName + " | " + option.terminalName
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
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 255 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 100 }} />
                          </Box>
                          <Box sx={{ flex: '1 1 18%' }}>
                            <Controller name="carrierInfo.deliveryDetails.manualToLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedDeliveryToLocationFlag} inputProps={{ maxLength: 100 }} />
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
                            rules={{
                              validate: (value) => {
                                // 1. FIXED: If there is no value, return true instantly (No error is shown)
                                if (!value || value === '') return true;

                                const dateObj = dayjs(value);

                                // 2. If it's a Dayjs object but not fully typed out yet, check if it's completely invalid
                                if (dayjs.isDayjs(value) && !value.isValid()) {
                                  // If the user cleared the text box entirely, let it pass as valid
                                  return "Please enter a valid date";
                                }

                                if (!dateObj.isValid()) {
                                  return "Please enter a valid date";
                                }

                                // 3. Catches invalid partial years like 202 or 0202
                                if (dateObj.year() < 1000) {
                                  return "Year is invalid";
                                }

                                return true;
                              }
                            }}
                            render={({ field: { onChange, value, ...fieldParams }, fieldState: { error } }) => (
                              <DatePicker
                                {...fieldParams}
                                // 4. FIXED: Do not force null on partial text inputs, allow the user to type out the year
                                value={value ? dayjs(value) : null}
                                onChange={(newValue) => {
                                  // 5. FIXED: If the field is manually wiped out cleanly, send null to the form state
                                  if (!newValue) {
                                    onChange(null);
                                  } else {
                                    onChange(newValue);
                                  }
                                }}
                                label="ETA Date"
                                slotProps={{
                                  textField: {
                                    variant: 'standard',
                                    fullWidth: true,
                                    error: !!error,
                                    helperText: error ? error.message : '',

                                    onBeforeInput: (e) => {
                                      const target = e.target;
                                      const inputVal = target.value;
                                      const insertedChar = e.data;

                                      if (insertedChar === '0' && (!inputVal || inputVal.trim() === '')) {
                                        e.preventDefault();
                                        return;
                                      }

                                      if (insertedChar === '0' && inputVal.endsWith('/')) {
                                        e.preventDefault();
                                        return;
                                      }
                                    }
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
                                // 1. Sets a hard maximum numeric value of 10 digits
                                inputProps={{
                                  max: 9999999999
                                }}
                                // 2. Blocks decimal points and scientific notation keys to force integers
                                onKeyDown={(e) => {
                                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Crops pasted or scrolled inputs immediately if they exceed 10 digits
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.length > 10) {
                                    e.target.value = value.slice(0, 10);
                                  }
                                  field.onChange(e);
                                }}
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
                                // 1. Sets the hard maximum numeric limit for 8 whole digits and 2 decimals
                                inputProps={{
                                  max: 99999999.99,
                                  step: "0.01"
                                }}
                                // 2. Prevents unexpected exponential or sign inputs
                                onKeyDown={(e) => {
                                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                  }
                                }}
                                // 3. Natively locks down the 10 total digits and 2-decimal maximum limit
                                onChange={(e) => {
                                  const val = e.target.value;

                                  // Matches up to 8 digits before the dot and up to 2 digits after the dot
                                  const isValidDecimal = /^\d{0,8}(\.\d{0,2})?$/.test(val);

                                  if (isValidDecimal || val === '') {
                                    field.onChange(e);
                                  } else {
                                    e.preventDefault();
                                  }
                                }}
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
                              inputProps={{ maxLength: 255 }}
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
                              inputProps={{ maxLength: 255 }}
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
                                  // Natively restricts entry to 255 characters max
                                  inputProps={{ maxLength: 255 }}
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
                sectionName={`Line Haul Carrier ${(watchedCarrierRateInfo.lineHaul.lineHaulCarrier && (selectedRouting === 'pickup_only' && (watchedLinehaulSelectRouting === 'linehaul_only' || watchedLinehaulSelectRouting === 'linehaul_delivery'))) ? `-  ${carrierTerminalDropdown.find(
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
                sectionName={`Delivery Carrier ${(watchedCarrierRateInfo.delivery.deliveryCarrier && ((selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only') || selectedRouting === 'pickup_linehaul')) ? `-  ${carrierTerminalDropdown.find(
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



          <Snackbar open={errorVisible} autoHideDuration={6000} onClose={() => { setErrorVisible(false); setErrorVisibleFields(''); }} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>

            <Alert severity="error" variant="filled">
              Please fill required fields: {Array.isArray(errorVisibleFields) ? errorVisibleFields.join(", ") : String(errorVisibleFields || "")}
            </Alert>

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
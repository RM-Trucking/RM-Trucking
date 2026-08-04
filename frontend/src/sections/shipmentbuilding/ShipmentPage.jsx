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
  getZipToZipCarrierDeliveryRate, setError, setOperationalMessage, postNetworkShipment,

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
import ActiveStep0 from './ActiveStep0';
import ActiveStep1 from './ActiveStep1';
import ActiveStep2 from './ActiveStep2';
import ActiveStep3Pickup from './ActiveStep3Pickup';
import ActiveStep3Linehaul from './ActiveStep3Linehaul';
import ActiveStep3Delivery from './ActiveStep3Delivery';
import { handleNext, onFormSubmit, hasInitialData } from './handleNext';

// --------------------------------------------------------------

// --- CONSTANTS & LISTS --- 

const STEPS = [
  'Shipment Details',
  'Customer Details',
  'Commodities Details',
  'Carrier Information',
  'Carrier Rate'
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

const ShipmentPage = ({ type }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filter = createFilterOptions();

  const {
    control,
    trigger,
    formState: { errors },
    reset,
    getValues, setValue, handleSubmit,
    clearErrors,
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

      referenceTableRows: [],

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


  const handleBack = () => {
    console.log('Current Form Values:', getValues());
    setActiveStep((prev) => prev - 1);
    if (activeStep === 2 && hasInitialData(getValues)) {
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
            label={`${label}`}
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
          value: 4,
          message: `${label} cannot exceed 4 characters`
        },
        pattern: {
          // FIXED: Restricts uppercase letter string count between 3 and 4 
          value: /^[A-Z]{3,4}$/,
          message: 'Must be 3 or 4 letters'
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
                ...(isAirport && { maxLength: 4 }),
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

  useEffect(() => {
    console.log(shipperAirlineDropdown);
  }, [shipperAirlineDropdown])

  useEffect(() => {
    if (watchedAirportPickupService !== undefined) {
      // if they check or uncheck the values have to be empty for the new select
      setValue('shipperName', '');
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
      setValue('consigneeName', '');
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
    const roundedPercentage = Number(calculatedPercentage.toFixed(2));

    // 2. Set the perfectly rounded numeric value into your form state
    setValue('customerRate.fuelSurchargeRate', roundedPercentage);
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
      setIsSubmitting(false);
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
                    onClick={() => handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                      watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                      setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                      watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                      getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport,
                      watchedDestinationAirport, setActiveStep, totals,
                    )}
                    sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                  >
                    {activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                }
                {activeStep === 3 && isPickupPending &&
                  <Button
                    variant="contained"
                    onClick={() => onFormSubmit(dispatch, setValue, getValues, trigger, errors,
                      activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                      selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                      watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                      carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                      setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending)}
                    disabled={isSubmitting} // 👈 This disables the button instantly on click
                    sx={{
                      ...commonBtnStyle,
                      bgcolor: '#a22',
                      '&:hover': { bgcolor: '#811' }
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>}
                {
                  activeStep === 3 && selectedRouting === 'pickup_only' && getValues('carrierInfo.selectCarrier') && !isPickupPending &&
                  <>
                    <Button
                      variant="contained"
                      onClick={() => onFormSubmit(dispatch, setValue, getValues, trigger, errors,
                        activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                        selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                        watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                        carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                        setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending)}
                      disabled={isSubmitting} // 👈 This disables the button instantly on click
                      sx={{
                        ...commonBtnStyle,
                        bgcolor: '#a22',
                        '&:hover': { bgcolor: '#811' }
                      }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </>
                }
                {
                  activeStep === 3 && !isPickupPending && <Button
                    variant="contained"
                    onClick={() => handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                      watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                      setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                      watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                      getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport,
                      watchedDestinationAirport, setActiveStep, totals,
                    )}
                    disabled={isSubmitting}
                    sx={{
                      ...commonBtnStyle,
                      bgcolor: '#a22',
                      '&:hover': { bgcolor: '#811' },
                      '&:disabled': { bgcolor: '#cca' }
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                }
              </Box>
            </Box>
            {type !== 'Edit' && <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mb: 2 }}>
              {/* Action Buttons Row */}
              <Stack direction="row" spacing={1} alignItems="center">
                {activeStep === 2 && type === 'Edit' && <Button
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

            <ActiveStep0 control={control} errors={errors} watchedServiceLevel={watchedServiceLevel} clearErrors={clearErrors} />
          )}

          {/* STEP 1 */}

          {activeStep === 1 && (

            <ActiveStep1 control={control} errors={errors}
              customerStationDropdown={customerStationDropdown}
              renderTextField={renderTextField}
              renderZipCodeField={renderZipCodeField}
              renderPhoneField={renderPhoneField}
              watchedAirportPickupService={watchedAirportPickupService}
              watchedAirportDeliveryService={watchedAirportDeliveryService}
              shipperDropdown={shipperDropdown}
              watchedOriginAirport={watchedOriginAirport}
              shipperAirlineDropdown={shipperAirlineDropdown}
              consigneeDropdown={consigneeDropdown}
              consigneeAirlineDropdown={consigneeAirlineDropdown}
              watchedDestinationAirport={watchedDestinationAirport}
              dispatch={dispatch}
              navigate={navigate}
              location={location}
              setValue={setValue}
              clearErrors={clearErrors}
            />

          )}

          {/* STEP 2 */}

          {activeStep === 2 && (
            <ActiveStep2
              control={control}
              dispatch={dispatch}
              navigate={navigate}
              location={location}
              setValue={setValue}
              huFields={huFields}
              removeHU={removeHU}
              errors={errors}
              watchedHU={watchedHU}
              getValues={getValues}
              appendHU={appendHU}
              setErrorVisible={setErrorVisible}
              isHazmatSelected={isHazmatSelected}
              setHazmatModal={setHazmatModal}
            />
          )}

          {/* STEP 3 */}

          {activeStep === 3 && (
            <>
              <ActiveStep3Pickup
                dispatch={dispatch}
                navigate={navigate}
                location={location}
                control={control}
                errors={errors}
                isPickupPending={isPickupPending}
                carrierTerminalDropdown={carrierTerminalDropdown}
                setSelectCarrierPickupSearchValue={setSelectCarrierPickupSearchValue}
                selectCarrierPickupSearchValue={selectCarrierPickupSearchValue}
                watchedFromLocationFlag={watchedFromLocationFlag}
                renderZipCodeFieldCarrierInfo={renderZipCodeFieldCarrierInfo}
                watchedPickupAgentTerminal={watchedPickupAgentTerminal}
                selectedRouting={selectedRouting}
                watchedToLocationType={watchedToLocationType}
                isSelectingCarrierPickupRef={isSelectingCarrierPickupRef}
                isSelectingToCarrierPickupRef={isSelectingToCarrierPickupRef}
                isLoading={isLoading}
                watchedConsigneeName={watchedConsigneeName}
                watchedToLocationFlag={watchedToLocationFlag}
                watchedAddPickupAccessorial={watchedAddPickupAccessorial}
                setPickupAccModal={setPickupAccModal}
                pickupAccModal={pickupAccModal}
                pickupAccFields={pickupAccFields}
                setActiveAccType={setActiveAccType}
                notesRefArray={notesRefArray}
                notesRefArrayIndex={notesRefArrayIndex}
                notesRefArrayObj={notesRefArrayObj}
                setOpenNotesDialogForShipmentAccs={setOpenNotesDialogForShipmentAccs}
                setEditAccIndex={setEditAccIndex}
                editAccIndex={editAccIndex}
                setActiveNotesIndex={setActiveNotesIndex}
                setActionType={setActionType}
                actionType={actionType}
                setAddPickUpAccModal={setAddPickUpAccModal}
                removePickupAcc={removePickupAcc}
                replacePickupAcc={replacePickupAcc}
                PICKUP_MASTER_ACCESSORIALS={PICKUP_MASTER_ACCESSORIALS}
                setPICKUP_MASTER_Accessorials={setPICKUP_MASTER_Accessorials}
                onSaveOfEdit={onSaveOfEdit}
                addPickUpAccModal={addPickUpAccModal}
                watchedPickupAlert={watchedPickupAlert}
                inboundNotes={inboundNotes}
                setValue={setValue}
                watchedCarrierInfo={watchedCarrierInfo}
                appendPickupAccFields={appendPickupAccFields}
                carrierTerminalSelectError={carrierTerminalSelectError}
                setCarrierTerminalSelectError={setCarrierTerminalSelectError}
                watchedLineHaulToggledAddress={watchedLineHaulToggledAddress}
                watchedPickupAdditionalMails={watchedPickupAdditionalMails}
                carrierPickupSearchValue={carrierPickupSearchValue}
              />
              {

                isPickupPending === false &&
                <ActiveStep3Linehaul
                  dispatch={dispatch}
                  navigate={navigate}
                  location={location}
                  control={control}
                  errors={errors}
                  selectedRouting={selectedRouting}
                  carrierTerminalDropdown={carrierTerminalDropdown}
                  isSelectingCarrierLinehaulRef={isSelectingCarrierLinehaulRef}
                  setSelectCarrierLinehaulSearchValue={setSelectCarrierLinehaulSearchValue}
                  selectCarrierLinehaulSearchValue={selectCarrierLinehaulSearchValue}
                  watchedPickupAgentTerminal={watchedPickupAgentTerminal}
                  watchedSelectedPickupCarrier={watchedSelectedPickupCarrier}
                  renderZipCodeFieldCarrierInfo={renderZipCodeFieldCarrierInfo}
                  watchedLinehaulSelectRouting={watchedLinehaulSelectRouting}
                  watchedLinehaulToLocationType={watchedLinehaulToLocationType}
                  isSelectingToCarrierLinehaulRef={isSelectingToCarrierLinehaulRef}
                  setCarrierLinehaulSearchValue={setCarrierLinehaulSearchValue}
                  carrierLinehaulSearchValue={carrierLinehaulSearchValue}
                  watchedConsigneeName={watchedConsigneeName}
                  watchedLinehaulToLocationFlag={watchedLinehaulToLocationFlag}
                  watchedLinehaulAddAcc={watchedLinehaulAddAcc}
                  setLineHaulAccModal={setLineHaulAccModal}
                  lineHaulAccFields={lineHaulAccFields}
                  setActiveAccType={setActiveAccType}
                  notesRefArray={notesRefArray}
                  notesRefArrayIndex={notesRefArrayIndex}
                  notesRefArrayObj={notesRefArrayObj}
                  setOpenNotesDialogForShipmentAccs={setOpenNotesDialogForShipmentAccs}
                  setEditAccIndex={setEditAccIndex}
                  setActionType={setActionType}
                  setAddLineHaulAccModal={setAddLineHaulAccModal}
                  removeLineHaulAcc={removeLineHaulAcc}
                  lineHaulAccModal={lineHaulAccModal}
                  replaceLineHaulAcc={replaceLineHaulAcc}
                  addLineHaulAccModal={addLineHaulAccModal}
                  actionType={actionType}
                  LINEHAUL_MASTER_ACCESSORIALS={LINEHAUL_MASTER_ACCESSORIALS}
                  setLINEHAUL_MASTER_Accessorials={setLINEHAUL_MASTER_Accessorials}
                  appendLineHaulAccFields={appendLineHaulAccFields}
                  lineHaulNotesArr={lineHaulNotesArr}
                  watchedLinehaulFromLocationFlag={watchedLinehaulFromLocationFlag}
                  onSaveOfEdit={onSaveOfEdit}
                  editAccIndex={editAccIndex}
                  isLoading={isLoading}
                  setValue={setValue}
                  watchedCarrierInfo={watchedCarrierInfo}
                  watchedToLocation={watchedToLocation}
                  isPickupPending={isPickupPending}
                />
              }
              {isPickupPending === false && <ActiveStep3Delivery
                dispatch={dispatch}
                navigate={navigate}
                location={location}
                control={control}
                errors={errors}
                selectedRouting={selectedRouting}
                carrierTerminalDropdown={carrierTerminalDropdown}
                isLoading={isLoading}
                setValue={setValue}
                watchedLinehaulSelectRouting={watchedLinehaulSelectRouting}
                isSelectingCarrierDeliveryRef={isSelectingCarrierDeliveryRef}
                setSelectCarrierDeliverySearchValue={setSelectCarrierDeliverySearchValue}
                selectCarrierDeliverySearchValue={selectCarrierDeliverySearchValue}
                watchedSelectedLineHaulCarrier={watchedSelectedLineHaulCarrier}
                watchedLinehaulToLocation={watchedLinehaulToLocation}
                watchedDeliveryFromLocationFlag={watchedDeliveryFromLocationFlag}
                watchedDeliveryToLocationType={watchedDeliveryToLocationType}
                isSelectingToCarrierDeliveryRef={isSelectingToCarrierDeliveryRef}
                setCarrierDeliverySearchValue={setCarrierDeliverySearchValue}
                carrierDeliverySearchValue={carrierDeliverySearchValue}
                watchedConsigneeName={watchedConsigneeName}
                watchedDeliveryAddAcc={watchedDeliveryAddAcc}
                deliveryAccFields={deliveryAccFields}
                setActiveAccType={setActiveAccType}
                notesRefArray={notesRefArray}
                notesRefArrayIndex={notesRefArrayIndex}
                notesRefArrayObj={notesRefArrayObj}
                setOpenNotesDialogForShipmentAccs={setOpenNotesDialogForShipmentAccs}
                setEditAccIndex={setEditAccIndex}
                setActionType={setActionType}
                setAddDeliveryAccModal={setAddDeliveryAccModal}
                removeDeliveryAcc={removeDeliveryAcc}
                deliveryAccModal={deliveryAccModal}
                setDeliveryAccModal={setDeliveryAccModal}
                replaceDeliveryAcc={replaceDeliveryAcc}
                addDeliveryAccModal={addDeliveryAccModal}
                actionType={actionType}
                DELIVERY_MASTER_ACCESSORIALS={DELIVERY_MASTER_ACCESSORIALS}
                setDELIVERY_MASTER_Accessorials={setDELIVERY_MASTER_Accessorials}
                onSaveOfEdit={onSaveOfEdit}
                appendDeliveryAccFields={appendDeliveryAccFields}
                watchedDeliveryAlert={watchedDeliveryAlert}
                deliveryLineHaulNotesArr={deliveryLineHaulNotesArr}
                deliveryNotesArr={deliveryNotesArr}
                watchedDeliveryAdditionalMails={watchedDeliveryAdditionalMails}
                renderZipCodeFieldCarrierInfo={renderZipCodeFieldCarrierInfo}
                watchedDeliveryToLocationFlag={watchedDeliveryToLocationFlag}
                editAccIndex={editAccIndex}
                watchedCarrierInfo={watchedCarrierInfo}
                isPickupPending={isPickupPending}
              />
              }
            </>
          )}

          {/* step 4 */}

          {
            activeStep === 4 && (
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
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

              </Paper>
            )
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
export default ShipmentPage; 
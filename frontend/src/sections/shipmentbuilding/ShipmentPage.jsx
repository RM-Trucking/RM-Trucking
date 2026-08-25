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
import ConfirmDialog from '../../components/confirm-dialog';
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
  getZipToZipCarrierDeliveryRate, setError, setOperationalMessage, postNetworkShipment, patchNetworkShipment,

} from '../../redux/slices/shipment';
import ShipmentStatusUpdateDialog from './ShipmentStatusUpdateDialog';
import ItemsSection from './ItemsSection';
import ItemsSectionView from './ItemsSectionView';
import HazmatDialog from './HazmatDialog';
import CommoditiesList from './CommoditiesList';
import PickupAccessorialDialog from './PickupAccessorialDialog';
import AddAccessorialDialog from './AddAccessorialDialog';

import DoDetailsDialog from './DoDetailsDialog';
import CustomerRateDialog from './CustomerRateDialog';
import HandleCancelDialog from './HandleCancelDialog';
import StepperHeader from './StepperHeader';
import ActiveStep0 from './ActiveStep0';
import ActiveStep1 from './ActiveStep1';
import ActiveStep2 from './ActiveStep2';
import ActiveStep3Pickup from './ActiveStep3Pickup';
import ActiveStep3Linehaul from './ActiveStep3Linehaul';
import ActiveStep3Delivery from './ActiveStep3Delivery';
import ActiveStep4 from './ActiveStep4';
import AccCheckDialog from './AccCheckDialog';
import { handleNext, onFormSubmit, hasInitialData } from './handleNext';
import { handleEditNext, onFormEditSubmit } from './handleEditNext';
import { updateControls, updateStep2Controls } from './UpdateControls';

// --------------------------------------------------------------

// --- CONSTANTS & LISTS --- 
// to calculate freight class
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
  const selectedShipmentBuildObj = useSelector((state) => state?.shipmentbuildingdata?.selectedShipmentBuildObj);
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
  const [accCheckModal, setAccCheckModal] = useState({ open: false, acc: '', });
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
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  const filter = createFilterOptions();

  const {
    control,
    trigger,
    formState: { errors },
    reset,
    getValues, setValue, handleSubmit,
    clearErrors, watch,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      // Step 0 
      shipmentType: '',
      serviceLevel: '',
      date: dayjs().format('YYYY-MM-DD'),
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
      printablePickupReferenceRows: [],
      printableLinehaulReferenceRows: [],
      printableDeliveryReferenceRows: [],
      // Step 2 - Handling Units 
      handlingUnits: [{
        uom: '', unitsCount: '', unit: 'in', length: '', width: '', height: '', weight: '', weightUnit: 'lbs', class: '', calculatedFC: '',
        freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
        badFreight: false,
        badFreightCondition: '',
        items: [{ pieces: '', piecesUom: '', description: '', hazmatInfo: false }]
      }],
      emergencyContactName: '',
      emergencyContactPhone: '',
      doDetails: {
        handlingUnits: [],
        emergencyContactName: '',
        emergencyContactPhone: '',
      },
      // shipment status
      shipmentStatus: {
        status: 'New Shipment',
        date: dayjs().format('YYYY-MM-DD'),
        time: null,
        location: '',
        comments: '',
        signature: '',
        deliveryDate: dayjs().format('YYYY-MM-DD'),
        deliveryTime: null,
        appointmentDate: dayjs().format('YYYY-MM-DD'),
        appointmentTime: null,
        shipmentStatusTable: []
      },
      // step 3 - Carrier Information
      carrierInfoSubmit: false,
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
          etaDate: dayjs().format('YYYY-MM-DD'),
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
          etaDate: dayjs().format('YYYY-MM-DD'),
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
  const watchedCarrierInfoSubmit = useWatch({ control, name: "carrierInfoSubmit" });
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
  const { fields: carrierRatesPickUpAccessorials, update: carrierRatesPickUpUpdateAccessorials, replace: carrierRatesPickUpReplaceAccessorials } = useFieldArray({ control, name: `carrierRates.pickUp.pickupAccessorials` });
  const watchedCRPickupAccessorials = watch('carrierRates.pickUp.pickupAccessorials');
  const { fields: carrierRatesLineHaulAccessorials, update: carrierRatesLineHaulUpdateAccessorials, replace: carrierRatesLineHaulReplaceAccessorials } = useFieldArray({ control, name: `carrierRates.lineHaul.lineHaulAccessorials` });
  const watchedCRLinehaulAccessorials = watch('carrierRates.lineHaul.lineHaulAccessorials');
  const { fields: carrierRatesDeliveryAccessorials, update: carrierRatesDeliveryUpdateAccessorials, replace: carrierRatesDeliveryReplaceAccessorials } = useFieldArray({ control, name: `carrierRates.delivery.deliveryAccessorials` });
  const watchedCRDeliveryAccessorials = watch('carrierRates.delivery.deliveryAccessorials');
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

  useEffect(() => {
    if (!customerRateAccFields || customerRateAccFields.length === 0) return;

    let hasChanges = false;

    const updatedCustomerAccs = customerRateAccFields.map((acc) => {
      if (acc?.chargeType?.toLowerCase() === 'per_pound') {
        const calculatedWeight = (watchedHU?.[0]?.weightUnit === 'lbs')
          ? Number(totals?.totalWeight || 0)
          : Number((Number(totals?.totalWeight || 0) * 2.20462).toFixed(2));

        // ONLY flag a change if the value actually is different
        if (acc.input !== calculatedWeight) {
          hasChanges = true;
          return { ...acc, input: calculatedWeight };
        }
      }
      return acc;
    });

    // CRITICAL: Only update state if something actually changed
    if (hasChanges) {
      replaceCustomerRateAccFields(updatedCustomerAccs);
    }

    // Added customerRateAccFields safely because the 'hasChanges' guard kills the loop
  }, [totals?.totalWeight, watchedHU?.[0]?.weightUnit, customerRateAccFields, replaceCustomerRateAccFields]);

  const renderZipCodeField = (name, required = false) => {
    // DYNAMIC DISABLE LOGIC: Check if fields should be read-only based on watched values
    let isFieldDisabled = type === 'View'; // Default fallback

    if (name.startsWith('shipper')) {
      // Disable shipper zip fields if watchedShipperName contains a shipperId or airlineId
      const hasShipperId = !!watchedShipperName?.shipperId;
      const hasAirlineId = !!watchedShipperName?.airlineId;
      if (hasShipperId || hasAirlineId) {
        isFieldDisabled = true;
      }
    } else if (name.startsWith('consignee')) {
      // Disable consignee zip fields if watchedConsigneeName contains a consigneeId or airlineId
      const hasConsigneeId = !!watchedConsigneeName?.consigneeId;
      const hasAirlineId = !!watchedConsigneeName?.airlineId;
      if (hasConsigneeId || hasAirlineId) {
        isFieldDisabled = true;
      }
    }

    return (
      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
        <Controller
          name={name}
          control={control}
          rules={{
            validate: (value) => {
              // MANDATORY CHECK: Fail validation if the field is required but missing/empty spaces
              if (!value || value.toString().trim().length === 0) {
                return required ? 'Zip Code is required' : true;
              }

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
            <StyledTextField
              {...field}
              variant="standard"
              fullWidth
              label={`Zip Code${required ? ' *' : ''}`}
              error={!!error}
              helperText={error?.message || 'Ex: 12345 or 12345-6789'}
              value={value || ''}
              onChange={(e) => {
                const input = e.target.value;

                // Allow only digits and a single dash character
                let raw = input.replace(/[^\d-]/g, '');
                const slicedVal = raw.slice(0, 10);

                // Prevent typing more than 10 characters (#####-####)
                onChange(slicedVal);

                // FIXED: Manually wipe out the error banner when valid keystrokes are registered
                if (error && slicedVal.trim().length > 0) {
                  clearErrors(name);
                }
              }}
              inputProps={{ maxLength: 10, inputMode: 'numeric' }}
              disabled={isFieldDisabled}
            />
          )}
        />
      </Box>
    );
  };



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
            disabled={type === 'View' || flag}
          />
        )}
      />


    </Box>

  );

  // --- HELPER: RENDER PHONE FIELD --- 

  const renderPhoneField = (name, label, required = false) => {
    // DYNAMIC DISABLE LOGIC: Check if fields should be read-only based on watched values
    let isFieldDisabled = type === 'View'; // Default fallback

    if (name.startsWith('shipper')) {
      // Disable shipper phone fields if watchedShipperName contains a shipperId or airlineId
      const hasShipperId = !!watchedShipperName?.shipperId;
      const hasAirlineId = !!watchedShipperName?.airlineId;
      if (hasShipperId || hasAirlineId) {
        isFieldDisabled = true;
      }
    } else if (name.startsWith('consignee')) {
      // Disable consignee phone fields if watchedConsigneeName contains a consigneeId or airlineId
      const hasConsigneeId = !!watchedConsigneeName?.consigneeId;
      const hasAirlineId = !!watchedConsigneeName?.airlineId;
      if (hasConsigneeId || hasAirlineId) {
        isFieldDisabled = true;
      }
    }

    return (
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
              // 1. If the field is optional and completely empty, skip validation cleanly
              if (!value || String(value).trim().length === 0) {
                return required ? `${label} is required` : true;
              }

              // 2. Safely convert to a string and strip ALL non-digits
              const digitsOnly = String(value).replace(/\D/g, '');

              // 3. ENFORCE LENGTH: Fail immediately if the total digit count is less than 10
              if (digitsOnly.length < 10) {
                return `${label} must be a valid 10-digit number (e.g., (123) 456-7890)`;
              }

              // 4. ZERO CHECK: Prevent dummy placeholders
              const isAllZeros = digitsOnly.length > 0 && /^0+$/.test(digitsOnly);
              if (isAllZeros) return 'Phone number cannot be all zeros';

              return true;
            }

          }}
          render={({ field, fieldState: { error } }) => (
            <StyledTextField
              {...field}
              value={field.value || ''}
              variant="standard"
              fullWidth
              label={`${label}${required ? ' *' : ''}`}
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
                  field.onChange(val);
                  // FIXED: Manually clear error or retrigger validation if user is actively altering text
                  if (error && val.trim().length > 0) {
                    clearErrors(name);
                  }
                  return;
                }

                // 3. Format and enforce string limit
                const formattedValue = formatPhoneNumber(val).slice(0, 20);
                field.onChange(formattedValue);

                // FIXED: Clear validation block errors manually when valid characters are added
                if (error && formattedValue.trim().length > 0) {
                  clearErrors(name);
                }
              }}
              disabled={isFieldDisabled}
            />
          )}
        />
      </Box>
    );
  };




  const renderTextField = (name, label, required = false) => {
    const labelLower = label.toLowerCase();
    const nameLower = name.toLowerCase();

    // DYNAMIC DISABLE LOGIC: Check if fields should be read-only based on watched values
    let isFieldDisabled = type === 'View'; // Default fallback

    if (name.startsWith('shipper')) {
      // Disable shipper fields if watchedShipperName contains a shipperId or airlineId
      const hasShipperId = !!watchedShipperName?.shipperId;
      const hasAirlineId = !!watchedShipperName?.airlineId;
      if (hasShipperId || hasAirlineId) {
        isFieldDisabled = true;
      }
    } else if (name.startsWith('consignee')) {
      // Disable consignee fields if watchedConsigneeName contains a consigneeId or airlineId
      const hasConsigneeId = !!watchedConsigneeName?.consigneeId;
      const hasAirlineId = !!watchedConsigneeName?.airlineId;
      if (hasConsigneeId || hasAirlineId) {
        isFieldDisabled = true;
      }
    }

    // Check field characteristics
    const isCityOrState = ['city', 'state'].some(keyword =>
      nameLower.includes(keyword) || labelLower.includes(keyword)
    );
    const isAirport = nameLower.includes('airport');

    // Determine dynamic maxLength values based on the field's label string
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
          value: /^[A-Z]{3,4}$/,
          message: 'Must be 3 or 4 letters'
        },
        validate: (value) => !value || value.trim().length > 0 || `${label} cannot be only spaces`
      };
    } else {
      validationRules = {
        required: required ? `${label} is required` : false,
        ...(maxCharLimit && {
          maxLength: {
            value: maxCharLimit,
            message: `${label} cannot exceed ${maxCharLimit} characters`
          }
        }),
        // MANDATORY RULE PROTECTION: Blocks users from typing blank whitespace
        ...(required && {
          validate: (value) => {
            if (!value || value.toString().trim().length === 0) {
              return `${label} cannot be empty or only spaces`;
            }
            return true;
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
            <StyledTextField
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
                  if (maxCharLimit) {
                    val = val.slice(0, maxCharLimit);
                  }
                  field.onChange(val);
                }

                // FIXED: Manually clear the sticky error state as soon as valid text is typed
                if (errors[name] && val.trim().length > 0) {
                  clearErrors(name);
                }
              }}
              fullWidth
              label={`${label}${required ? ' *' : ''}`}
              variant="standard"
              error={!!errors[name]}
              helperText={errors[name]?.message || ""}
              disabled={isFieldDisabled}
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
    if ((type === 'View' || type === 'Edit') && (selectedShipmentBuildObj === undefined || selectedShipmentBuildObj && Object.keys(selectedShipmentBuildObj).length === 0)) {
      navigate(PATH_DASHBOARD?.shipmentBuilding?.root);
    }
    else {
      const fetchDropdownData = async () => {
        await Promise.all([
          dispatch(getCustomerStationDropdown()),
          dispatch(getCarrierTerminalDropdown()),
          dispatch(getShipperDropdown()),
          dispatch(getConsigneeDropdown())
        ]);
      };
      fetchDropdownData();
    }
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

    if (watchedCarrierInfo?.selectCarrier) {
      setValue('carrierRates.pickUp.pickUpCarrier', watchedCarrierInfo.selectCarrier);
    }
    if (watchedCarrierInfo?.lineHaul?.carrier) {
      setValue('carrierRates.lineHaul.lineHaulCarrier', watchedCarrierInfo.lineHaul.carrier);
    }
    if (watchedCarrierInfo?.deliveryDetails?.carrier) {
      setValue('carrierRates.delivery.deliveryCarrier', watchedCarrierInfo.deliveryDetails.carrier);
    }
    // apply accessorial details
    if (watchedCarrierInfo?.pickupAccessorials?.length > 0) {
      const updatedPickupAcc = watchedCarrierInfo.pickupAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : (acc?.chargeType?.toLowerCase() === 'hourly') ? watchedCRPickupAccessorials?.[index]?.input || '' : '',
      }));
      setValue('carrierRates.pickUp.pickupAccessorials', updatedPickupAcc);
    }
    if (watchedCarrierInfo?.lineHaul?.linehaulAccessorials?.length > 0) {
      const updatedLineHaulAcc = watchedCarrierInfo.lineHaul.linehaulAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : (acc?.chargeType?.toLowerCase() === 'hourly') ? watchedCRLinehaulAccessorials?.[index]?.input || '' : '',
      }));
      setValue('carrierRates.lineHaul.lineHaulAccessorials', updatedLineHaulAcc);
    }
    if (watchedCarrierInfo?.deliveryDetails?.deliveryAccessorials?.length > 0) {
      const updatedDeliveryAcc = watchedCarrierInfo.deliveryDetails.deliveryAccessorials.map((acc, index) => ({
        ...acc,
        isManual: false,
        apiCharges: acc.chargeValue,
        input: (acc?.chargeType?.toLowerCase() === 'per_pound') ? (watchedHU[0].weightUnit === 'lbs') ? totals.totalWeight : `${(Number(totals.totalWeight) * 2.20462).toFixed(2)}` : (acc?.chargeType?.toLowerCase() === 'hourly') ? watchedCRDeliveryAccessorials?.[index]?.input || '' : '',
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
    if (type !== 'View' && type !== 'Edit') {
      setValue('carrierInfo.manualAddress.line1', watchedShipperAddr1 ?? '');
      setValue('carrierInfo.manualAddress.line2', watchedShipperAddr2 ?? '');
      setValue('carrierInfo.manualAddress.city', watchedShipperCity ?? '');
      setValue('carrierInfo.manualAddress.state', watchedShipperState ?? '');
      setValue('carrierInfo.manualAddress.zip', watchedShipperZip ?? '');
    }
    if (type === 'Edit' && !getValues('carrierInfo.isManualFromLocation')) {
      setValue('carrierInfo.manualAddress.line1', watchedShipperAddr1 ?? '');
      setValue('carrierInfo.manualAddress.line2', watchedShipperAddr2 ?? '');
      setValue('carrierInfo.manualAddress.city', watchedShipperCity ?? '');
      setValue('carrierInfo.manualAddress.state', watchedShipperState ?? '');
      setValue('carrierInfo.manualAddress.zip', watchedShipperZip ?? '');
    }
  }, [watchedShipperName?.shipperName, watchedShipperName?.airlineName, watchedShipperAddr1, watchedShipperAddr2, watchedShipperCity, watchedShipperZip, watchedShipperContact, watchedShipperPhone, watchedShipperState]);

  useEffect(() => {
    // Whenever any consignee detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedToLocationType === 'Consignee' && type !== 'View') {
      setValue('carrierInfo.toLocation', watchedConsigneeName?.consigneeName ?? watchedConsigneeName?.airlineName?.split('-')?.map(item => item.trim())?.[2] ?? watchedConsigneeName?.airlineName ?? '');
      setValue('carrierInfo.manualToAddress.line1', watchedConsigneeAddr1 ?? '');
      setValue('carrierInfo.manualToAddress.line2', watchedConsigneeAddr2 ?? '');
      setValue('carrierInfo.manualToAddress.city', watchedConsigneeCity ?? '');
      setValue('carrierInfo.manualToAddress.state', watchedConsigneeState ?? '');
      setValue('carrierInfo.manualToAddress.zip', watchedConsigneeZip ?? '');
    }
    if (watchedToLocationType === 'Consignee' && type === 'Edit' && !getValues('carrierInfo.isManualToLocation')) {
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
    if (watchedToLocationType === 'Carrier' && watchedToLocation && type !== 'View') {
      const [terminalId, carrierId] = watchedToLocation.split('-');
      const selectedObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
      );
      if (selectedObject) {
        if (!getValues('carrierInfo.isManualToLocation')) {
          setValue('carrierInfo.manualToAddress.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.manualToAddress.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.manualToAddress.city', selectedObject?.address?.city);
          setValue('carrierInfo.manualToAddress.state', selectedObject?.address?.state);
          setValue('carrierInfo.manualToAddress.zip', selectedObject?.address?.zipCode);
        }
        setValue('carrierInfo.lineHaul.carrier', watchedToLocation);
        if (!getValues('carrierInfo.lineHaul.manualFromLocation')) {
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
        }
      }
      if (selectedRouting === 'pickup_linehaul' && selectedObject) {
        setValue('carrierInfo.deliveryDetails.carrier', watchedToLocation);
        if (!getValues('carrierInfo.deliveryDetails.manualFromLocation')) {
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
        }
      }
    }
  }, [watchedToLocation,]);
  useEffect(() => {
    // Whenever any carrier detail changes, we can perform actions here
    // update manual to address of carrierinfo
    if (watchedLinehaulToLocationType === 'Carrier' && watchedLinehaulToLocation && type !== 'View') {
      const [terminalId, carrierId] = watchedLinehaulToLocation.split('-');
      const selectedObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
      );
      if (selectedObject) {
        if (!getValues('carrierInfo.lineHaul.manualToLocation')) {
          setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.lineHaul.manualToLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.lineHaul.manualToLocationDetails.state', selectedObject?.address?.state);
        }
        setValue('carrierInfo.deliveryDetails.carrier', watchedLinehaulToLocation);
        if (!getValues('carrierInfo.deliveryDetails.manualFromLocation')) {
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
          setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
        }
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
        if (getValues('carrierInfo.toLocationType') === 'Consignee' && type !== 'View') {
          if (!getValues('carrierInfo.isManualToLocation')) {
            setValue('carrierInfo.manualToAddress.line1', '');
            setValue('carrierInfo.manualToAddress.line2', '');
            setValue('carrierInfo.manualToAddress.city', '');
            setValue('carrierInfo.manualToAddress.state', '');
            setValue('carrierInfo.manualToAddress.zip', '');
          }
        }
        setValue('carrierInfo.toLocationType', 'Carrier');
      }
      if (selectedRouting === 'pickup_linehaul_delivery') {
        setValue('carrierInfo.toLocationType', 'Consignee');
        setValue('carrierInfo.pickupAgentTerminal', false);
      }
      if (selectedRouting === 'pickup_linehaul') {
        const [terminalId, carrierId] = watchedToLocation.split('-');
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject && type !== 'View') {
          setValue('carrierInfo.deliveryDetails.carrier', watchedToLocation);
          if (!getValues('carrierInfo.deliveryDetails.manualFromLocation')) {
            setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
            setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
            setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', selectedObject?.address?.city);
            setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
            setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', selectedObject?.address?.state);
          }
        }
        setValue('carrierInfo.pickupAgentTerminal', false);
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
  const watchedLinehaulAddAcc = useWatch({ control, name: "carrierInfo.lineHaul.linehaulAddAcc" });
  const watchedDeliveryAddAcc = useWatch({ control, name: "carrierInfo.deliveryDetails.deliveryAddAcc" });
  const watchedDeliveryAlert = useWatch({ control, name: "carrierInfo.deliveryDetails.deliveryAlert" });
  const watchedAirportPickupService = useWatch({ control, name: "airportPickupService" });
  const watchedAirportDeliveryService = useWatch({ control, name: "airportDeliveryService" });

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
    if (watchedPickupAgentTerminal && watchedLineHaulToggledAddress && type !== 'View') {
      if (watchedLineHaulToggledAddress === 'pickup') {
        const [terminalId, carrierId] = getValues('carrierInfo.selectCarrier').split('-');
        if (terminalId && carrierId) {
          const selectedObject = carrierTerminalDropdown.find(
            (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
          );
          setCarrierTerminalSelectError(false);
          if (!getValues('carrierInfo.lineHaul.manualFromLocation')) {
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
          }
        } else {
          setCarrierTerminalSelectError(true);
          if (!getValues('carrierInfo.lineHaul.manualFromLocation')) {
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', '');
          }
        }
      }
      if (watchedLineHaulToggledAddress === 'linehaul') {
        const [terminalId, carrierId] = getValues('carrierInfo.lineHaul.carrier').split('-');
        if (terminalId && carrierId) {
          const selectedObject = carrierTerminalDropdown.find(
            (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
          );
          setCarrierTerminalSelectError(false);
          if (!getValues('carrierInfo.lineHaul.manualFromLocation')) {
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', selectedObject?.address?.addressLine1);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', selectedObject?.address?.addressLine2);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', selectedObject?.address?.city);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', selectedObject?.address?.zipCode);
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', selectedObject?.address?.state);
          }
        } else {
          setCarrierTerminalSelectError(true);
          if (!getValues('carrierInfo.lineHaul.manualFromLocation')) {
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', '');
            setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', '');
          }
        }
      }
    }

  }, [watchedLineHaulToggledAddress, watchedSelectedLineHaulCarrier]);

  useEffect(() => {
    if (watchedSelectedPickupCarrier) {
      const [terminalId, carrierId] = typeof watchedSelectedPickupCarrier === 'string'
        ? watchedSelectedPickupCarrier.split('-')
        : [];

      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject?.carrierName?.includes('R&M')) {
          setValue('carrierInfo.pickupAlert', false);
          if (selectedObject?.carrierName?.includes('R&M'));
          else {
            setValue('carrierInfo.pickupAlert', true);
          }
        }
      }
    }
  }, [watchedSelectedPickupCarrier])
  // useeffect for updating primary mail and additional mails
  useEffect(() => {
    // updating primary mail
    if (watchedSelectedPickupCarrier) {
      const [terminalId, carrierId] = typeof watchedSelectedPickupCarrier === 'string'
        ? watchedSelectedPickupCarrier.split('-')
        : [];
      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject && Object.keys(selectedObject).length > 0 && type !== 'View') {
          setValue('carrierInfo.pickupAlertDetails.primaryEmail', selectedObject?.terminalEmail);
          setValue('carrierInfo.pickupAlertDetails.additionalEmailsArray', selectedObject?.emails);
        }
        if (selectedObject && Object.keys(selectedObject).length > 0 && type === 'Edit') {
          setValue('carrierInfo.pickupAlertDetails.primaryEmail', selectedShipmentBuildObj?.carrierDetails?.pickupDetails?.pickupAlertDetails?.emailInfo?.primaryEmail || selectedObject?.terminalEmail);
          setValue('carrierInfo.pickupAlertDetails.additionalEmailsArray', selectedShipmentBuildObj?.carrierDetails?.pickupDetails?.pickupAlertDetails?.emailInfo?.additionalEmails || selectedObject?.emails);
        }
      }
    }

    if (watchedSelectedDeliveryCarrier) {
      const [terminalId, carrierId] = watchedSelectedDeliveryCarrier.split('-');
      if (terminalId && carrierId) {
        const selectedObject = carrierTerminalDropdown.find(
          (item) => item.terminalId === Number(terminalId) && item.carrierId === Number(carrierId)
        );
        if (selectedObject && Object.keys(selectedObject).length > 0 && type !== 'View') {
          setValue('carrierInfo.deliveryDetails.primaryEmail', selectedObject?.terminalEmail);
          setValue('carrierInfo.deliveryDetails.additionalEmailsArray', selectedObject?.emails);
        }
        if (selectedObject && Object.keys(selectedObject).length > 0 && type === 'Edit') {
          setValue('carrierInfo.deliveryDetails.primaryEmail', selectedShipmentBuildObj?.carrierDetails?.deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.emailInfo?.primaryEmail || selectedObject?.terminalEmail);
          setValue('carrierInfo.deliveryDetails.additionalEmailsArray', selectedShipmentBuildObj?.carrierDetails?.deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.emailInfo?.additionalEmails || selectedObject?.emails);
        }
      }
    }

  }, [watchedSelectedPickupCarrier, watchedSelectedDeliveryCarrier])

  useEffect(() => {
    if (watchedOriginAirport?.length > 2) {
      dispatch(getShipperAirlineDropdown(watchedOriginAirport, ''));
    }
  }, [watchedOriginAirport])
  useEffect(() => {
    if (watchedDestinationAirport?.length > 2)
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
    } else {
      setCUSTOMER_MASTER_ACCESSORIALS([]);
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
      setIsSubmittingFinal(false);
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
  useEffect(() => {
    if (!watchedAddPickupAccessorial && activeStep === 3 && getValues('carrierInfo.pickupAccessorials')?.length > 0) {
      setAccCheckModal({
        open: true,
        acc: 'pickup'
      });
    }
  }, [watchedAddPickupAccessorial,]);
  useEffect(() => {
    if (!watchedLinehaulAddAcc && activeStep === 3 && getValues('carrierInfo.lineHaul.linehaulAccessorials')?.length > 0) {
      setAccCheckModal({
        open: true,
        acc: 'linehaul'
      });
    }
  }, [watchedLinehaulAddAcc,]);
  useEffect(() => {
    if (!watchedDeliveryAddAcc && activeStep === 3 && getValues('carrierInfo.deliveryDetails.deliveryAccessorials')?.length > 0) {
      setAccCheckModal({
        open: true,
        acc: 'delivery'
      });
    }
  }, [watchedDeliveryAddAcc,]);

  useEffect(() => {
    if ((type === 'View' || type === 'Edit') && (selectedShipmentBuildObj !== undefined || selectedShipmentBuildObj && Object.keys(selectedShipmentBuildObj).length > 0)) {
      updateControls(dispatch, setValue, selectedShipmentBuildObj, customerStationDropdown,
        shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown, carrierTerminalDropdown);
    }
  }, [type])
  useEffect(() => {
    if ((type === 'View' || type === 'Edit') && (selectedShipmentBuildObj !== undefined || selectedShipmentBuildObj && Object.keys(selectedShipmentBuildObj).length > 0)) {
      updateStep2Controls(dispatch, setValue, selectedShipmentBuildObj, customerStationDropdown,
        shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown, carrierTerminalDropdown);
    }
  }, [type, shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown, customerStationDropdown, carrierTerminalDropdown])

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
          <StepperHeader location={location} navigate={navigate} watchedCarrierInfoSubmit={watchedCarrierInfoSubmit}
            PATH_DASHBOARD={PATH_DASHBOARD}
            setHandleCancelModal={setHandleCancelModal}
            hasInitialData={hasInitialData}
            handleNext={handleNext}
            onFormSubmit={onFormSubmit}
            handleEditNext={handleEditNext}
            onFormEditSubmit={onFormEditSubmit}
            isPickupPending={isPickupPending}
            isSubmitting={isSubmitting} isSubmittingFinal={isSubmittingFinal}
            type={type}
            setDoDetailsModal={setDoDetailsModal}
            setCustomerRateModal={setCustomerRateModal}
            setOpenNotesDialog={setOpenNotesDialog}
            notesRef={notesRef}
            liveShipmentStatus={liveShipmentStatus}
            setShipmentStatusModal={setShipmentStatusModal}
            dispatch={dispatch}
            setValue={setValue}
            getValues={getValues}
            trigger={trigger}
            errors={errors}
            activeStep={activeStep}
            watchedServiceLevel={watchedServiceLevel}
            watchedAirportPickupService={watchedAirportPickupService}
            watchedAirportDeliveryService={watchedAirportDeliveryService}
            isHazmatSelected={isHazmatSelected}
            selectedRouting={selectedRouting}
            watchedLinehaulSelectRouting={watchedLinehaulSelectRouting}
            setErrorVisible={setErrorVisible}
            setErrorVisibleFields={setErrorVisibleFields}
            watchedSelectedPickupCarrier={watchedSelectedPickupCarrier}
            watchedSelectedLineHaulCarrier={watchedSelectedLineHaulCarrier}
            watchedSelectedDeliveryCarrier={watchedSelectedDeliveryCarrier}
            watchedToLocation={watchedToLocation}
            watchedLinehaulToLocation={watchedLinehaulToLocation}
            watchedDeliveryToLocation={watchedDeliveryToLocation}
            carrierTerminalDropdown={carrierTerminalDropdown}
            getZipToZipCarrierPickupRate={getZipToZipCarrierPickupRate}
            getZipToZipCarrierLinehaulRate={getZipToZipCarrierLinehaulRate}
            getZipToZipCarrierDeliveryRate={getZipToZipCarrierDeliveryRate}
            setIsSubmitting={setIsSubmitting} setIsSubmittingFinal={setIsSubmittingFinal}
            postStep1={postStep1}
            postNetworkShipment={postNetworkShipment}
            watchedOriginAirport={watchedOriginAirport}
            watchedDestinationAirport={watchedDestinationAirport}
            setActiveStep={setActiveStep}
            totals={totals}
            watchedLinehaulAddAcc={watchedLinehaulAddAcc}
            patchNetworkShipment={patchNetworkShipment}
          />
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
            type={type}
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
            watch={watch}
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
            <ActiveStep0 control={control} errors={errors} watchedServiceLevel={watchedServiceLevel} clearErrors={clearErrors} type={type} />
          )}
          {/* STEP 1 */}
          {activeStep === 1 && (
            <ActiveStep1 control={control} errors={errors} type={type}
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
              getValues={getValues}
              watch={watch} watchedShipperName={watchedShipperName}
              watchedConsigneeName={watchedConsigneeName}
            />
          )}
          {/* STEP 2 */}
          {activeStep === 2 && (
            <ActiveStep2
              type={type}
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
              trigger={trigger}
            />
          )}
          {/* STEP 3 */}
          {activeStep === 3 && (
            <>
              <ActiveStep3Pickup
                type={type}
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
                setCarrierPickupSearchValue={setCarrierPickupSearchValue}
                getValues={getValues}
                watchedLinehaulSelectRouting={watchedLinehaulSelectRouting}
                watchedAirportPickupService={watchedAirportPickupService}
                watchedAirportDeliveryService={watchedAirportDeliveryService}
                isHazmatSelected={isHazmatSelected}
                watchedSelectedPickupCarrier={watchedSelectedPickupCarrier}
                watchedSelectedLineHaulCarrier={watchedSelectedLineHaulCarrier}
                watchedSelectedDeliveryCarrier={watchedSelectedDeliveryCarrier}
                watchedToLocation={watchedToLocation}
                watchedLinehaulToLocation={watchedLinehaulToLocation}
                watchedDeliveryToLocation={watchedDeliveryToLocation}
                watchedOriginAirport={watchedOriginAirport}
                watchedDestinationAirport={watchedDestinationAirport}
                watchedLinehaulAddAcc={watchedLinehaulAddAcc}
              />
              {
                isPickupPending === false &&
                <ActiveStep3Linehaul type={type}
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
                  getValues={getValues}
                  watchedAirportPickupService={watchedAirportPickupService}
                  watchedAirportDeliveryService={watchedAirportDeliveryService}
                  isHazmatSelected={isHazmatSelected}
                  watchedSelectedLineHaulCarrier={watchedSelectedLineHaulCarrier}
                  watchedSelectedDeliveryCarrier={watchedSelectedDeliveryCarrier}
                  watchedLinehaulToLocation={watchedLinehaulToLocation}
                  watchedDeliveryToLocation={watchedDeliveryToLocation}
                  watchedOriginAirport={watchedOriginAirport}
                  watchedDestinationAirport={watchedDestinationAirport}
                />
              }
              {isPickupPending === false && <ActiveStep3Delivery type={type}
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
                watchedPickupAgentTerminal={watchedPickupAgentTerminal}
                getValues={getValues}
                watchedAirportPickupService={watchedAirportPickupService}
                watchedAirportDeliveryService={watchedAirportDeliveryService}
                isHazmatSelected={isHazmatSelected}
                watchedSelectedPickupCarrier={watchedSelectedPickupCarrier}
                watchedSelectedDeliveryCarrier={watchedSelectedDeliveryCarrier}
                watchedToLocation={watchedToLocation}
                watchedDeliveryToLocation={watchedDeliveryToLocation}
                watchedOriginAirport={watchedOriginAirport}
                watchedDestinationAirport={watchedDestinationAirport}
                watchedLinehaulAddAcc={watchedLinehaulAddAcc}
              />
              }
            </>
          )}
          {/* step 4 */}
          {
            activeStep === 4 && (
              <ActiveStep4 type={type}
                carrierRatesPickUpAccessorials={carrierRatesPickUpAccessorials}
                watchedCarrierRateInfo={watchedCarrierRateInfo}
                carrierTerminalDropdown={carrierTerminalDropdown}
                watchedSelectedPickupCarrier={watchedSelectedPickupCarrier}
                setValue={setValue}
                control={control}
                getValues={getValues}
                totals={totals}
                carrierRatesLineHaulAccessorials={carrierRatesLineHaulAccessorials}
                selectedRouting={selectedRouting}
                watchedLinehaulSelectRouting={watchedLinehaulSelectRouting}
                watchedSelectedLineHaulCarrier={watchedSelectedLineHaulCarrier}
                carrierRatesDeliveryAccessorials={carrierRatesDeliveryAccessorials}
                watchedSelectedDeliveryCarrier={watchedSelectedDeliveryCarrier}
                carrierRatesPickUpUpdateAccessorials={carrierRatesPickUpUpdateAccessorials}
                carrierRatesLineHaulUpdateAccessorials={carrierRatesLineHaulUpdateAccessorials}
                carrierRatesDeliveryUpdateAccessorials={carrierRatesDeliveryUpdateAccessorials}
                watchedCRPickupAccessorials={watchedCRPickupAccessorials}
                watchedCRLinehaulAccessorials={watchedCRLinehaulAccessorials}
                watchedCRDeliveryAccessorials={watchedCRDeliveryAccessorials}
              />
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
        <AccCheckDialog state={accCheckModal} setAccCheckModal={setAccCheckModal} setValue={setValue} watchedAddPickupAccessorial={watchedAddPickupAccessorial} watchedLinehaulAddAcc={watchedLinehaulAddAcc} watchedDeliveryAddAcc={watchedDeliveryAddAcc} />
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
              <NotesTableForAccessorials type={type} notes={notesRefArray.current} handleCloseConfirm={handleNotesCloseConfirmForShipmentAccs}
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
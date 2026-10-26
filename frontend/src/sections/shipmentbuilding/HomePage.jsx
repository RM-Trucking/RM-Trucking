import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// shared components
import Iconify from '../../components/iconify';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import ErrorFallback from '../shared/ErrorBoundary';
import { PATH_DASHBOARD } from '../../routes/paths';
import SharedSearchField from '../shared/SharedSearchField';
import ShipmentViewTable from './ShipmentViewTable';

import {
    setError, getCarrierTerminalDropdown, setSelectedShipmentBuildObj, setLineHaulSameDelDiff
} from '../../redux/slices/shipmentbuilding';
import WeightAlert from './WeightAlert';
import AddressAlert from './AddressAlert';
import ConsolidateFilterDialog from './ConsolidateFilterDialog';
// ----------------------------------------------------------------------

const commonBtnStyle = {

    height: '24px',

    fontWeight: 600,

    textTransform: 'none',

    borderRadius: '4px',

    boxShadow: 'none',

    px: 2,

    fontSize: '0.8rem',

};
const shipments = [
    {
        "shipmentId": 1161,
        "shipmentDetails": {
            "typeOfShipment": "AIR_IMPORT",
            "serviceLevel": "Dedicated Truck",
            "shipmentDate": "2026-10-05",
            "shipmentTime": null,
            "orderReceivedPickupPending": "N",
            "status": "ORDER_RECEIVED_PICKUP_SETUP",
            "shipmentProNumber": "S0000001161"
        },
        "customerDetails": {
            "customerInfoId": 998,
            "shipmentId": 1161,
            "customerId": 104,
            "stationId": 153,
            "originAirportCode": "",
            "destinationAirportCode": "",
            "airportPickupService": "N",
            "airportDeliveryService": "N",
            "customerName": "check cust 23",
            "shipperDetails": {
                "shipperId": 130,
                "shipperName": "shipper 434",
                "addressLine1": "Demo Address Line 1",
                "addressLine2": "Line 2",
                "city": "Demo city",
                "state": "Demo state",
                "zipCode": "12345",
                "contactPersonName": "d",
                "phoneNumber": "(222) 222-2222",
                "entityId": 5435
            },
            "consigneeDetails": {
                "consigneeId": 158,
                "consigneeName": "consignee 157",
                "addressLine1": "line 1",
                "addressLine2": "",
                "city": "city",
                "state": "state",
                "zipCode": "65756",
                "contactPersonName": "nm",
                "phoneNumber": "(659) 876-7868",
                "entityId": 5440
            }
        },
        "commodityDetails": {
            "commodityId": 876,
            "emergencyContactName": "",
            "emergencyContactPhone": "",
            "handlingUnits": [
                {
                    "handlingUnitId": 1373,
                    "shipmentId": 1161,
                    "handlingUnitUOM": "Crate",
                    "handlingUnits": "1",
                    "unit": "in",
                    "handlingLength": 0,
                    "handlingWidth": 0,
                    "handlingHeight": 0,
                    "handlingWeight": 2,
                    "handlingWeightUnit": "LB",
                    "class": "",
                    "palletDetails": [
                        {
                            "itemId": 1515,
                            "handlingUnitId": 1373,
                            "pieces": 1,
                            "piecesUOM": "Skid",
                            "description": "desc",
                            "hazmat": "N"
                        }
                    ],
                    "images": []
                }
            ]
        },
        "carrierDetails": {
            "pickupDetails": {
                "pickupInfoId": 1039,
                "shipmentId": 1161,
                "entityId": 5435,
                "pickupRouting": "PICKUP_LINE_HAUL",
                "airportTransfer": "N",
                "carrierId": 184,
                "carrierName": "Averitt Express",
                "terminalId": 527,
                "terminalName": "RIC",
                "carrierBillNumber": "567567",
                "fromLocationType": "Shipper",
                "fromLocation": "shipper 434",
                "fromLocationEntityId": 5435,
                "editFromLocation": "N",
                "pickupAgentTerminal": "N",
                "pickupAccessorial": "N",
                "pickupAlert": "N",
                "editFromLocationDetails": {
                    "addressLine1": "Demo Address Line 1",
                    "addressLine2": "Line 2",
                    "city": "Demo city",
                    "state": "Demo state",
                    "zipCode": "12345"
                },
                "pickupAgentTerminalDetails": {
                    "pickupAgentTerminalId": 783,
                    "shipmentId": 1161,
                    "toLocationType": "Carrier",
                    "toLocation": "Averitt Express",
                    "toLocationEntityId": 3408,
                    "editToLocation": "N",
                    "editToLocationDetails": {
                        "addressLine1": "1 Averitt Express Dr",
                        "addressLine2": "",
                        "city": "Nashville",
                        "state": "TN",
                        "zipCode": "37211"
                    }
                },
                "pickupAlertDetails": {
                    "pickupAlertId": 578,
                    "shipmentId": 1161,
                    "inboundNotes": null,
                    "emailInfo": {
                        "primaryEmail": "",
                        "additionalEmails": []
                    }
                }
            },
            "linehaulDetails": {
                "linehaulPrimaryInfo": {
                    "linehaulInfoId": 430,
                    "shipmentId": 1161,
                    "entityId": 6365,
                    "linehaulRouting": "LINE_HAUL_ONLY",
                    "carrierId": 184,
                    "terminalId": 214,
                    "carrierBillNumber": "57567",
                    "editFromLocation": "N",
                    "fromLocationType": "Carrier",
                    "fromLocation": "Carrier",
                    "fromLocationEntityId": 3408,
                    "editToLocation": "N",
                    "toLocationType": "Carrier",
                    "toLocation": "526-184",
                    "toLocationEntityId": 4840,
                    "etaDate": "2026-10-05",
                    "etaTime": null,
                    "pieces": null,
                    "weight": null,
                    "editFromLocationDetails": {
                        "addressLine1": "1 Averitt Express Dr",
                        "addressLine2": "",
                        "city": "Nashville",
                        "state": "TN",
                        "zipCode": "37211"
                    },
                    "editToLocationDetails": {
                        "addressLine1": "1005 Enterprise Cir",
                        "addressLine2": "",
                        "city": "Chesapeake",
                        "state": "VA",
                        "zipCode": "23321"
                    }
                },
                "linehaulCommonInfo": {
                    "linehaulCommonInfoId": 602,
                    "shipmentId": 1161,
                    "linehaulAccessorial": "N",
                    "linehaulNotes": ""
                }
            },
            "deliveryDetails": {
                "deliveryPrimaryInfo": {
                    "deliveryInfoId": 389,
                    "shipmentId": 1161,
                    "entityId": 6366,
                    "carrierId": 184,
                    "terminalId": 214,
                    "carrierBillNumber": "5657567",
                    "editFromLocation": "N",
                    "fromLocationType": "Carrier",
                    "fromLocation": "Carrier",
                    "fromLocationEntityId": 3408,
                    "editToLocation": "N",
                    "toLocationType": "Consignee",
                    "toLocation": "consignee 157",
                    "toLocationEntityId": 5440,
                    "etaDate": "2026-10-05",
                    "etaTime": null,
                    "pieces": null,
                    "weight": null,
                    "editFromLocationDetails": {
                        "addressLine1": "1 Averitt Express Dr",
                        "addressLine2": "",
                        "city": "Nashville",
                        "state": "TN",
                        "zipCode": "37211"
                    },
                    "editToLocationDetails": {
                        "addressLine1": "line 1",
                        "addressLine2": "",
                        "city": "city",
                        "state": "state",
                        "zipCode": "65756"
                    }
                },
                "deliveryCommonInfo": {
                    "deliveryCommonInfoId": 564,
                    "shipmentId": 1161,
                    "deliveryAccessorial": "N",
                    "airportTransfer": "Y",
                    "deliveryAlert": "N",
                    "deliveryAlertDetails": {
                        "deliveryAlertId": 461,
                        "shipmentId": 1161,
                        "linehaulNotes": null,
                        "deliveryNotes": null,
                        "emailInfo": {
                            "primaryEmail": null,
                            "additionalEmails": []
                        }
                    }
                }
            }
        }
    },
    {
        "shipmentId": 1109,
        "shipmentDetails": {
            "typeOfShipment": "AIR_EXPORT",
            "serviceLevel": "Dedicated Truck",
            "shipmentDate": "2026-09-17",
            "shipmentTime": null,
            "orderReceivedPickupPending": "N",
            "status": "ORDER_RECEIVED_PICKUP_SETUP",
            "shipmentProNumber": "S0000001109"
        },
        "customerDetails": {
            "customerInfoId": 952,
            "shipmentId": 1109,
            "customerId": 122,
            "stationId": 176,
            "originAirportCode": "LKML",
            "destinationAirportCode": "LMNL",
            "airportPickupService": "Y",
            "airportDeliveryService": "Y",
            "customerName": "Rajadurai S",
            "pickupAirlineDetails": {
                "airlineId": 184,
                "airlineNumber": 31,
                "airlineCode": "GL",
                "airportCode": "LKML",
                "airlineName": "Test 1",
                "addressLine1": "Test address 1",
                "addressLine2": "",
                "city": "Test city",
                "state": "Test State",
                "zipCode": "87976",
                "contactPersonName": "Shiva",
                "phoneNumber": "(897) 866-7632",
                "entityId": 6123,
                "scenarioType": "EXPORT"
            },
            "deliveryAirlineDetails": {
                "airlineId": 185,
                "airlineNumber": 32,
                "airlineCode": "GU",
                "airportCode": "LMNL",
                "airlineName": "Test 2",
                "addressLine1": "Test address 1",
                "addressLine2": "",
                "city": "Test city",
                "state": "Test state",
                "zipCode": "78767",
                "contactPersonName": "Prakash",
                "phoneNumber": "(987) 877-6588",
                "entityId": 6124,
                "scenarioType": "EXPORT"
            }
        },
        "commodityDetails": {
            "commodityId": 831,
            "emergencyContactName": "",
            "emergencyContactPhone": "",
            "handlingUnits": [
                {
                    "handlingUnitId": 1145,
                    "shipmentId": 1109,
                    "handlingUnitUOM": "Drum",
                    "handlingUnits": "4",
                    "unit": "in",
                    "handlingLength": 8,
                    "handlingWidth": 6,
                    "handlingHeight": 10,
                    "handlingWeight": 45,
                    "handlingWeightUnit": "LB",
                    "class": "Class 55",
                    "palletDetails": [
                        {
                            "itemId": 1263,
                            "handlingUnitId": 1145,
                            "pieces": 2,
                            "piecesUOM": "Drum",
                            "description": "Testing",
                            "hazmat": "N"
                        }
                    ],
                    "images": []
                }
            ]
        },
        "carrierDetails": {
            "pickupDetails": {
                "pickupInfoId": 832,
                "shipmentId": 1109,
                "entityId": 6125,
                "pickupRouting": "PICKUP_ONLY",
                "airportTransfer": "N",
                "carrierId": 263,
                "carrierName": "estest1",
                "terminalId": 521,
                "terminalName": "Terminal 001",
                "carrierBillNumber": "87676987",
                "fromLocationType": "Shipper",
                "fromLocation": "Test 1",
                "fromLocationEntityId": null,
                "editFromLocation": "N",
                "pickupAgentTerminal": "Y",
                "pickupAccessorial": "N",
                "pickupAlert": "N",
                "editFromLocationDetails": {
                    "addressLine1": "Test address 1",
                    "addressLine2": "",
                    "city": "Test city",
                    "state": "Test State",
                    "zipCode": "87976"
                },
                "pickupAgentTerminalDetails": {
                    "pickupAgentTerminalId": 576,
                    "shipmentId": 1109,
                    "toLocationType": "Carrier",
                    "toLocation": "estest1",
                    "toLocationEntityId": 4557,
                    "editToLocation": "N",
                    "editToLocationDetails": {
                        "addressLine1": "Add line 1",
                        "addressLine2": "Add line 2",
                        "city": "city1",
                        "state": "ST",
                        "zipCode": "12309"
                    }
                }
            },
            "linehaulDetails": {
                "linehaulPrimaryInfo": {
                    "linehaulInfoId": 304,
                    "shipmentId": 1109,
                    "entityId": 6126,
                    "linehaulRouting": "LINE_HAUL_ONLY",
                    "carrierId": 263,
                    "terminalId": 522,
                    "carrierBillNumber": "879776",
                    "editFromLocation": "N",
                    "fromLocationType": "Carrier",
                    "fromLocation": "",
                    "fromLocationEntityId": 4587,
                    "editToLocation": "N",
                    "toLocationType": "Carrier",
                    "toLocation": "236-243",
                    "toLocationEntityId": 3442,
                    "etaDate": "2026-09-17",
                    "etaTime": null,
                    "pieces": null,
                    "weight": null,
                    "editFromLocationDetails": {
                        "addressLine1": "Test 2",
                        "addressLine2": "Test 2",
                        "city": "Test 2",
                        "state": "Test 2",
                        "zipCode": "77678"
                    },
                    "editToLocationDetails": {
                        "addressLine1": "house of groom, lender group",
                        "addressLine2": "",
                        "city": "NewYork",
                        "state": "Arizona",
                        "zipCode": "60008"
                    }
                },
                "linehaulCommonInfo": {
                    "linehaulCommonInfoId": 435,
                    "shipmentId": 1109,
                    "linehaulAccessorial": "N",
                    "linehaulNotes": ""
                }
            },
            "deliveryDetails": {
                "deliveryPrimaryInfo": {
                    "deliveryInfoId": 317,
                    "shipmentId": 1109,
                    "entityId": 6128,
                    "carrierId": 243,
                    "terminalId": 236,
                    "carrierBillNumber": "768676",
                    "editFromLocation": "N",
                    "fromLocationType": "Carrier",
                    "fromLocation": "",
                    "fromLocationEntityId": 3442,
                    "editToLocation": "N",
                    "toLocationType": "Consignee",
                    "toLocation": "Test 2",
                    "toLocationEntityId": null,
                    "etaDate": "2026-09-17",
                    "etaTime": null,
                    "pieces": null,
                    "weight": null,
                    "editFromLocationDetails": {
                        "addressLine1": "house of groom, lender group",
                        "addressLine2": "",
                        "city": "NewYork",
                        "state": "Arizona",
                        "zipCode": "60008"
                    },
                    "editToLocationDetails": {
                        "addressLine1": "Test address 1",
                        "addressLine2": "",
                        "city": "Test city",
                        "state": "Test state",
                        "zipCode": "78767"
                    }
                },
                "deliveryCommonInfo": {
                    "deliveryCommonInfoId": 423,
                    "shipmentId": 1109,
                    "deliveryAccessorial": "N",
                    "airportTransfer": "N",
                    "deliveryAlert": "Y",
                    "deliveryAlertDetails": {
                        "deliveryAlertId": 339,
                        "shipmentId": 1109,
                        "linehaulNotes": "Please setup for pickup today ____ and drop to Forward Air",
                        "deliveryNotes": "Setup for pickup today ____ ",
                        "emailInfo": {
                            "primaryEmail": "gowthami@srinsofttech.com",
                            "additionalEmails": []
                        }
                    }
                }
            }
        }
    },
];
export default function HomePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const shipmentStatusOptions = [
        'Order received Pickup Pending',
        'Order received Pickup Setup',
        'Dispatched / RSL',
        'Picked',
        'At Warehouse',
        'To be recovered',
        'To be Routed',
        'Added to Queue',
        'Manifested',
        'Carrier Picked Up',
        'In Transit',
        'Delivered',
        'Appointment',
        'Recovered Short',
    ];
    const isLoading = useSelector((state) => state?.shipmentbuildingdata?.isLoading);
    const carrierTerminalDropdown = useSelector((state) => state?.shipmentbuildingdata?.carrierTerminalDropdown);
    const selectedShipments = useSelector((state) => state?.shipmentbuildingdata?.selectedShipments);
    const shipmentViewData = useSelector((state) => state?.shipmentbuildingdata?.shipmentViewData);
    const isSelectingCarrierRef = useRef(false);
    const [selectCarrierSearchValue, setSelectCarrierSearchValue] = useState('');
    const [showWeightLimitAlert, setShowWeightLimitAlert] = useState(false);
    const [showAddressAlert, setShowAddressAlert] = useState(false);
    const [showAddressAirportFlag, setShowAddressAirportFlag] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    // form values
    const {
        control,
        trigger,
        formState: { errors },
        reset,
        getValues, setValue, handleSubmit, watch
    } = useForm({
        mode: 'onChange',

        defaultValues: {
            shipmentStatus: '',
            customerReference: '',
            carrier: '',
            rmChecked: false,
            othersChecked: false,
            carrierRateReq: false,
            customerRateReq: false,
            consolidateFlag: false,
            routing: '',
            agent: '',
            customer: '',
            origin: '',
            originState: '',
            originCity: '',
            destination: '',
            destinationState: '',
            destinationCity: ''
        },

    });
    const watchedConsolidateFlag = watch('consolidateFlag');

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };

    const onClickOfNewDashboard = () => {
        dispatch(setSelectedShipmentBuildObj({}));
        // route to shipment
        navigate(PATH_DASHBOARD.shipmentBuilding.shipmentAdd);
    }

    const handleConsolidate = () => {
        if (selectedShipments?.length === 0) {
            setSnackbarOpen(true);
            setSnackbarMessage('Please select shipments to consolidate');
            return;
        }
        setSnackbarOpen(false);
        setSnackbarMessage('');
        const matchingShipments = shipmentViewData.filter((shipment) =>
            selectedShipments.includes(shipment?.shipmentId)
        );
        let consolidateValid = false;

        // ==========================================
        // HELPER FUNCTIONS FOR ADDRESS EXTRACTION
        // ==========================================
        const getShipperAddress = (shipment) => {
            const cust = shipment?.customerDetails;
            const addressSource = cust?.airportPickupService === 'Y'
                ? cust?.pickupAirlineDetails
                : cust?.shipperDetails;

            return {
                addressLine1: addressSource?.addressLine1?.trim() || '',
                addressLine2: addressSource?.addressLine2?.trim() || '',
                city: addressSource?.city?.trim() || '',
                state: addressSource?.state?.trim() || '',
                zipCode: addressSource?.zipCode?.trim() || '',
            };
        };
        const getConsigneeAddress = (shipment) => {
            const cust = shipment?.customerDetails;
            const addressDestSource = cust?.airportDeliveryService === 'Y'
                ? cust?.deliveryAirlineDetails
                : cust?.consigneeDetails;

            return {
                addressLine1: addressDestSource?.addressLine1?.trim() || '',
                addressLine2: addressDestSource?.addressLine2?.trim() || '',
                city: addressDestSource?.city?.trim() || '',
                state: addressDestSource?.state?.trim() || '',
                zipCode: addressDestSource?.zipCode?.trim() || '',
            };
        };
        const getEditToLocationAddress = (shipment) => {
            const locationSource = shipment?.carrierDetails?.pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails;

            return {
                addressLine1: locationSource?.addressLine1?.trim() || '',
                addressLine2: locationSource?.addressLine2?.trim() || '',
                city: locationSource?.city?.trim() || '',
                state: locationSource?.state?.trim() || '',
                zipCode: locationSource?.zipCode?.trim() || '',
            };
        };

        // ==========================================
        // FIRST CHECK: Validate Same Pickup Routing
        // ==========================================
        if (matchingShipments.length > 0) {
            // 1. Get the baseline routing from the very first selected shipment
            const firstRouting = matchingShipments[0]?.carrierDetails?.pickupDetails?.pickupRouting;

            // 2. Check if any other shipment has a different routing value
            const hasRoutingMismatch = matchingShipments.some((shipment) => {
                const currentRouting = shipment?.carrierDetails?.pickupDetails?.pickupRouting;
                return currentRouting !== firstRouting;
            });

            if (hasRoutingMismatch) {
                // Replace with your actual state setter for routing alerts
                setShowAddressAlert(true);
                consolidateValid = false;
                return; // Exit early since this is the first hard check
            } else {
                setShowAddressAlert(false);
                consolidateValid = true;

                // ==========================================
                // NEXT CHECK: when there is no routing mismatch then we start checking address
                // ==========================================

                // have to get the pickupRouting
                const validatedPickupRouting = firstRouting;

                if (validatedPickupRouting === "PICKUP_LINE_HAUL_DELIVERY") {
                    // ==========================================
                    //  CHECK: the shipper and consignee on the step 2 should be same with the address
                    // ==========================================

                    const firstShipper = getShipperAddress(matchingShipments[0]);
                    const firstShipperStr = JSON.stringify(firstShipper);

                    const hasShipperMismatch = matchingShipments.some((shipment) => {
                        return JSON.stringify(getShipperAddress(shipment)) !== firstShipperStr;
                    });

                    if (hasShipperMismatch) {
                        setShowAddressAlert(true);
                        consolidateValid = false;
                        return; // Stop execution on shipper mismatch
                    }

                    // ==========================================
                    //  CHECK: the consignee on the step 2 should be same with the address if there is no mismatch on pickup
                    // ==========================================

                    const firstConsignee = getConsigneeAddress(matchingShipments[0]);
                    const firstConsigneeStr = JSON.stringify(firstConsignee);

                    const hasConsigneeMismatch = matchingShipments.some((shipment) => {
                        return JSON.stringify(getConsigneeAddress(shipment)) !== firstConsigneeStr;
                    });

                    if (hasConsigneeMismatch) {
                        setShowAddressAlert(true);
                        consolidateValid = false;
                        return; // Stop execution on consignee mismatch
                    }
                }
                if (validatedPickupRouting === "PICKUP_LINE_HAUL") {
                    // 1. Validate Shipper Addresses match
                    const firstShipper = getShipperAddress(matchingShipments[0]);
                    const firstShipperStr = JSON.stringify(firstShipper);

                    const hasShipperMismatch = matchingShipments.some((shipment) => {
                        return JSON.stringify(getShipperAddress(shipment)) !== firstShipperStr;
                    });

                    if (hasShipperMismatch) {
                        setShowAddressAlert(true);
                        consolidateValid = false;
                        return;
                    }

                    // NEW CHECK: Validate editToLocationDetails match across all shipments
                    const firstEditLocation = getEditToLocationAddress(matchingShipments[0]);
                    const firstEditLocationStr = JSON.stringify(firstEditLocation);

                    const hasEditLocationMismatch = matchingShipments.some((shipment) => {
                        return JSON.stringify(getEditToLocationAddress(shipment)) !== firstEditLocationStr;
                    });

                    if (hasEditLocationMismatch) {
                        setShowAddressAlert(true);
                        consolidateValid = false;
                        return; // Stop execution if edit location details do not match
                    }
                }
                if (validatedPickupRouting === "PICKUP_ONLY") {
                    // ==========================================
                    // NEXT CHECK: check for linehaul routing
                    // ==========================================
                    const secondRouting = matchingShipments[0]?.carrierDetails?.linehaulDetails?.linehaulPrimaryInfo?.linehaulRouting;

                    // 2. Check if any other shipment has a different routing value
                    const hasLinehaulRoutingMismatch = matchingShipments.some((shipment) => {
                        const currentRouting = shipment?.carrierDetails?.linehaulDetails?.linehaulPrimaryInfo?.linehaulRouting;
                        return currentRouting !== secondRouting;
                    });

                    if (hasLinehaulRoutingMismatch) {
                        // Replace with your actual state setter for routing alerts
                        setShowAddressAlert(true);
                        consolidateValid = false;
                        return; // Exit early since this is the first hard check
                    }

                    const validatedLinehaulRouting = secondRouting;

                    if (validatedLinehaulRouting === 'LINE_HAUL_ONLY') {
                        // ==========================================
                        // NEXT CHECK: check for airport origin and destination codes
                        // ==========================================

                        const firstOriginAirport = matchingShipments[0]?.customerDetails?.originAirportCode;
                        const firstDestAirport = matchingShipments[0]?.customerDetails?.destinationAirportCode;

                        // Check if airport codes are present on the baseline shipment
                        if (firstOriginAirport || firstDestAirport) {
                            // Case A: Airport codes exist -> Validate they match across all shipments
                            const hasAirportMismatch = matchingShipments.some((shipment) => {
                                const currentOrigin = shipment?.customerDetails?.originAirportCode;
                                const currentDest = shipment?.customerDetails?.destinationAirportCode;
                                return currentOrigin !== firstOriginAirport || currentDest !== firstDestAirport;
                            });

                            if (hasAirportMismatch) {
                                setShowAddressAirportFlag(true);
                                setShowAddressAlert(true);
                                consolidateValid = false;
                                return; // Exit early if carrier or terminal IDs do not align
                            } else {
                                setShowAddressAirportFlag(false);
                            }
                        }

                        // additional check for delivery addressess - whether all delivery address are same or not
                        // Helper function to extract and format the required data safely
                        const getComparisonString = (shipment) => {
                            const info = shipment?.carrierDetails?.deliveryDetails?.deliveryPrimaryInfo;

                            if (!info) return null;

                            // Create a normalized object with just the fields you want to compare
                            const targetData = {
                                carrierId: info.carrierId,
                                terminalId: info.terminalId,
                                location: {
                                    addressLine1: info.editFromLocationDetails?.addressLine1,
                                    addressLine2: info.editFromLocationDetails?.addressLine2,
                                    city: info.editFromLocationDetails?.city,
                                    state: info.editFromLocationDetails?.state,
                                    zipCode: info.editFromLocationDetails?.zipCode,
                                }
                            };

                            // Convert to a string so we can easily compare deep nested objects
                            return JSON.stringify(targetData);
                        };

                        // Get the comparison string of the very first shipment to use as a baseline
                        const baselineString = getComparisonString(matchingShipments[0]);

                        // Check if every single shipment matches the baseline string
                        const allMatch = matchingShipments.every(shipment => {
                            return getComparisonString(shipment) === baselineString;
                        });

                        // Log the result based on the comparison
                        if (allMatch) {
                            dispatch(setLineHaulSameDelDiff(false));
                        } else {
                            dispatch(setLineHaulSameDelDiff(true));
                        }

                        // Reset alert state if routing and airport/carrier structures are completely aligned
                        setShowAddressAlert(false);

                    }

                    if (validatedLinehaulRouting === 'LINE_HAUL_DELIVERY') {
                        const firstCarrierId = matchingShipments[0]?.carrierDetails?.pickupDetails?.carrierId;
                        const firstTerminalId = matchingShipments[0]?.carrierDetails?.pickupDetails?.terminalId;

                        const hasCarrierTerminalMismatch = matchingShipments.some((shipment) => {
                            const currentCarrierId = shipment?.carrierDetails?.pickupDetails?.carrierId;
                            const currentTerminalId = shipment?.carrierDetails?.pickupDetails?.terminalId;
                            return currentCarrierId !== firstCarrierId || currentTerminalId !== firstTerminalId;
                        });

                        if (hasCarrierTerminalMismatch) {
                            setShowAddressAlert(true);
                            consolidateValid = false;
                            return; // Exit early if carrier or terminal IDs do not align
                        }
                    }
                }

            }
        } else {
            setShowAddressAlert(false);
            consolidateValid = false;
            return; // Exit early if no shipments are selected
        }

        // ==========================================
        // SECOND CHECK: Total Weight Validation
        // ==========================================
        const totalHandlingWeight = matchingShipments.reduce((sum, shipment) => {
            const handlingUnits = shipment?.commodityDetails?.handlingUnits;

            if (Array.isArray(handlingUnits)) {
                handlingUnits.forEach((unit) => {
                    const weight = parseFloat(unit?.handlingWeight) || 0;
                    sum += weight;
                });
            }
            return sum;
        }, 0);

        // Note: parseFloat used here because toFixed(2) returns a string
        if (parseFloat(totalHandlingWeight.toFixed(2)) > 5000) {
            setShowWeightLimitAlert(true);
            consolidateValid = false;
        } else {
            setShowWeightLimitAlert(false);
            consolidateValid = true;
        }
        // ==========================================
        // ROUTING: If all checks pass
        // ==========================================
        if (consolidateValid) {
            navigate(PATH_DASHBOARD.shipmentBuilding.consolidatedView);
        }
    }
    const handleConsolidateFinal = () => {
        console.log("handleConsolidateBuild");
    }

    useEffect(() => {
        dispatch(getCarrierTerminalDropdown());
    }, [])


    return (
        <>
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={logError}
                onReset={() => {
                    // Optional: reset app state here if necessary before retry
                    console.log("Error boundary reset triggered");
                }}
            >
                {/* The components within this boundary are protected */}
                <SharedHomePageHeader title="Shipment Building" buttonText='New Shipment' onButtonClick={onClickOfNewDashboard} />
                

                <ShipmentViewTable watchedConsolidateFlag={watchedConsolidateFlag} control={control}
                    setValue={setValue} getValues={getValues} />
                <WeightAlert
                    open={showWeightLimitAlert}
                    onClose={() => setShowWeightLimitAlert(false)}
                    title="Alert"
                    message="LTL is over 5000 lbs"
                />
                <AddressAlert
                    open={showAddressAlert}
                    onClose={() => setShowAddressAlert(false)}
                    showAddressAirportFlag={showAddressAirportFlag}
                />
                <ConsolidateFilterDialog
                    open={isDialogOpen}
                    handleClose={() => setIsDialogOpen(false)}
                    control={control}
                    errors={errors}
                    handleSubmit={handleSubmit}
                    onSubmit={(data) => {
                        console.log("Form values captured directly from Hook Form state: ", data);
                        if (data.routing) {
                            setValue('consolidateFlag', true);
                        } else {
                            setValue('consolidateFlag', false);
                        }
                        // Add your filter API trigger logic here...
                        setIsDialogOpen(false);
                    }}
                />
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => {
                        setSnackbarOpen(false);
                        setSnackbarMessage('');
                    }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => {
                            setSnackbarOpen(false);
                            setSnackbarMessage('');
                        }}
                        severity="error"
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </ErrorBoundary>

        </>
    );
}


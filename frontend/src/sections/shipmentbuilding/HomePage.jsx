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


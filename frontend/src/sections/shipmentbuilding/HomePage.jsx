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
    setError, getCarrierTerminalDropdown, setSelectedShipmentBuildObj
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
                        // not needed
                        // else {
                        //     // Case B: No airport codes exist -> Fallback to carrierId and terminalId check
                        //     const firstCarrierId = matchingShipments[0]?.carrierDetails?.pickupDetails?.carrierId;
                        //     const firstTerminalId = matchingShipments[0]?.carrierDetails?.pickupDetails?.terminalId;

                        //     const hasCarrierTerminalMismatch = matchingShipments.some((shipment) => {
                        //         const currentCarrierId = shipment?.carrierDetails?.pickupDetails?.carrierId;
                        //         const currentTerminalId = shipment?.carrierDetails?.pickupDetails?.terminalId;
                        //         return currentCarrierId !== firstCarrierId || currentTerminalId !== firstTerminalId;
                        //     });

                        //     if (hasCarrierTerminalMismatch) {
                        //         setShowAddressAlert(true);
                        //         consolidateValid = false;
                        //         return; // Exit early if carrier or terminal IDs do not align
                        //     }
                        // }

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
                <Stack
                    direction={{ xs: 'column', md: 'row' }} // Stacks vertically on mobile, horizontally on desktop
                    spacing={1}                            // Safely manages gaps between fields
                    sx={{
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Field 1: Shipment Status */}
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0px' }, minWidth: { md: '180px' } }}>
                        <Controller
                            name="shipmentStatus"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField {...field} select fullWidth label="Select Shipment Status" variant="standard" error={!!errors.shipmentStatus} /* ... Rest of your SelectProps */>
                                    {shipmentStatusOptions.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                </StyledTextField>
                            )}
                        />
                    </Box>

                    {/* Field 2: Customer Reference */}
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0px' }, minWidth: { md: '180px' } }}>
                        <Controller
                            name="customerReference"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Customer Reference #" variant="standard" error={!!errors.customerReference} />
                            )}
                        />
                    </Box>

                    {/* Field 3: Carrier Autocomplete */}
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0px' }, minWidth: { md: '180px' } }}>
                        <Controller
                            name="carrier"
                            control={control}
                            render={({ field: { onChange, value, ref, ...fieldProps } }) => (
                                <Autocomplete
                                    {...fieldProps}
                                    fullWidth
                                    options={carrierTerminalDropdown || []}

                                    // Generates explicit, unique keys for each option item
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

                                    // Ensures accurate component highlighting matching values
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
                                        isSelectingCarrierRef.current = true;
                                        const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
                                        onChange(formValue);
                                    }}

                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason !== "reset") {
                                            setSelectCarrierSearchValue(newInputValue);
                                        }
                                    }}

                                    loading={isLoading}
                                    loadingText="Searching carriers..."

                                    // Added your conditional empty results messaging
                                    noOptionsText={selectCarrierSearchValue ? "No carriers found" : "Type to search for carriers"}

                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            inputRef={ref} // Keeps React Hook Form validation focus operational
                                            variant="standard"
                                            label="Select Carrier"
                                            error={!!errors.carrier}
                                            // Added space layout preservation helper text rule
                                            helperText={errors.carrier ? errors.carrier.message : ' '}
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
                    </Box>


                </Stack>
                {/* Actions Section Container */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={'space-between'}
                    sx={{
                        gap: 1 // Cleaner approach for responsive button gaps
                    }}
                >
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent={'flex-start'}>
                            {/* Checkbox: R&M */}
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="rmChecked"
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
                                    label={<Typography onClick={(e) => e.preventDefault()} // 👈 Prevents the text click from toggling the checkbox
                                        sx={{                 // 👈 Maintained your custom font weight
                                            cursor: 'default'                  // 👈 Optional: Changes cursor to regular text arrow
                                        }} variant="body2">R&M</Typography>}
                                />
                            </Box>
                            {/* Checkbox: Others */}
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="othersChecked"
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
                                    label={<Typography onClick={(e) => e.preventDefault()} // 👈 Prevents the text click from toggling the checkbox
                                        sx={{                 // 👈 Maintained your custom font weight
                                            cursor: 'default'                  // 👈 Optional: Changes cursor to regular text arrow
                                        }} variant="body2">Others</Typography>}
                                />
                            </Box>
                        </Stack>
                        <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent={'flex-start'} sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'max-content' }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="carrierRateReq"
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
                                    label={
                                        <Typography
                                            onClick={(e) => e.preventDefault()}
                                            variant="body2"
                                            sx={{
                                                cursor: 'default',
                                                whiteSpace: 'nowrap' // 👈 Forces the text to stay in a straight line
                                            }}
                                        >
                                            Carrier Rate Req
                                        </Typography>
                                    }
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'max-content' }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="customerRateReq"
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
                                    label={
                                        <Typography
                                            onClick={(e) => e.preventDefault()}
                                            variant="body2"
                                            sx={{
                                                cursor: 'default',
                                                whiteSpace: 'nowrap' // 👈 Forces the text to stay in a straight line
                                            }}
                                        >
                                            Customer Rate Req
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Stack>
                    </Stack>
                    <Stack direction={'column'} spacing={1} alignItems={'flex-start'}>
                        <Stack direction={'row'} alignItems={'center'} sx={{
                            gap: 1 // Cleaner approach for responsive button gaps
                        }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setIsDialogOpen(true);
                                }}
                                sx={{
                                    ...commonBtnStyle,
                                    bgcolor: '#a22',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'max-content',
                                    flex: { xs: '1 1 auto', sm: '0 0 auto' }, // Lets buttons comfortably stretch on mobile but stay compact on desktop
                                    '&:hover': { bgcolor: '#811' }
                                }}
                            >
                                Consolidate Filter
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleConsolidate}
                                sx={{
                                    ...commonBtnStyle,
                                    bgcolor: '#a22',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'max-content',
                                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                                    '&:hover': { bgcolor: '#811' }
                                }}
                            >
                                Consolidate Build
                            </Button>
                        </Stack>
                        <SharedSearchField page="shipmentbuilding" />
                    </Stack>
                </Stack>

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


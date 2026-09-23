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
    // form values
    const {
        control,
        trigger,
        formState: { errors },
        reset,
        getValues, setValue, handleSubmit
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

        },

    });

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
        const matchingShipments = shipmentViewData.filter((shipment) =>
            selectedShipments.includes(shipment?.shipmentId)
        );

        const totalHandlingWeight = matchingShipments.reduce((sum, shipment) => {
            // 1. Safely access the handlingUnits array inside commodityDetails
            const handlingUnits = shipment?.commodityDetails?.handlingUnits;

            // 2. Loop through handlingUnits if it exists and add weights to our accumulator
            if (Array.isArray(handlingUnits)) {
                handlingUnits.forEach((unit) => {
                    // Parse as float to prevent string concatenation bugs, fallback to 0 if null/missing
                    const weight = parseFloat(unit?.handlingWeight) || 0;
                    sum += weight;
                });
            }

            return sum;
        }, 0);
        if (totalHandlingWeight.toFixed(2) > 5000) {
            setShowWeightLimitAlert(true);
        } else {
            setShowWeightLimitAlert(false);
        }

        // Ensure we have at least one shipment to compare against
        if (matchingShipments.length > 0) {
            // 1. Helper function to extract the correct address object based on your conditional logic
            const getTargetAddress = (shipment) => {
                const cust = shipment?.customerDetails;
                // Conditional routing rule for the address object
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

            // 2. Extract the baseline reference address from the first shipment object
            const firstAddress = getTargetAddress(matchingShipments[0]);
            const firstAddressStr = JSON.stringify(firstAddress);

            // 3. Loop through every shipment to check if any address doesn't match the baseline
            const hasMismatch = matchingShipments.some((shipment) => {
                const currentAddress = getTargetAddress(shipment);
                return JSON.stringify(currentAddress) !== firstAddressStr;
            });

            // 4. Update your alert state based on the result
            setShowAddressAlert(hasMismatch);
        } else {
            // Reset alert state if no items are selected
            setShowAddressAlert(false);
        }

        if (!showWeightLimitAlert && !showAddressAlert) {
            navigate(PATH_DASHBOARD.shipmentBuilding.consolidatedView);
        }

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
                <ShipmentViewTable />
                <WeightAlert
                    open={showWeightLimitAlert}
                    onClose={() => setShowWeightLimitAlert(false)}
                    title="Alert"
                    message="LTL is over 5000 lbs"
                />
                <AddressAlert
                    open={showAddressAlert}
                    onClose={() => setShowAddressAlert(false)}
                />
            </ErrorBoundary>

        </>
    );
}


import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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
import ShipmentManifestedDialog from './ShipmentManifestedDialog';


const ConsolidateStepper = ({ location, navigate, watchedCarrierInfoSubmit,
    PATH_DASHBOARD,
    setHandleCancelModal,
    hasInitialData,
    handleNext,
    onFormSubmit,
    handleConsolidatedNext,
    onFormEditSubmit,
    isPickupPending,
    isSubmitting,
    isSubmittingFinal,
    type,
    setDoDetailsModal,
    setCustomerRateModal,
    setOpenNotesDialog,
    notesRef,
    liveShipmentStatus,
    setShipmentStatusModal,
    dispatch,
    setValue,
    getValues,
    trigger,
    errors,
    activeStep,
    watchedServiceLevel,
    watchedAirportPickupService,
    watchedAirportDeliveryService,
    isHazmatSelected,
    selectedRouting,
    watchedLinehaulSelectRouting,
    setErrorVisible,
    setErrorVisibleFields,
    watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier,
    watchedSelectedDeliveryCarrier,
    watchedToLocation,
    watchedLinehaulToLocation,
    watchedDeliveryToLocation,
    carrierTerminalDropdown,
    getZipToZipCarrierPickupRate,
    getZipToZipCarrierLinehaulRate,
    getZipToZipCarrierDeliveryRate,
    setIsSubmitting,
    setIsSubmittingFinal,
    postStep1,
    postNetworkShipment,
    watchedOriginAirport,
    watchedDestinationAirport,
    setActiveStep,
    totals,
    watchedLinehaulAddAcc, patchNetworkShipment, watch, getZipToZipCustomerRate, replaceSelectedLinehaulDetailsList,
    watchedCRLinehaulAccessorials, totalConsolWeight, selectedShipmentObjects, selectedLinehaulDetailsList, 

}) => {
    const [manifestDialogOpen, setManifestDialogOpen] = useState(false);
    const selectedShipmentBuildObj = useSelector((state) => state?.shipmentbuildingdata?.selectedShipmentBuildObj);
    const shipmentError = useSelector((state) => state?.shipmentdata?.error);
    const consolidatedFilterObj = useSelector((state) => state?.shipmentbuildingdata?.consolidatedFilterObj);
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
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
    const STEPS = [
        'Carrier Information',
        'Carrier Rate'
    ];
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
    const commonBtnStyle = {
        height: '24px',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: '4px',
        boxShadow: 'none',
        px: 2,
        fontSize: '0.8rem',
    };
    const handleBack = () => {
        console.log('Current Form Values:', getValues());
        setActiveStep((prev) => prev - 1);
    };
    const valueStyle = { fontSize: '0.85rem', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap' };
    const labelStyle = { fontSize: '0.75rem', color: '#555' };

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={() => {
                // Optional: reset app state here if necessary before retry
                console.log("Error boundary reset triggered");
            }}
        >
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 4 }}>

                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                        connector={<CustomConnector />} // Optional: for the thick red/black line
                        sx={{ alignItems: 'center', flexGrow: 1, '& .MuiStepLabel-root': { padding: 0 } }}
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
                        
                        {activeStep > 0 && (

                            <Button variant="outlined" onClick={handleBack} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Back</Button>

                        )}

                        {/* Conditional Submit Button for Step 3 */}
                        
                            <Button
                                variant="contained"
                                onClick={() => {
                               console.log('Received prop function:', typeof handleConsolidatedNext);
                                        handleConsolidatedNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                            watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                            setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                            watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                            getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                            watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type, selectedShipmentBuildObj, patchNetworkShipment, getZipToZipCustomerRate,
                                            consolidatedFilterObj, replaceSelectedLinehaulDetailsList, watchedCRLinehaulAccessorials, totalConsolWeight, selectedShipmentObjects, selectedLinehaulDetailsList, 
                                        )
                          
                                }}
                                sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                                disabled={shipmentError}
                            >
                               Next
                            </Button>
                        

                    </Box>
                </Box>

                <ShipmentManifestedDialog open={manifestDialogOpen} handleClose={() => setManifestDialogOpen(false)} />
            </Box>
        </ErrorBoundary>
    );
};
export default ConsolidateStepper; 
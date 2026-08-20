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
import BillOfLadingAuto from './BillOfLadingAuto';


const StepperHeader = ({ location, navigate, watchedCarrierInfoSubmit,
    PATH_DASHBOARD,
    setHandleCancelModal,
    hasInitialData,
    handleNext,
    onFormSubmit,
    handleEditNext,
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
    watchedLinehaulAddAcc,
}) => {
    const contentRef = useRef(null);
    const selectedShipmentBuildObj = useSelector((state) => state?.shipmentbuildingdata?.selectedShipmentBuildObj);
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
        'Shipment Details',
        'Customer Details',
        'Commodities Details',
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
        if (activeStep === 2 && hasInitialData(getValues)) {
            const currentValues = getValues();
            setValue('doDetails.handlingUnits', currentValues.handlingUnits);
            setValue('doDetails.emergencyContactName', currentValues.emergencyContactName);
            setValue('doDetails.emergencyContactPhone', currentValues.emergencyContactPhone);
        }
    };
    const valueStyle = { fontSize: '0.85rem', fontWeight: 'bold', color: '#000' };
    const labelStyle = { fontSize: '0.75rem', color: '#555' };
    const [isSubmittingWithLinehaul, setIsSubmittingWithLinehaul] = useState(false);

    useEffect(() => {
        if (watchedCarrierInfoSubmit && type !== 'Edit') {
            handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type
            );
        }
        if (watchedCarrierInfoSubmit && type === 'Edit') {
            handleEditNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type, selectedShipmentBuildObj,
            );
        }
    }, [watchedCarrierInfoSubmit])

    const handlePrint = useReactToPrint({
        contentRef, documentTitle: `Bill_of_Lading_${selectedShipmentBuildObj?.shipmentId}`
    })

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
                        <Typography variant="subtitle2" fontWeight="bold">{type === 'Add' ? 'New Shipment' : type === 'Edit' ? 'Edit Shipment' : "View Shipment"}</Typography>
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
                        {type !== 'View' && <Button variant="outlined" onClick={() => {
                            setHandleCancelModal(true);
                        }} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Cancel</Button>}

                        {activeStep > 0 && (

                            <Button variant="outlined" onClick={handleBack} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Back</Button>

                        )}

                        {/* Conditional Submit Button for Step 3 */}
                        {
                            type !== 'View' && activeStep !== 3 && <Button
                                variant="contained"
                                onClick={() => {
                                    if (type !== 'Edit') {
                                        handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                            watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                            setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                            watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                            getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                            watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type
                                        )
                                    } else if (type === 'Edit') {
                                        handleEditNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                            watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                            setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                            watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                            getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                            watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type, selectedShipmentBuildObj,
                                        )
                                    }
                                }}
                                sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
                            >
                                {activeStep === STEPS.length - 1 ? isSubmittingFinal ? 'Submitting...' : 'Submit' : 'Next'}
                            </Button>
                        }
                        {type !== 'View' && activeStep === 3 && isPickupPending &&
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (type !== 'Edit') {
                                        onFormSubmit(dispatch, setValue, getValues, trigger, errors,
                                            activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                                            selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                                            watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                                            carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                                            setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending)
                                    } else if (type === 'Edit') {
                                        onFormEditSubmit(dispatch, setValue, getValues, trigger, errors,
                                            activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                                            selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                                            watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                                            carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                                            setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending, selectedShipmentBuildObj)
                                    }
                                }}
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
                            type !== 'View' && activeStep === 3 && selectedRouting === 'pickup_only' && getValues('carrierInfo.selectCarrier') && !isPickupPending && watchedLinehaulSelectRouting === '' &&
                            <>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        if (type !== 'Edit') {
                                            onFormSubmit(dispatch, setValue, getValues, trigger, errors,
                                                activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                                                selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                                                watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                                                carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                                                setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending)
                                        } else if (type === 'Edit') {
                                            onFormEditSubmit(dispatch, setValue, getValues, trigger, errors,
                                                activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
                                                selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
                                                watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
                                                carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
                                                setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending, selectedShipmentBuildObj)
                                        }
                                    }}
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
                            type !== 'View' && activeStep === 3 && !isPickupPending && <Button
                                variant="contained"
                                onClick={() => {
                                    if (type !== 'Edit') {
                                        handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                            watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                            setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                            watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                            getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                            watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type,
                                        )
                                    } else if (type === 'Edit') {
                                        handleEditNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                            watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                            setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                            watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                            getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                            watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type, selectedShipmentBuildObj
                                        )
                                    }
                                }}
                                disabled={isSubmittingFinal}
                                sx={{
                                    ...commonBtnStyle,
                                    bgcolor: '#a22',
                                    '&:hover': { bgcolor: '#811' },
                                    '&:disabled': { bgcolor: '#cca' }
                                }}
                            >
                                {isSubmittingFinal ? 'Submitting...' : activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                            </Button>
                        }
                        {type === 'View' && activeStep !== 4 && (

                            <Button variant="outlined" onClick={() => handleNext(dispatch, setValue, getValues, trigger, errors, activeStep, watchedServiceLevel, watchedAirportPickupService,
                                watchedAirportDeliveryService, isHazmatSelected, selectedRouting, watchedLinehaulSelectRouting,
                                setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier, watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier,
                                watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation, carrierTerminalDropdown,
                                getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate, setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport,
                                watchedDestinationAirport, setActiveStep, totals, watchedLinehaulAddAcc, type
                            )} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Next</Button>

                        )}
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
                {
                    type === 'Edit' && <Box display={'flex'} alignItems={'center'} justifyContent={'flex-end'}>
                        <Button variant="contained" onClick={handlePrint} sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}>BOL</Button>
                    </Box>
                }
                <div style={{ display: 'none' }}>
                    <div ref={contentRef} className='bol-print-wrapper'>
                        <BillOfLadingAuto data={selectedShipmentBuildObj} />
                    </div>
                </div>
            </Box>
        </ErrorBoundary>
    );
};
export default StepperHeader; 
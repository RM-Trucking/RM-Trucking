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
import ConsolidateCarrierRateSection from './ConsolidateCarrierRateSection';



const ConsolidateCarrierHmPage = ({ type,
    carrierRatesPickUpAccessorials,
    watchedCarrierRateInfo,
    carrierTerminalDropdown,
    watchedSelectedPickupCarrier,
    setValue,
    control,
    getValues,
    totals,
    carrierRatesLineHaulAccessorials,
    selectedRouting,
    watchedLinehaulSelectRouting,
    watchedSelectedLineHaulCarrier,
    carrierRatesDeliveryAccessorials,
    watchedSelectedDeliveryCarrier,
    carrierRatesPickUpUpdateAccessorials,
    carrierRatesLineHaulUpdateAccessorials,
    carrierRatesDeliveryUpdateAccessorials,
    watchedCRPickupAccessorials,
    watchedCRLinehaulAccessorials,
    watchedCRDeliveryAccessorials,
    carrierPickupApprovalRateHistory,
    carrierLinehaulApprovalRateHistory,
    carrierDeliveryApprovalRateHistory,
    carrierPickupRateNotesArr,
    appendCarrierPickupRateNotesArr,
    currentCarrierPickupNoteText,
    carrierLinehaulRateNotesArr,
    appendCarrierLinehaulRateNotesArr,
    currentCarrierLinehaulNoteText,
    carrierDeliveryRateNotesArr,
    appendCarrierDeliveryRateNotesArr,
    currentCarrierDeliveryNoteText,
    selectedLinehaulDetailsList,
    totalConsolWeight,
    updateSelectedLinehaulDetailsList,
}) => {
    const consolidatedFilterObj = useSelector((state) => state?.shipmentbuildingdata?.consolidatedFilterObj);    
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={() => {
                // Optional: reset app state here if necessary before retry
                console.log("Error boundary reset triggered");
            }}
        >
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, borderBottom: ' 1px solid rgba(143, 143, 143, 1)' }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, }}>
                        Carrier Rates
                    </Typography>
                </Box>
                {
                    (consolidatedFilterObj?.routing === 'LINE_HAUL_DELIVERY' || consolidatedFilterObj?.routing === 'LINE_HAUL_ONLY' || consolidatedFilterObj?.routing === 'PICKUP_LINE_HAUL_DELIVERY') && <>
                        {/* here we have to consolidate only linehaul  accessorials and ziprates  */}
                        <ConsolidateCarrierRateSection
                            type={type}
                            // fields={carrierRatesLineHaulAccessorials}
                            fields={watchedCRLinehaulAccessorials}
                            sectionName={` ${consolidatedFilterObj?.routing === 'LINE_HAUL_DELIVERY' ? 'Linehaul Delivery Consol' : consolidatedFilterObj?.routing === 'LINE_HAUL_ONLY' ? 'Linehaul Only Consol' :  consolidatedFilterObj?.routing === 'PICKUP_LINE_HAUL_DELIVERY' ? 'Pickup Linehaul Delivery Consol' : 'Linehaul Consol'} ${(watchedCarrierRateInfo.lineHaul.lineHaulCarrier && (selectedRouting === 'pickup_only' && (watchedLinehaulSelectRouting === 'linehaul_only' || watchedLinehaulSelectRouting === 'linehaul_delivery'))) ? `-  ${carrierTerminalDropdown.find(
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
                            // path="carrierRates.lineHaul.lineHaulAccessorials"
                            path="carrierInfo.linehaulDetailsList"
                            control={control}
                            getValues={getValues}
                            totals={totals}
                            apiZipRate={`${watchedCarrierRateInfo.lineHaul.apiLineHaulRate || ''}`}
                            invoiceNo={`watchedCarrierRateInfo.lineHaul.invoiceNo`}
                            updateAccessorials={carrierRatesLineHaulUpdateAccessorials}
                            approvalHistory={carrierLinehaulApprovalRateHistory}
                            notesArr={carrierLinehaulRateNotesArr}
                            appendNotesArr={appendCarrierLinehaulRateNotesArr}
                            currentNoteText={currentCarrierLinehaulNoteText}
                            selectedLinehaulDetailsList = {selectedLinehaulDetailsList}
                            updateSelectedLinehaulDetailsList = {updateSelectedLinehaulDetailsList}
                        />
                    </>
                }

                {/*  invoice approval section */}

            </Paper>
        </ErrorBoundary>
    );
};
export default ConsolidateCarrierHmPage; 
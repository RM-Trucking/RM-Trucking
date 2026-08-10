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
import CarrierSection from './CarrierSection';



const ActiveStep4 = ({ type,
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
}) => {
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
                    updateAccessorials = {carrierRatesPickUpUpdateAccessorials}
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
                    updateAccessorials = {carrierRatesLineHaulUpdateAccessorials}
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
                    updateAccessorials = {carrierRatesDeliveryUpdateAccessorials}
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
        </ErrorBoundary>
    );
};
export default ActiveStep4; 
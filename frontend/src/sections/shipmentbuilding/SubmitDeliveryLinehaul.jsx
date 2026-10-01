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
import { useReactToPrint } from 'react-to-print';
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
    getCustomerStationDropdown, getCarrierTerminalDropdown, searchCustomerStationDropdown,
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
    getZipToZipCarrierDeliveryRate, setError, setOperationalMessage,

} from '../../redux/slices/shipment';
import PickupAccessorialDialog from './PickupAccessorialDialog';
import AddAccessorialDialog from './AddAccessorialDialog';
import BillOfLadingAuto from './BillOfLadingAuto';
import ReferenceDialog from './ReferenceDialog';
import { getObjectForBOL } from './getObjForBOL'
import LinehaulClearDilog from './LinehaulClearDilog';

const SubmitDeliveryLinehaul = ({
    type,
    dispatch,
    navigate,
    location,
    control,
    errors,
    selectedRouting,
    carrierTerminalDropdown,
    isSelectingCarrierLinehaulRef,
    setSelectCarrierLinehaulSearchValue,
    selectCarrierLinehaulSearchValue,
    watchedPickupAgentTerminal,
    watchedSelectedPickupCarrier,
    renderZipCodeFieldCarrierInfo,
    watchedLinehaulSelectRouting,
    watchedLinehaulToLocationType,
    isSelectingToCarrierLinehaulRef,
    setCarrierLinehaulSearchValue,
    carrierLinehaulSearchValue,
    watchedConsigneeName,
    watchedLinehaulToLocationFlag,
    watchedLinehaulAddAcc,
    setLineHaulAccModal,
    lineHaulAccFields,
    setActiveAccType,
    notesRefArray,
    notesRefArrayIndex,
    notesRefArrayObj,
    setOpenNotesDialogForShipmentAccs,
    setEditAccIndex,
    setActionType,
    setAddLineHaulAccModal,
    removeLineHaulAcc,
    lineHaulAccModal,
    replaceLineHaulAcc,
    addLineHaulAccModal,
    actionType,
    LINEHAUL_MASTER_ACCESSORIALS,
    setLINEHAUL_MASTER_Accessorials,
    appendLineHaulAccFields,
    lineHaulNotesArr,
    watchedLinehaulFromLocationFlag,
    onSaveOfEdit,
    editAccIndex,
    isLoading,
    setValue,
    watchedCarrierInfo,
    watchedToLocation,
    getValues,
    watchedAirportPickupService,
    watchedAirportDeliveryService,
    isHazmatSelected,
    watchedSelectedLineHaulCarrier,
    watchedSelectedDeliveryCarrier,
    watchedLinehaulToLocation,
    watchedDeliveryToLocation,
    watchedOriginAirport,
    watchedDestinationAirport,
}) => {
    const selectedDelName = useSelector((state) => state?.shipmentbuildingdata?.selectedDelName);

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
            <fieldset style={{ borderColor: '#000', borderRadius: '8px' }}>
                <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Linehaul pickup location details</Typography></legend>
                <Box>
                    {/* linehaul details  */}
                    <>

                        {/* TOP SECTION: Flexbox row for Carrier and Bill info */}
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <StyledTextField
                                    value={selectedDelName?.carrierName || ''}
                                    fullWidth
                                    label="From Location *"
                                    variant="standard"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        maxLength: 50
                                    }}
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 200px' }}>
                                <Controller
                                    name="carrierInfo.lineHaul.airportCode"
                                    rules={{ required: true }}
                                    control={control}
                                    render={({ field }) => (
                                        <StyledTextField
                                            {...field}
                                            fullWidth
                                            label="Airport Code"
                                            required
                                            variant="standard"
                                            InputLabelProps={{ shrink: true }}
                                            // Natively restricts entry to 50 characters max
                                            inputProps={{ maxLength: 50 }}
                                        />
                                    )}
                                />

                            </Box>

                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                             <Box>
                                <Controller
                                    name="carrierInfo.lineHaul.toggleAddress"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Address or From location
                                            </Typography>
                                            <ToggleButtonGroup
                                                value={value}
                                                exclusive
                                                // Strip the event argument and pass only the new string value
                                                onChange={(event, newValue) => {
                                                    if (newValue !== null) {
                                                        onChange(newValue);
                                                    }
                                                }}
                                                color="primary"
                                                aria-label="Address or From location"
                                                disabled={type === 'View'}
                                            >
                                                <ToggleButton value="pickup" sx={{ textTransform: 'none', px: 3 }}>
                                                    Pickup agents dock
                                                </ToggleButton>
                                                <ToggleButton value="linehaul" sx={{ textTransform: 'none', px: 3, }}>
                                                    Line haul carriers terminal dock
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: '2 1 300px', display: 'flex', gap: 1 }}>
                                <Controller
                                    name="carrierInfo.lineHaul.manualFromLocation"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            sx={{ mt: '3%', whiteSpace: 'nowrap' }}
                                            control={<Checkbox {...field} checked={field.value} size="small" disabled={type === 'View'} sx={{
                                                color: 'rgba(0, 25, 76, 1)',
                                                '&.Mui-checked': {
                                                    color: 'rgba(0, 25, 76, 1)'
                                                },
                                                '&.Mui-disabled': {
                                                    color: 'rgba(0, 25, 76, 1) !important'
                                                }
                                            }} />}
                                            label={<Typography onClick={(e) => e.preventDefault()} sx={{ cursor: 'default', fontSize: '0.8rem' }} variant="body2">Edit From Location</Typography>}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>

                        {/* MANUAL LOCATION FIELDSET: Flexbox for address fields */}

                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1, position: 'relative', borderStyle: 'solid', borderColor: '#ccc' }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>
                                Manual From Location
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line1" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 1" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.line2" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="Address Line 2" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 255 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.city" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="City" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    <Controller name="carrierInfo.lineHaul.manualFromLocationDetails.state" control={control} render={({ field }) => <StyledTextField {...field} fullWidth label="State" variant="standard" InputLabelProps={{ shrink: true }} />} disabled={!watchedLinehaulFromLocationFlag} inputProps={{ maxLength: 100 }} />
                                </Box>
                                <Box sx={{ flex: '1 1 18%' }}>
                                    {renderZipCodeFieldCarrierInfo('carrierInfo.lineHaul.manualFromLocationDetails.zip', !watchedLinehaulFromLocationFlag)}
                                </Box>
                            </Box>
                        </Paper>
                    </>

                    <Box sx={{ flex: '0 1 200px', mb: 3 }}>
                        <FormControlLabel
                            control={<Controller name="carrierInfo.lineHaul.linehaulAddAcc" control={control} render={({ field }) => <Checkbox disabled={type === 'View'} {...field} checked={field.value} size="small" sx={{
                                color: 'rgba(0, 25, 76, 1)',
                                '&.Mui-checked': {
                                    color: 'rgba(0, 25, 76, 1)'
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 25, 76, 1) !important'
                                }
                            }} />} />}
                            label={<Typography onClick={(e) => e.preventDefault()} sx={{ cursor: 'default' }} variant="body2">Add Linehaul Accessorials</Typography>}
                        />
                    </Box>

                    {/* ACCESSORIALS: Flexbox for header */}
                    {watchedLinehaulAddAcc && <Accordion sx={{ mt: 3, boxShadow: 'none', '&:before': { display: 'none' }, mb: 6 }}>
                        <AccordionSummary
                            expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                            sx={{ borderBottom: '1px solid #ccc', px: 0 }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">Linehaul Accessorial Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 2 }}>
                            {type !== 'View' && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => setLineHaulAccModal(true)} // Opens the Dialog
                                    sx={{ bgcolor: '#a22', textTransform: 'none' }}
                                >
                                    Add Accessorial
                                </Button>
                            </Box>}

                            <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#eee' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Accessorial Name</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charge Type</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Charges</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Notes</TableCell>
                                            {type !== 'View' && <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Actions</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {lineHaulAccFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.accessorialName}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeType}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{field.chargeValue}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => {
                                                        setActiveAccType('LineHaul');
                                                        notesRefArray.current = field.notes;
                                                        notesRefArrayIndex.current = index;
                                                        notesRefArrayObj.current = field;
                                                        setOpenNotesDialogForShipmentAccs(true);
                                                    }}>
                                                        <Iconify icon="icon-park-solid:notes" sx={{ color: '#90caf9' }} />
                                                    </IconButton>
                                                </TableCell>
                                                {type !== 'View' && <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {/* <IconButton size="small" onClick={() => {
                                      setActionType('View');
                                      setAddAccModal(true);
                                    }}><Iconify icon="carbon:view-filled" /></IconButton> */}
                                                        <IconButton size="small" onClick={() => {
                                                            setActiveAccType('LineHaul');
                                                            setEditAccIndex(index);
                                                            setActionType('Edit');
                                                            setAddLineHaulAccModal(true);
                                                        }}><Iconify icon="tabler:edit" /></IconButton>
                                                        <IconButton onClick={() => {
                                                            const selectedObj = watchedCarrierInfo?.lineHaul?.linehaulAccessorials[index];
                                                            const targetId = selectedObj?.entityAccessorialId || selectedObj?.accessorialId;
                                                            // If there is no valid ID, stop the function early
                                                            if (!targetId) return;
                                                            const updatedMasterList = LINEHAUL_MASTER_ACCESSORIALS.map((item) => {
                                                                if (item?.entityAccessorialId === targetId || item?.accessorialId === targetId) {
                                                                    return {
                                                                        ...item,
                                                                        selected: false // Explicitly uncheck this item
                                                                    };
                                                                }
                                                                return item; // Leave all other items exactly as they are
                                                            });
                                                            // 4. Update the master accessorials state
                                                            setLINEHAUL_MASTER_Accessorials(updatedMasterList);
                                                            removeLineHaulAcc(index);

                                                        }} size="small"><Iconify icon="material-symbols:delete-rounded" /></IconButton>
                                                    </Stack>
                                                </TableCell>}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>}

                    <PickupAccessorialDialog
                        open={lineHaulAccModal}
                        onClose={() => {
                            setLineHaulAccModal(false);
                            setAddLineHaulAccModal(false);
                            setActionType('');
                        }}
                        onSave={(selectedData) => replaceLineHaulAcc(selectedData)}
                        setActionType={setActionType}
                        setAddAccModal={setAddLineHaulAccModal}
                        addAccModal={addLineHaulAccModal}
                        actionType={actionType}
                        MASTER_ACCESSORIALS={LINEHAUL_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setLINEHAUL_MASTER_Accessorials}
                        AccFields={lineHaulAccFields}
                    />
                    <AddAccessorialDialog
                        open={addLineHaulAccModal}
                        onClose={() => {
                            setAddLineHaulAccModal(false);
                            setActionType('');
                            setEditAccIndex(null);
                        }}
                        onSave={onSaveOfEdit}
                        setActionType={setActionType}
                        setAddAccModal={setAddLineHaulAccModal}
                        addAccModal={addLineHaulAccModal}
                        actionType={actionType}
                        accFields={lineHaulAccFields}
                        editableObj={lineHaulAccFields[editAccIndex]}
                        appendAccFields={appendLineHaulAccFields}
                        MASTER_ACCESSORIALS={LINEHAUL_MASTER_ACCESSORIALS}
                        setMASTER_Accessorials={setLINEHAUL_MASTER_Accessorials}
                    />
                </Box>
            </fieldset>

        </ErrorBoundary>
    );
};
export default SubmitDeliveryLinehaul; 
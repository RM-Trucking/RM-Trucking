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
    setError, getCarrierTerminalDropdown
} from '../../redux/slices/shipmentbuilding';
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
    const isSelectingCarrierRef = useRef(false);
    const [selectCarrierSearchValue, setSelectCarrierSearchValue] = useState('');
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

        },

    });

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };

    const onClickOfNewDashboard = () => {
        // route to shipment
        navigate(PATH_DASHBOARD.shipmentBuilding.shipmentView);
    }
    const handleConsolidate = () => {
        console.log('handle consolidate');
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


                {/* <ShipmentViewTable /> */}




            </ErrorBoundary>

        </>
    );
}


//   <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ xs: 'stretch', lg: 'center' }} sx={{ width: '100%' }}>
//                     <Stack direction={{ xs: 'column', md: 'row' }}
//                         spacing={2}
//                         alignItems='stretch'
//                         sx={{ mt: 2, mb: 2, width: '100%' }}>

//                         {/* Field 1: Shipment Status - Flex allocated layout */}
//                         <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
//                             <Controller
//                                 name="shipmentStatus"
//                                 control={control}
//                                 render={({ field }) => (
//                                     <StyledTextField {...field} select fullWidth label="Select Shipment Status" variant="standard" error={!!errors.shipmentStatus} SelectProps={{
//                                         displayEmpty: true,
//                                         MenuProps: {
//                                             getContentAnchorEl: null,
//                                             disableScrollLock: true,
//                                             anchorOrigin: {
//                                                 vertical: 'bottom',
//                                                 horizontal: 'left',
//                                             },
//                                             transformOrigin: {
//                                                 vertical: 'top',
//                                                 horizontal: 'left',
//                                             },
//                                             PaperProps: {
//                                                 sx: {
//                                                     marginTop: '4px',
//                                                     maxHeight: 300,
//                                                     maxWidth: 300
//                                                 }
//                                             }
//                                         },
//                                     }} sx={{ width: '100%' }}>
//                                         {shipmentStatusOptions.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
//                                     </StyledTextField>
//                                 )}
//                             />
//                         </Box>

//                         {/* Field 2: Customer Reference - Flex allocated layout */}
//                         <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
//                             <Box>
//                                 <Controller name="customerReference" control={control} render={({ field }) => (
//                                     <TextField {...field} fullWidth label="Customer Reference #" variant="standard" error={!!errors.customerReference} />
//                                 )} />
//                             </Box>
//                         </Box>

//                         {/* Field 3: NEW Carrier Autocomplete - Flex allocated layout */}
//                         <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
//                             <Controller
//                                 name="carrier"
//                                 control={control}
//                                 render={({ field: { onChange, value, ref, ...fieldProps } }) => (
//                                     <Autocomplete
//                                         {...fieldProps}
//                                         fullWidth
//                                         options={carrierTerminalDropdown || []}

//                                         // Generates explicit, unique keys for each option item
//                                         renderOption={(props, option, state) => {
//                                             const uniqueKey = `carrier-terminal-${option.terminalId}-${option.carrierId}-${state.index}`;
//                                             return (
//                                                 <li {...props} key={uniqueKey}>
//                                                     {option.carrierName && option.terminalName
//                                                         ? `${option.carrierName} | ${option.terminalName}`
//                                                         : ""}
//                                                 </li>
//                                             );
//                                         }}

//                                         // Ensures accurate component highlighting matching values
//                                         isOptionEqualToValue={(option, val) => {
//                                             const optionKey = `${option?.terminalId}-${option?.carrierId}`;
//                                             const valueKey = typeof val === 'string' ? val : `${val?.terminalId}-${val?.carrierId}`;
//                                             return optionKey === valueKey;
//                                         }}

//                                         filterOptions={(options, state) => {
//                                             const inputValue = state.inputValue.trim().toLowerCase();
//                                             if (!inputValue) return options;

//                                             return options.filter((option) => {
//                                                 const carrierName = (option.carrierName || '').toLowerCase();
//                                                 const terminalName = (option.terminalName || '').toLowerCase();
//                                                 const carrierId = String(option.carrierId || '');
//                                                 const terminalId = String(option.terminalId || '');
//                                                 const stateName = (option.address?.state || '').toLowerCase();
//                                                 const mainEmail = (option.terminalEmail || '').toLowerCase();
//                                                 const personnelEmails = (option.emails || []).map(e => (e.email || '').toLowerCase());

//                                                 return (
//                                                     carrierName.includes(inputValue) ||
//                                                     terminalName.includes(inputValue) ||
//                                                     carrierId.includes(inputValue) ||
//                                                     terminalId.includes(inputValue) ||
//                                                     stateName.includes(inputValue) ||
//                                                     mainEmail.includes(inputValue) ||
//                                                     personnelEmails.some(email => email.includes(inputValue))
//                                                 );
//                                             });
//                                         }}

//                                         getOptionLabel={(option) => {
//                                             if (option && option.carrierName && option.terminalName) {
//                                                 return `${option.carrierName} | ${option.terminalName}`;
//                                             }
//                                             return "";
//                                         }}

//                                         value={carrierTerminalDropdown.find(opt => `${opt.terminalId}-${opt.carrierId}` === value) || null}

//                                         onChange={(event, newValue) => {
//                                             isSelectingCarrierRef.current = true;
//                                             const formValue = newValue ? `${newValue.terminalId}-${newValue.carrierId}` : "";
//                                             onChange(formValue);
//                                         }}

//                                         onInputChange={(event, newInputValue, reason) => {
//                                             if (reason !== "reset") {
//                                                 setSelectCarrierSearchValue(newInputValue);
//                                             }
//                                         }}

//                                         loading={isLoading}
//                                         loadingText="Searching carriers..."

//                                         // Added your conditional empty results messaging
//                                         noOptionsText={selectCarrierSearchValue ? "No carriers found" : "Type to search for carriers"}

//                                         renderInput={(params) => (
//                                             <TextField
//                                                 {...params}
//                                                 inputRef={ref} // Keeps React Hook Form validation focus operational
//                                                 variant="standard"
//                                                 label="Select Carrier"
//                                                 error={!!errors.carrier}
//                                                 // Added space layout preservation helper text rule
//                                                 helperText={errors.carrier ? errors.carrier.message : ' '}
//                                                 sx={{
//                                                     '& .MuiInputBase-input:disabled': {
//                                                         color: '#000',
//                                                         WebkitTextFillColor: '#000'
//                                                     }
//                                                 }}
//                                                 InputProps={{
//                                                     ...params.InputProps,
//                                                     endAdornment: (
//                                                         <>
//                                                             {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
//                                                             {params.InputProps.endAdornment}
//                                                         </>
//                                                     ),
//                                                 }}
//                                             />
//                                         )}
//                                     />
//                                 )}
//                             />
//                         </Box>


//                         {/* Checkbox: R&M */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
//                             <FormControlLabel
//                                 control={
//                                     <Controller
//                                         name="rmChecked"
//                                         control={control}
//                                         render={({ field }) => (
//                                             <Checkbox
//                                                 {...field}
//                                                 checked={field.value}
//                                                 size="small"
//                                                 sx={{ color: '#001a41', '&.Mui-checked': { color: '#001a41' } }}
//                                             />
//                                         )}
//                                     />
//                                 }
//                                 label={<Typography variant="body2">R&M</Typography>}
//                             />
//                         </Box>

//                         {/* Checkbox: Others */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
//                             <FormControlLabel
//                                 control={
//                                     <Controller
//                                         name="othersChecked"
//                                         control={control}
//                                         render={({ field }) => (
//                                             <Checkbox
//                                                 {...field}
//                                                 checked={field.value}
//                                                 size="small"
//                                                 sx={{ color: '#001a41', '&.Mui-checked': { color: '#001a41' } }}
//                                             />
//                                         )}
//                                     />
//                                 }
//                                 label={<Typography variant="body2">Others</Typography>}
//                             />
//                         </Box>
//                     </Stack>

//                     {/* Actions Section Container */}
//                     <Stack
//                         direction="row"
//                         alignItems="center"
//                         justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
//                         sx={{ mt: 2, mb: 2, ml: { xs: 0, lg: 2 }, width: { xs: '100%', lg: 'auto' }, minWidth: 'fit-content' }}
//                     >
//                         <Button
//                             variant="contained"
//                             onClick={handleConsolidate}
//                             sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
//                         >
//                             Consolidate
//                         </Button>
//                         <SharedSearchField page="shipmentbuilding" />
//                     </Stack>
//                 </Stack>
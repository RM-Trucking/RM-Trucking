import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import {
    Button,
    Box,
    MenuItem,
    Stack,
    CircularProgress,
    Divider,
    Typography,
    Dialog, DialogContent,
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import {
    setRateSearchObj, getWarehouseRateDashboardData, postWarehouseRate,
    putWarehouseRate, setSelectedCurrentRateRow, getOriginZoneByZipCode,
    getDestinationZoneByZipCode, getCustomerTransportationRateDashboardData,
    getCarrierTransportationRateDashboardData, postCustomerTransportationRate,
    putCustomerTransportationRate, putCarrierTransportationRate,
    postCarrierTransportationRate, setOriginZoneListByZipCode,
    setDestinationZoneListByZipCode
} from '../../redux/slices/rate';
import {
    getStationRateData
} from '../../redux/slices/customer';
import {
    getTerminalRateData
} from '../../redux/slices/carrier';
import {
    getZoneById, setSelectedZoneRowDetails
} from '../../redux/slices/zone';
import RateFieldAndChargeTableWarehouse from '../rate/RateFieldAndChargeTableWarehouse';
import RateFieldAndChargeTable from '../rate/RateFieldAndChargeTable';
import CustomerListTable from '../rate/CustomersListTable';
import Iconify from '../../components/iconify';
import ZoneDetails from '../zone/ZoneDetails';

RateSearchFields.propTypes = {
    padding: PropTypes.number,
    type: PropTypes.string,
    currentTab: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCurrentRateRow: PropTypes.object,
};

export default function RateSearchFields({ padding, type, currentTab, handleCloseConfirm, selectedCurrentRateRow }) {
    const dispatch = useDispatch();
    const { pathname } = useLocation();
    const selectedCustomerStationDetails = useSelector((state) => state?.customerdata?.selectedCustomerStationDetails);
    const isLoading = useSelector((state) => state?.ratedata?.isLoading);
    const originLoading = useSelector((state) => state?.ratedata?.originLoading);
    const destinationLoading = useSelector((state) => state?.ratedata?.destinationLoading);
    const operationalMessage = useSelector((state) => state?.ratedata?.operationalMessage);
    const selectedZoneRowDetails = useSelector((state) => state?.zonedata?.selectedZoneRowDetails);
    const zoneSuccess = useSelector((state) => state?.zonedata?.zoneSuccess);
    const zoneLoading = useSelector((state) => state?.zonedata?.isLoading);
    const rateFieldChargeDataWarehouse = useSelector((state) => state?.ratedata?.rateFieldChargeDataWarehouse);
    const rateFieldChargeData = useSelector((state) => state?.ratedata?.rateFieldChargeData);
    const currentRateRoutedFrom = useSelector((state) => state?.ratedata?.currentRateRoutedFrom);
    const originZoneListByZipCode = useSelector((state) => state?.ratedata?.originZoneListByZipCode);
    const destinationZoneListByZipCode = useSelector((state) => state?.ratedata?.destinationZoneListByZipCode);
    const currentRateTab = useSelector((state) => state?.ratedata?.currentRateTab);
    const pagination = useSelector((state) => state?.ratedata?.pagination);
    const rateSearchObj = useSelector((state) => state?.ratedata?.rateSearchObj);
    const selectedCarrierTabRowDetails = useSelector((state) => state?.carrierdata?.selectedCarrierTabRowDetails);
    const [openCustomersList, setOpenCustomersList] = useState(false);
    const [openZoneView, setOpenZoneView] = useState(false);
    const [actionType, setActionType] = useState('');
    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
        setValue,
    } = useForm({
        defaultValues: {
            origin: '',
            originZipCode: '',
            destination: '',
            destinationZipCode: '',
            warehouse: '',
            department: '',
            notes: '',
        }
    });

    useEffect(() => {
        if ((type === 'Edit' || type === 'Copy') && selectedCurrentRateRow && currentTab === 'warehouse') {
            setValue('warehouse', selectedCurrentRateRow.warehouse || '');
            setValue('department', selectedCurrentRateRow.department || '');
        }
        if (type === 'Edit' && selectedCurrentRateRow && currentTab === 'transportation') {
            setValue('origin', selectedCurrentRateRow?.originZone?.zoneId || '');
            setValue('destination', selectedCurrentRateRow?.destinationZone?.zoneId || '');
            setValue('originZipCode', selectedCurrentRateRow?.originZone?.zipCodes.join(',').concat(",", selectedCurrentRateRow?.originZone?.ranges?.join(',')) || '');
            setValue('destinationZipCode', selectedCurrentRateRow?.destinationZone?.zipCodes?.join(',').concat(",", selectedCurrentRateRow?.destinationZone?.ranges?.join(',')) || '');
            setValue('notes', selectedCurrentRateRow?.notes?.[0]?.messageText || '');
        }
        if (type === 'View' && selectedCurrentRateRow && currentTab === 'transportation') {
            setValue('origin', selectedCurrentRateRow?.originZone?.zoneId || "");
            setValue('destination', selectedCurrentRateRow?.destinationZone?.zoneId || '');
            setValue('originZipCode', selectedCurrentRateRow?.originZone?.zipCodes.join(',').concat(",", selectedCurrentRateRow?.originZone?.ranges?.join(',')) || '');
            setValue('destinationZipCode', selectedCurrentRateRow?.destinationZone?.zipCodes?.join(',').concat(",", selectedCurrentRateRow?.destinationZone?.ranges?.join(',')) || '');
            setValue('notes', selectedCurrentRateRow?.notes?.[0]?.messageText || '');
        }
    }, [selectedCurrentRateRow])
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
            dispatch(setSelectedCurrentRateRow({}));
            dispatch(setRateSearchObj({}));
        }
    }, [operationalMessage]);
    useEffect(() => {
        if (zoneSuccess && selectedZoneRowDetails?.zoneId && actionType === 'View') {
            setOpenZoneView(true);
        }
    }, [zoneSuccess])

    const onSubmit = (data) => {
        console.log(data);
        dispatch(setRateSearchObj(data));
        if (type === 'Search' && currentTab === 'warehouse') {
            dispatch(getWarehouseRateDashboardData({ pageNo: 1, pageSize: 10, searchStr: data.warehouse }));
        }
        if (type === 'Search' && currentTab === 'transportation' && currentRateRoutedFrom === 'customer') {
            dispatch(getCustomerTransportationRateDashboardData({
                originZoneId: data.originZipCode ? data.origin : '',
                originZipOrRange: data.originZipCode
                    ?.split(',')            // Split by comma
                    ?.map(s => s.trim())    // Remove any extra whitespace
                    ?.filter(Boolean),
                destinationZoneId: data.destinationZipCode ? data.destination : '',
                destinationZipOrRange: data.destinationZipCode
                    ?.split(',')            // Split by comma
                    ?.map(s => s.trim())    // Remove any extra whitespace
                    ?.filter(Boolean), pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
        if (type === 'Search' && currentTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
            dispatch(getCarrierTransportationRateDashboardData({
                originZoneId: data.originZipCode ? data.origin : '',
                originZipOrRange: data.originZipCode
                    ?.split(',')            // Split by comma
                    ?.map(s => s.trim())    // Remove any extra whitespace
                    ?.filter(Boolean),
                destinationZoneId: data.destinationZipCode ? data.destination : '',
                destinationZipOrRange: data.destinationZipCode
                    ?.split(',')            // Split by comma
                    ?.map(s => s.trim())    // Remove any extra whitespace
                    ?.filter(Boolean), pageNo: pagination.page, pageSize: pagination.pageSize
            }));
        }
        if ((type === 'Add' || type === 'Copy') && currentTab === 'warehouse') {
            const obj = {
                "minRate": parseFloat(rateFieldChargeDataWarehouse[0]?.charge),
                "ratePerPound": parseFloat(rateFieldChargeDataWarehouse[1]?.charge),
                "maxRate": parseFloat(rateFieldChargeDataWarehouse[2]?.charge),
                "department": data.department,
                "warehouse": data.warehouse
            };
            // check for state view and station id
            dispatch(postWarehouseRate(obj));
        }
        if (type === 'Edit' && currentTab === 'warehouse') {
            const obj = {
                "minRate": parseFloat(rateFieldChargeDataWarehouse[0]?.charge),
                "ratePerPound": parseFloat(rateFieldChargeDataWarehouse[1]?.charge),
                "maxRate": parseFloat(rateFieldChargeDataWarehouse[2]?.charge),
                "department": data.department,
                "warehouse": data.warehouse
            };
            dispatch(putWarehouseRate(selectedCurrentRateRow?.rateId, obj));
        }
        if (type === 'Add' && currentTab === 'transportation' && currentRateRoutedFrom === 'customer') {
            const obj = {
                "originZoneId": data.origin,
                "destinationZoneId": data.destination,
                "details": rateFieldChargeData
                    .filter(item => item.rateField?.toString().trim() && item.charge?.toString().trim())
                    .map(item => {
                        const isMinOrMax = ["Min Charge", "Max Charge"].includes(item.rateField);

                        return {
                            rateField: item.rateField.toString(),
                            chargeValue: Number(item.charge),
                            perUnitFlag: isMinOrMax ? "N" : "Y" // 'N' for Min/Max, otherwise 'Y'
                        };
                    }),
                "note": {
                    "messageText": data.notes
                }
            }
            dispatch(postCustomerTransportationRate(obj));
        }
        if (type === 'Add' && currentTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
            const obj = {
                "originZoneId": data.origin,
                "destinationZoneId": data.destination,
                "details": rateFieldChargeData
                    .filter(item => item.rateField?.toString().trim() && item.charge?.toString().trim())
                    .map(item => {
                        const isMinOrMax = ["Min Charge", "Max Charge"].includes(item.rateField);

                        return {
                            rateField: item.rateField.toString(),
                            chargeValue: Number(item.charge),
                            perUnitFlag: isMinOrMax ? "N" : "Y" // 'N' for Min/Max, otherwise 'Y'
                        };
                    }),
                "note": {
                    "messageText": data.notes
                }
            }
            dispatch(postCarrierTransportationRate(obj));
        }
        if (type === 'Edit' && currentTab === 'transportation' && currentRateRoutedFrom === 'customer') {
            const obj = {
                "originZoneId": data.origin,
                "destinationZoneId": data.destination,
                "details": rateFieldChargeData
                    .filter(item => item.rateField?.toString().trim() && item.charge?.toString().trim())
                    .map(item => {
                        const isMinOrMax = ["Min Charge", "Max Charge"].includes(item.rateField);

                        return {
                            rateField: item.rateField.toString(),
                            chargeValue: Number(item.charge),
                            perUnitFlag: isMinOrMax ? "N" : "Y" // 'N' for Min/Max, otherwise 'Y'
                        };
                    }),
                "note": {
                    "messageText": data.notes
                },
                "noteThreadId": selectedCurrentRateRow.noteThreadId,
            }
            dispatch(putCustomerTransportationRate(selectedCurrentRateRow?.rateId, obj));
        }
        if (type === 'Edit' && currentTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
            const obj = {
                "originZoneId": data.origin,
                "destinationZoneId": data.destination,
                "details": rateFieldChargeData
                    .filter(item => item.rateField?.toString().trim() && item.charge?.toString().trim())
                    .map(item => {
                        const isMinOrMax = ["Min Charge", "Max Charge"].includes(item.rateField);

                        return {
                            rateField: item.rateField.toString(),
                            chargeValue: Number(item.charge),
                            perUnitFlag: isMinOrMax ? "N" : "Y" // 'N' for Min/Max, otherwise 'Y'
                        };
                    }),
                "note": {
                    "messageText": data.notes
                },
                "noteThreadId": selectedCurrentRateRow.noteThreadId,
            }
            dispatch(putCarrierTransportationRate(selectedCurrentRateRow?.rateId, obj))
        }
    };
    const handleCLear = () => {
        // reset form fields    
        setValue('origin', '');
        setValue('originZipCode', '');
        setValue('destination', '');
        setValue('destinationZipCode', '');
        setValue('warehouse', '');
        dispatch(setRateSearchObj({}));
        dispatch(setOriginZoneListByZipCode([]));
        dispatch(setDestinationZoneListByZipCode([]));
        if (type === 'Search' && currentTab === 'warehouse') {
            dispatch(getWarehouseRateDashboardData({ pageNo: 1, pageSize: 10, searchStr: "" }));
        }
        if (type === 'Search' && currentTab === 'transportation' && currentRateRoutedFrom === 'customer') {
            if (pathname.includes('/customer-maintenance/station-view')) {
                dispatch(getStationRateData(selectedCustomerStationDetails?.stationId || localStorage.getItem('stationId'), currentRateTab === 'transportation' ? 'TRANSPORT' : 'WAREHOUSE'));
            } else {
                dispatch(getCustomerTransportationRateDashboardData({
                    originZoneId: '',
                    originZipOrRange: '',
                    destinationZoneId: '',
                    destinationZipOrRange: '', pageNo: pagination.page, pageSize: pagination.pageSize
                }));
            }
        }
        if (type === 'Search' && currentTab === 'transportation' && currentRateRoutedFrom === 'carrier') {
            if (pathname.includes('/carrier-maintenance/terminal-view')) {
                dispatch(getTerminalRateData(selectedCarrierTabRowDetails.terminalId || localStorage.getItem('terminalId'), 'TRANSPORT'));
            } else {
                dispatch(getCarrierTransportationRateDashboardData({
                    originZoneId: '',
                    originZipOrRange: '',
                    destinationZoneId: '',
                    destinationZipOrRange: '', pageNo: pagination.page, pageSize: pagination.pageSize
                }));
            }
        }
    };
    const onClickofCustomerList = () => {
        if (currentRateRoutedFrom === 'customer' && selectedCurrentRateRow?.customerCount > 0) {
            setOpenCustomersList(true);
        }

        if (currentRateRoutedFrom === 'carrier' && selectedCurrentRateRow?.carrierCount > 0) {
            setOpenCustomersList(true);
        }
    }
    const handleCloseOfCustomersList = () => {
        setOpenCustomersList(false);
    };
    const handleZoneView = (type) => {
        setActionType('View');
        const valueToSend = getValues(type === 'origin' ? 'origin' : 'destination');
        // Get current values of origin and destination
        dispatch(getZoneById(valueToSend)); // Pass the ID of the zone you want to view
    }
    const handleCloseOfZoneView = () => {
        setOpenZoneView(false);
        setActionType('')
        dispatch(setSelectedZoneRowDetails({}));
    }

    return (
        <>
            {type === 'View' && currentTab === 'transportation' && <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 'normal' }}>{currentRateRoutedFrom?.charAt(0).toUpperCase() + currentRateRoutedFrom?.slice(1)} Rate ID - {(selectedCurrentRateRow?.rateId && type === 'View') ? selectedCurrentRateRow?.rateId : ''}</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>}
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: padding }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={'flex-end'} justifyContent={type === 'Search' ? 'flex-end' : '"flex-start"'}>
                        {currentTab === 'transportation' &&
                            <Controller
                                name="originZipCode"
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        if (['Add', 'Edit'].includes(type)) {
                                            if (!value || value.toString().trim().length === 0) {
                                                return "Origin Zip Code is required";
                                            }
                                        } else if (!value || value.toString().trim().length === 0) return true;

                                        const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                                        for (let s of segments) {
                                            if (!/^(\d{5})(-\d{5})?$/.test(s)) return "Format: 12345 or 12345-67890";
                                            if (s.includes('-')) {
                                                const [start, end] = s.split('-');
                                                if (start.substring(0, 3) !== end.substring(0, 3)) return `Prefix mismatch: ${s}`;
                                                if (parseInt(end) <= parseInt(start)) return `End must be > start: ${s}`;
                                            }
                                        }
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        label="Origin Zip Code"
                                        variant="standard"
                                        fullWidth
                                        error={!!errors.originZipCode}
                                        placeholder="e.g. 12345, 67890-67895"
                                        helperText={errors.originZipCode?.message}
                                        onChange={(e) => {
                                            let input = e.target.value.replace(/[^\d,-]/g, '');

                                            // 1. Handle Empty State: Clear list if user deletes everything
                                            if (!input.trim()) {
                                                dispatch(setOriginZoneListByZipCode([]));
                                                onChange('');
                                                return;
                                            }

                                            // 2. Prevent double commas or starting with a comma
                                            input = input.replace(/,+/g, ',');
                                            if (input.startsWith(',')) input = input.slice(1);

                                            let segments = input.split(',');
                                            let lastIdx = segments.length - 1;
                                            let lastSegment = segments[lastIdx];

                                            // 3. Smart Range Auto-fill (Prefix logic)
                                            // If user types 6th digit, auto-insert hyphen and prefix (e.g. 123456 -> 12345-1236)
                                            if (lastSegment.length === 6 && !lastSegment.includes('-')) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment.slice(0, 5) + '-' + prefix + lastSegment.slice(5);
                                            }
                                            // If user manually types hyphen after 5 digits, auto-insert prefix
                                            else if (lastSegment.endsWith('-') && lastSegment.length === 6) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment + prefix;
                                            }

                                            let finalValue = segments.join(',');

                                            // 4. User-Friendly Auto-Comma
                                            // Only add comma if typing (not backspacing) and segment is a complete ZIP or Range

                                            const isFullZip = /^\d{5}$/.test(lastSegment);
                                            const isFullRange = /^\d{5}-\d{5}$/.test(lastSegment) && lastSegment.includes('-');
                                            const isTyping = e.target.value.length > (value?.length || 0);

                                            if ((isFullZip || isFullRange) && isTyping) {
                                                finalValue += ',';
                                            }

                                            onChange(finalValue);

                                            // 5. API Call: Only dispatch if the last segment is complete
                                            if (isFullZip || isFullRange || input.endsWith(',')) {
                                                dispatch(getOriginZoneByZipCode(finalValue.replace(/,$/, "")));
                                            }
                                        }}
                                        disabled={type === 'View'}
                                        required={['Add', 'Edit'].includes(type)}
                                    />
                                )}
                            />


                        }
                        {currentTab === 'transportation' &&
                            <Stack flexDirection={'row'} alignItems={'center'} sx={{ width: '100%' }}>
                                <Controller
                                    name="origin"
                                    control={control}
                                    rules={{
                                        // 1. DYNAMIC REQUIRED LOGIC
                                        validate: (value) => {
                                            if (['Add', 'Edit'].includes(type)) {
                                                if (!value || value.toString().trim() === "") {
                                                    return "Origin is required";
                                                }
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <StyledTextField
                                            {...field}
                                            select
                                            label="Origin"
                                            variant="standard"
                                            fullWidth
                                            error={!!errors.origin}
                                            helperText={errors.origin?.message}
                                            disabled={type === 'View'}
                                            // 2. DYNAMIC ASTERISK
                                            required={['Add', 'Edit'].includes(type)}
                                            // Ensure select always has at least one child to prevent the error
                                            SelectProps={{
                                                displayEmpty: true,
                                                MenuProps: {
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    transformOrigin: {
                                                        vertical: 'top',
                                                        horizontal: 'left',
                                                    },
                                                    // Optional: Add a small gap between field and menu
                                                    PaperProps: {
                                                        sx: { marginTop: '4px' }
                                                    }
                                                },
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            {originZoneListByZipCode && originZoneListByZipCode.length > 0 ? (
                                                originZoneListByZipCode.map((data) => (
                                                    <MenuItem key={data.zoneId} value={data.zoneId}>
                                                        {data.zoneName || ''}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                // --- FIX: Fallback item to satisfy the 'children' requirement ---
                                                <MenuItem disabled value="">
                                                    <em>No zones available.</em>
                                                </MenuItem>
                                            )}
                                        </StyledTextField>
                                    )}
                                />
                                {
                                    originLoading ? <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} /> :

                                        <Iconify icon="famicons:open" onClick={() => {
                                            handleZoneView('origin');
                                        }} sx={{ marginTop: '30px', cursor: 'pointer' }} />
                                }

                            </Stack>
                        }

                        {currentTab === 'transportation' &&
                            <Controller
                                name="destinationZipCode"
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        if (['Add', 'Edit'].includes(type)) {
                                            if (!value || value.toString().trim().length === 0) {
                                                return "Destination Zip Code is required";
                                            }
                                        } else if (!value || value.toString().trim().length === 0) return true;

                                        const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                                        for (let s of segments) {
                                            if (!/^(\d{5})(-\d{5})?$/.test(s)) return "Use format: 12345 or 12345-67890";
                                            if (s.includes('-')) {
                                                const [start, end] = s.split('-');
                                                if (start.substring(0, 3) !== end.substring(0, 3)) return `Prefix mismatch: ${s}`;
                                                if (parseInt(end) <= parseInt(start)) return `End range must be > start in: ${s}`;
                                            }
                                        }
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        label="Destination Zip Code"
                                        variant="standard"
                                        fullWidth
                                        placeholder="e.g. 12345, 67890-67895"
                                        error={!!errors.destinationZipCode}
                                        helperText={errors.destinationZipCode?.message}
                                        onChange={(e) => {
                                            let input = e.target.value.replace(/[^\d,-]/g, '');

                                            // --- NEW: CLEAR LIST IF EMPTY ---
                                            if (!input.trim()) {
                                                dispatch(setDestinationZoneListByZipCode([]));
                                                onChange('');
                                                return;
                                            }
                                            // --------------------------------

                                            input = input.replace(/,+/g, ',');
                                            if (input.startsWith(',')) input = input.slice(1);

                                            let segments = input.split(',');
                                            let lastIdx = segments.length - 1;
                                            let lastSegment = segments[lastIdx];

                                            // 2. Smart Prefix Auto-fill
                                            if (lastSegment.length === 6 && !lastSegment.includes('-')) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment.slice(0, 5) + '-' + prefix + lastSegment.slice(5);
                                            }
                                            else if (lastSegment.endsWith('-') && lastSegment.length === 6) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment + prefix;
                                            }

                                            let finalValue = segments.join(',');

                                            // 3. User-Friendly Auto-Comma
                                            const isFullZip = /^\d{5}$/.test(lastSegment);
                                            const isFullRange = /^\d{5}-\d{5}$/.test(lastSegment) && lastSegment.includes('-');
                                            const isTyping = e.target.value.length > (value?.length || 0);

                                            if ((isFullZip || isFullRange) && isTyping) {
                                                finalValue += ',';
                                            }

                                            onChange(finalValue);

                                            // 4. API Call
                                            if (isFullZip || isFullRange || input.endsWith(',')) {
                                                dispatch(getDestinationZoneByZipCode(finalValue.replace(/,$/, "")));
                                            }
                                        }}
                                        disabled={type === 'View'}
                                        required={['Add', 'Edit'].includes(type)}
                                    />
                                )}
                            />


                        }
                        {currentTab === 'transportation' &&
                            <Stack flexDirection={'row'} alignItems={'center'} sx={{ width: '100%' }}>
                                <Controller
                                    name="destination"
                                    control={control}
                                    rules={{
                                        // 1. DYNAMIC REQUIRED LOGIC
                                        validate: (value) => {
                                            if (['Add', 'Edit'].includes(type)) {
                                                if (!value || value.toString().trim() === "") {
                                                    return "Destination is required";
                                                }
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <StyledTextField
                                            {...field}
                                            select
                                            label="Destination"
                                            variant="standard"
                                            fullWidth
                                            disabled={type === 'View'}
                                            error={!!errors.destination}
                                            helperText={errors.destination?.message}
                                            required={['Add', 'Edit'].includes(type)}
                                            // Helps MUI handle empty states gracefully
                                            SelectProps={{
                                                displayEmpty: true,
                                                MenuProps: {
                                                    anchorOrigin: {
                                                        vertical: 'bottom',
                                                        horizontal: 'left',
                                                    },
                                                    transformOrigin: {
                                                        vertical: 'top',
                                                        horizontal: 'left',
                                                    },
                                                    // Optional: Add a small gap between field and menu
                                                    PaperProps: {
                                                        sx: { marginTop: '4px' }
                                                    }
                                                },
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            {destinationZoneListByZipCode && destinationZoneListByZipCode.length > 0 ? (
                                                destinationZoneListByZipCode.map((data) => (
                                                    <MenuItem key={data.zoneId} value={data.zoneId}>
                                                        {data.zoneName || ''}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                // --- Fallback child to prevent the MUI error ---
                                                <MenuItem disabled value="">
                                                    <em>No zones available</em>
                                                </MenuItem>
                                            )}
                                        </StyledTextField>
                                    )}
                                />

                                {
                                    destinationLoading ? <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} /> :
                                        <Iconify icon="famicons:open" onClick={() => {
                                            handleZoneView('destination');
                                        }} sx={{ marginTop: '30px', cursor: 'pointer' }} />
                                }
                            </Stack>
                        }

                        {
                            currentTab === 'warehouse' && (type === 'Add' || type === 'Edit' || type === 'Copy') && <Controller
                                name="department"
                                control={control}
                                rules={{
                                    required: 'Department is required',
                                    maxLength: {
                                        value: 100,
                                        message: 'Department cannot exceed 100 characters'
                                    },
                                    // Ensures the value isn't just whitespace if manual input is ever enabled
                                    validate: (val) => val?.trim().length > 0 || 'Selection cannot be empty'
                                }}
                                render={({ field: { onChange, value, ...field } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        select
                                        label="Department"
                                        variant="standard"
                                        fullWidth
                                        required
                                        sx={{ width: '25%' }}
                                        error={!!errors.department}
                                        helperText={errors.department?.message}
                                        // 1. Prevent selecting/inputting strings starting with a space
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith(' ')) {
                                                return;
                                            }
                                            onChange(val.slice(0, 100)); // 2. Enforce 100 char limit
                                        }}
                                        // 3. Physical restriction for the underlying input
                                        SelectProps={{
                                            inputProps: { maxLength: 100 }
                                        }}
                                    >
                                        <MenuItem value="Air Export">Air Export</MenuItem>
                                        <MenuItem value="Ocean Export">Ocean Export</MenuItem>
                                        <MenuItem value="Air Import">Air Import</MenuItem>
                                        <MenuItem value="Ocean Import">Ocean Import</MenuItem>
                                        <MenuItem value="Domestic">Domestic</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                        }
                        {
                            currentTab === 'warehouse' && <Controller
                                name="warehouse"
                                control={control}
                                rules={{
                                    required: 'Warehouse is required',
                                    maxLength: {
                                        value: 100,
                                        message: 'Warehouse cannot exceed 100 characters'
                                    },
                                    validate: (value) => (value && value.trim().length > 0) || 'Warehouse cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => {
                                    const hasValue = field.value && field.value.trim().length > 0;
                                    const shouldShowError = !!error && hasValue;
                                    return (<StyledTextField
                                        {...field}
                                        variant="standard"
                                        fullWidth
                                        sx={{
                                            width: '25%',
                                        }}
                                        // Intercept onChange to prevent leading spaces
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // prevent only leading spaces while typing
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="Warehouse *"
                                        error={(type !== 'Search') ? !!error : shouldShowError}
                                        helperText={(type !== 'Search') ? error?.message : (shouldShowError ? error?.message : '')}
                                    />)
                                }}
                            />
                        }
                        {zoneLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                        {type === 'Search' && <Button
                            variant="outlined"
                            size="small"
                            // on click clear the values
                            onClick={handleCLear}
                            sx={{
                                '&.MuiButton-outlined': {
                                    borderRadius: '4px',
                                    color: '#000',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#fff',
                                    fontWeight: 'normal',
                                    ml: 2,
                                    mr: 1,
                                    borderColor: '#000',
                                    height: 30,
                                },
                            }}
                        >
                            Clear
                        </Button>}
                        {type === 'Search' && <Button
                            variant="contained"
                            size="small"
                            type='submit'
                            onClick={handleSubmit(onSubmit)}
                            sx={{
                                '&.MuiButton-contained': {
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#A22',
                                    fontWeight: 'normal',
                                    ml: 1,
                                    height: 30,
                                },
                            }}
                        >
                            Search
                        </Button>}
                    </Stack>
                    {((type === 'Add' || type === 'Edit' || type === 'Copy') && currentTab === 'warehouse') && <Box sx={{ mt: '16px !important' }}>
                        <RateFieldAndChargeTableWarehouse type={type} />
                    </Box>}
                    {((type === 'Add' || type === 'Edit' || type === 'View') && currentTab === 'transportation') && <Box>
                        <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                            <RateFieldAndChargeTable type={type} />
                            <Stack flexDirection={'column'} sx={{ width: '50%', ml: 2 }} alignItems={'flex-end'}>
                                {type !== 'Add' && <Button
                                    variant="outlined"
                                    onClick={onClickofCustomerList}
                                    sx={{
                                        height: '30px',
                                        fontWeight: 600,
                                        color: '#fff',
                                        width: '50%',
                                        textTransform: 'none', // Prevent uppercase styling
                                        '&.MuiButton-outlined': {
                                            borderRadius: '4px',
                                            color: '#fff',
                                            boxShadow: 'none',
                                            p: '2px 16px',
                                            bgcolor: '#a22',
                                            borderColor: '#a22',
                                            mb: 2,
                                        },
                                    }}
                                >
                                    {currentRateRoutedFrom?.charAt(0).toUpperCase() + currentRateRoutedFrom?.slice(1)} list ({(currentRateRoutedFrom === 'customer') ? selectedCurrentRateRow?.customerCount || 0 : selectedCurrentRateRow?.carrierCount || 0})
                                </Button>}
                                <Controller
                                    name="notes"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            // 1. If it's empty, it's valid (because it's optional)
                                            if (!value || value.length === 0) return true;

                                            // 2. If it has value, ensure it's not just whitespace
                                            if (value.trim().length === 0) {
                                                return "Notes cannot be empty spaces";
                                            }

                                            // 3. Ensure the first character is not a space (prevents " empty starts")
                                            if (value.startsWith(" ")) {
                                                return "Notes cannot start with a space";
                                            }

                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <StyledTextField
                                            {...field}
                                            label="Notes"
                                            variant="outlined"
                                            fullWidth
                                            multiline
                                            rows={10}
                                            error={!!errors.notes}
                                            helperText={errors.notes?.message}
                                            disabled={type === 'View'}
                                            // Optional: Prevent typing a space as the very first character
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === " ") return; // Blocks leading space in real-time
                                                field.onChange(e);
                                            }}
                                        />
                                    )}
                                />
                            </Stack>
                        </Stack>
                    </Box>}
                    {(type === 'Add' || type === 'Edit' || type === 'Copy') && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: '32px !important' }}>
                        <Button
                            variant="outlined"
                            onClick={handleCloseConfirm}
                            size="small"
                            sx={{
                                '&.MuiButton-outlined': {
                                    borderRadius: '4px',
                                    color: '#000',
                                    boxShadow: 'none',
                                    fontSize: '14px',
                                    p: '2px 16px',
                                    bgcolor: '#fff',
                                    fontWeight: 'normal',
                                    ml: 1,
                                    mr: 1,
                                    borderColor: '#000'
                                },
                            }}
                        >
                            Cancel
                        </Button>

                        <Box>
                            {!isLoading && <Button
                                variant="contained"
                                size="small"
                                type='submit'
                                onClick={handleSubmit(onSubmit)}
                                sx={{
                                    '&.MuiButton-contained': {
                                        borderRadius: '4px',
                                        color: '#ffffff',
                                        boxShadow: 'none',
                                        fontSize: '14px',
                                        p: '2px 16px',
                                        bgcolor: '#A22',
                                        fontWeight: 'normal',
                                        ml: 1,
                                    },
                                }}
                            >
                                {(type === 'Add' || type === 'Copy') ? 'Add' : 'Edit'}
                            </Button>
                            }
                            {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                        </Box>
                    </Stack>}
                </Stack>
            </Box>
            <Dialog open={openCustomersList} onClose={handleCloseOfCustomersList} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleCloseOfCustomersList();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '800px',
                        height: 'auto',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <CustomerListTable handleCloseConfirm={handleCloseOfCustomersList} />
                </DialogContent>
            </Dialog>
            <Dialog open={openZoneView} onClose={handleCloseOfZoneView} onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    handleCloseOfZoneView();
                }
            }}
                sx={{
                    '& .MuiDialog-paper': { // Target the paper class
                        width: '800px',
                        height: 'auto',
                        maxHeight: 'none',
                        maxWidth: 'none',
                    }
                }}
            >
                <DialogContent>
                    <ZoneDetails type={actionType} handleCloseConfirm={handleCloseOfZoneView} selectedZoneRowDetails={selectedZoneRowDetails} />
                </DialogContent>
            </Dialog>
        </>
    );
};

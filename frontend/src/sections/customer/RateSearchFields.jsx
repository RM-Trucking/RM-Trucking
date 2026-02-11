import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
    setRateSearchObj, getRateDashboardData, postWarehouseRate,
    putWarehouseRate, setSelectedCurrentRateRow
} from '../../redux/slices/rate';
import RateFieldAndChargeTableWarehouse from '../rate/RateFieldAndChargeTableWarehouse';
import RateFieldAndChargeTable from '../rate/RateFieldAndChargeTable';
import CustomerListTable from '../rate/CustomersListTable';

RateSearchFields.propTypes = {
    padding: PropTypes.number,
    type: PropTypes.string,
    currentTab: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCurrentRateRow: PropTypes.object,
};

export default function RateSearchFields({ padding, type, currentTab, handleCloseConfirm, selectedCurrentRateRow }) {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state?.ratedata?.isLoading);
    const operationalMessage = useSelector((state) => state?.ratedata?.operationalMessage);
    const rateFieldChargeDataWarehouse = useSelector((state) => state?.ratedata?.rateFieldChargeDataWarehouse);
    const [openCustomersList, setOpenCustomersList] = useState(false);
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
    const customerData = [
        {
            customerId: 1,
            customerName: 'Liam Johnson',
            stationName: 'Station 1'
        },
        {
            customerId: 2,
            customerName: 'Emma Thompson',
            stationName: 'Station 2'
        }
    ]

    useEffect(() => {
        if ((type === 'Edit' || type === 'Copy') && selectedCurrentRateRow && currentTab === 'warehouse') {
            setValue('warehouse', selectedCurrentRateRow.warehouse || '');
            setValue('department', selectedCurrentRateRow.department || '');
        }
        if (type === 'Edit' && selectedCurrentRateRow && currentTab === 'transportation') {
            setValue('origin', selectedCurrentRateRow.origin || '');
            setValue('originZipCode', selectedCurrentRateRow.originZipCode || '');
            setValue('destination', selectedCurrentRateRow.destination || '');
            setValue('destinationZipCode', selectedCurrentRateRow.destinationZipCode || '');
            setValue('notes', selectedCurrentRateRow.notes || '');
        }
    }, [selectedCurrentRateRow])
    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
            dispatch(setSelectedCurrentRateRow({}));
            dispatch(setRateSearchObj({}));
        }
    }, [operationalMessage]);

    const onSubmit = (data) => {
        console.log(data);
        dispatch(setRateSearchObj(data));
        if (type === 'Search' && currentTab === 'warehouse') {
            dispatch(getRateDashboardData({ pageNo: 1, pageSize: 10, searchStr: data.warehouse }));
        }
        if ((type === 'Add' || type === 'Copy') && currentTab === 'warehouse') {
            const obj = {
                "minRate": parseFloat(rateFieldChargeDataWarehouse[0]?.charge),
                "ratePerPound": parseFloat(rateFieldChargeDataWarehouse[1]?.charge),
                "maxRate": parseFloat(rateFieldChargeDataWarehouse[2]?.charge),
                "department": data.department,
                "warehouse": data.warehouse
            };
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
    };
    const handleCLear = () => {
        // reset form fields    
        setValue('origin', '');
        setValue('originZipCode', '');
        setValue('destination', '');
        setValue('destinationZipCode', '');
        setValue('warehouse', '');
        dispatch(setRateSearchObj({}));
        if (type === 'Search' && currentTab === 'warehouse') {
            dispatch(getRateDashboardData({ pageNo: 1, pageSize: 10, searchStr: "" }));
        }
    };
    const onClickofCustomerList = () => {
        setOpenCustomersList(true);
    }
    const handleCloseOfCustomersList = () => {
        setOpenCustomersList(false);
    };

    return (
        <>
            {type === 'View' && currentTab === 'transportation' && <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 'normal' }}>Rate ID - {(selectedCurrentRateRow?.rateId && type === 'View') ? selectedCurrentRateRow?.rateId : ''}</Typography>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>}
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4} sx={{ p: padding }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={'flex-end'} justifyContent={type === 'Search' ? 'flex-end' : '"flex-start"'}>
                        {currentTab === 'transportation' && <Controller
                            name="origin"
                            control={control}
                            rules={{ required: 'Origin is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Origin"
                                    variant="standard" fullWidth required
                                    error={!!errors.origin} helperText={errors.origin?.message}
                                    disabled={type === 'View'}
                                >
                                    <MenuItem value="MKE - Zone1">MKE - Zone1</MenuItem>
                                </StyledTextField>
                            )}
                        />}
                        {currentTab === 'transportation' &&
                            <Controller
                                name="originZipCode"
                                control={control}
                                rules={{
                                    required: 'Origin Zip Code is required',
                                    validate: (value) => {
                                        if (!value || value.trim().length === 0) return 'Origin Zip Code cannot be empty';
                                        const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);

                                        for (let s of segments) {
                                            // Check general format
                                            if (!/^(\d{5})(-\d{5})?$/.test(s)) return "Format: 12345 or 12345-67890";

                                            // Range specific validation
                                            if (s.includes('-')) {
                                                const [start, end] = s.split('-');
                                                if (start.substring(0, 3) !== end.substring(0, 3)) {
                                                    return `Prefix mismatch in range: ${s}`;
                                                }
                                                if (parseInt(end.substring(3)) <= parseInt(start.substring(3))) {
                                                    return `End range must be > start in: ${s}`;
                                                }
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
                                        required
                                        error={!!errors.originZipCode}
                                        placeholder="12345, 67890-67895"
                                        helperText={errors.originZipCode?.message}
                                        onChange={(e) => {
                                            let input = e.target.value.replace(/[^\d,-]/g, '');
                                            if (input.startsWith(' ')) return;

                                            let segments = input.split(',');
                                            let lastIdx = segments.length - 1;
                                            let lastSegment = segments[lastIdx];

                                            // --- 1. AUTO-FILL PREFIX LOGIC ---
                                            // If user types hyphen (e.g., 45236-) or starts 6th digit (e.g., 452361)
                                            if (lastSegment.length === 6 && !lastSegment.includes('-')) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment.slice(0, 5) + '-' + prefix + lastSegment.slice(5);
                                            } else if (lastSegment.endsWith('-') && lastSegment.length === 6) {
                                                const prefix = lastSegment.substring(0, 3);
                                                segments[lastIdx] = lastSegment + prefix;
                                            }

                                            // Re-join segments to check current state
                                            let val = segments.join(',');

                                            // --- 2. AUTO-COMMA LOGIC ---
                                            const currentLast = segments[segments.length - 1];
                                            const isFullZip = /^\d{5}$/.test(currentLast);
                                            const isFullRange = /^\d{5}-\d{5}$/.test(currentLast);

                                            // Add comma only if we just completed a valid entry and didn't have a comma
                                            if ((isFullZip || isFullRange) && !input.endsWith(',')) {
                                                // Check suffix math for ranges before adding comma
                                                if (isFullRange) {
                                                    const [start, end] = currentLast.split('-');
                                                    if (parseInt(end.substring(3)) > parseInt(start.substring(3))) {
                                                        val = val + ',';
                                                    }
                                                    // Note: If suffix is invalid, we don't add the comma, 
                                                    // forcing the user to correct it or let 'rules' catch it.
                                                } else {
                                                    val = val + ',';
                                                }
                                            }

                                            onChange(val);
                                        }}
                                        disabled={type === 'View'}
                                    />
                                )}
                            />
                        }
                        {currentTab === 'transportation' && <Controller
                            name="destination"
                            control={control}
                            rules={{ required: 'Destination is required' }}
                            render={({ field }) => (
                                <StyledTextField
                                    {...field}
                                    select
                                    label="Destination"
                                    variant="standard" fullWidth required
                                    disabled={type === 'View'}
                                    error={!!errors.destination} helperText={errors.destination?.message}
                                >
                                    <MenuItem value="MKE - Zone1">MKE - Zone1</MenuItem>
                                </StyledTextField>
                            )}
                        />}
                        {currentTab === 'transportation' && <Controller
                            name="destinationZipCode"
                            control={control}
                            rules={{
                                required: 'Destination Zip Code is required',
                                validate: (value) => {
                                    if (!value || value.trim().length === 0) return 'Destination Zip Code cannot be empty';

                                    const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);

                                    for (let s of segments) {
                                        // 1. General Format Check
                                        if (!/^(\d{5})(-\d{5})?$/.test(s)) return "Use format: 12345 or 12345-67890";

                                        // 2. Range Specific Validation (Prefix & Suffix)
                                        if (s.includes('-')) {
                                            const [start, end] = s.split('-');
                                            const pref1 = start.substring(0, 3);
                                            const pref2 = end.substring(0, 3);
                                            const suff1 = parseInt(start.substring(3));
                                            const suff2 = parseInt(end.substring(3));

                                            if (pref1 !== pref2) return `Prefix mismatch in ${s} (Must start with ${pref1})`;
                                            if (suff2 <= suff1) return `End range must be > ${suff1} in ${s}`;
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
                                    required
                                    placeholder="12345, 67890-67895"
                                    error={!!errors.destinationZipCode}
                                    helperText={errors.destinationZipCode?.message}
                                    onChange={(e) => {
                                        let input = e.target.value.replace(/[^\d,-]/g, '');
                                        if (input.startsWith(' ')) return;

                                        let segments = input.split(',');
                                        let lastIdx = segments.length - 1;
                                        let lastSegment = segments[lastIdx];

                                        // --- 1. AUTO-FILL PREFIX LOGIC ---
                                        // If user types 6th digit (e.g. 452361 -> 45236-4521)
                                        if (lastSegment.length === 6 && !lastSegment.includes('-')) {
                                            const prefix = lastSegment.substring(0, 3);
                                            segments[lastIdx] = lastSegment.slice(0, 5) + '-' + prefix + lastSegment.slice(5);
                                        }
                                        // If user types hyphen manually (e.g. 45236- -> 45236-452)
                                        else if (lastSegment.endsWith('-') && lastSegment.length === 6) {
                                            const prefix = lastSegment.substring(0, 3);
                                            segments[lastIdx] = lastSegment + prefix;
                                        }

                                        let val = segments.join(',');

                                        // --- 2. SMART AUTO-COMMA LOGIC ---
                                        const currentLast = segments[segments.length - 1];
                                        const isFullZip = /^\d{5}$/.test(currentLast);
                                        const isFullRange = /^\d{5}-\d{5}$/.test(currentLast);

                                        if (!input.endsWith(',')) {
                                            if (isFullZip) {
                                                val = val + ',';
                                            } else if (isFullRange) {
                                                // Only add comma if suffix validation passes
                                                const [start, end] = currentLast.split('-');
                                                if (parseInt(end.substring(3)) > parseInt(start.substring(3))) {
                                                    val = val + ',';
                                                }
                                            }
                                        }

                                        onChange(val);
                                    }}
                                    disabled={type === 'View'}
                                    // sx={{
                                    //     '& .MuiFormHelperText-root': {
                                    //         position: 'absolute',
                                    //         top: '-40px', // Adjust based on your label/spacing
                                    //         margin: 0,
                                    //     },
                                    // }}
                                />
                            )}
                        />

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
                        {type === 'Search' && <Button
                            variant="outlined"
                            size="small"
                            // on click clear the values
                            onClick={() => handleCLear()}
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
                                <Button
                                    variant="outlined"
                                    onClick={() => onClickofCustomerList()}
                                    sx={{
                                        height: '30px',
                                        fontWeight: 600,
                                        color: '#fff',
                                        width: '25%',
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
                                    Customer list ({selectedCurrentRateRow?.customers ?? 0})
                                </Button>
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
                            <Button
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
                    <CustomerListTable customerData={customerData} handleCloseConfirm={handleCloseOfCustomersList} />
                </DialogContent>
            </Dialog>
        </>
    );
};

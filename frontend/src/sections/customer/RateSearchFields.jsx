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
    Typography
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import {
    setRateSearchObj, getRateDashboardData, postWarehouseRate,
    putWarehouseRate, setSelectedCurrentRateRow
} from '../../redux/slices/rate';
import RateFieldAndChargeTableWarehouse from '../rate/RateFieldAndChargeTableWarehouse';
import RateFieldAndChargeTable from '../rate/RateFieldAndChargeTable';

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
        if(type === 'Edit' && selectedCurrentRateRow && currentTab === 'transportation'){
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
    useEffect(()=>{
        console.log(type, currentTab);
    },[type,currentTab])

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
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={5} alignItems={'flex-end'} justifyContent={type === 'Search' ? 'flex-end' : '"flex-start"'}>
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
                                    sx={{
                                        width: '20%',
                                    }}
                                    error={!!errors.origin} helperText={errors.origin?.message}
                                    disabled = {type === 'View'}
                                >
                                    <MenuItem value="MKE - Zone1">MKE - Zone1</MenuItem>
                                </StyledTextField>
                            )}
                        />}
                        {currentTab === 'transportation' && <Controller
                            name="originZipCode"
                            control={control}
                            rules={{
                                required: 'Origin Zip Code is required',
                                validate: (value) => {
                                    if (!value || value.trim().length === 0) return 'Origin Zip Code cannot be empty';
                                    const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                                    const zipOrRangeRegex = /^(\d{5})(-\d{5})?$/;
                                    return segments.every(s => zipOrRangeRegex.test(s)) || "Format: 12345 or 12345-67890";
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
                                    sx={{ width: '20%' }}
                                    error={!!errors.originZipCode}
                                    helperText={errors.originZipCode?.message}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/[^\d,-]/g, ''); // Numbers, hyphens, commas only
                                        if (val.startsWith(' ')) return;

                                        const segments = val.split(',');
                                        const lastSegment = segments[segments.length - 1];

                                        // AUTO-COMMA LOGIC
                                        // 1. If last segment is a 5-digit zip code
                                        const isFullZip = /^\d{5}$/.test(lastSegment);
                                        // 2. If last segment is a full range (12345-67890)
                                        const isFullRange = /^\d{5}-\d{5}$/.test(lastSegment);

                                        if ((isFullZip || isFullRange) && !e.target.value.endsWith(',')) {
                                            val = val + ',';
                                        }

                                        onChange(val);
                                    }}
                                    disabled = {type === 'View'}
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
                                    sx={{
                                        width: '20%',
                                    }}
                                    disabled = {type === 'View'}
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
                                    // 1. Check for empty space or null
                                    if (!value || value.trim().length === 0) return 'Destination Zip Code cannot be empty';

                                    // 2. Validate segments (single zip or range)
                                    const segments = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                                    const zipOrRangeRegex = /^(\d{5})(-\d{5})?$/;

                                    return segments.every(s => zipOrRangeRegex.test(s)) || "Use format: 12345 or 12345-67890";
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
                                    sx={{ width: '20%' }}
                                    error={!!errors.destinationZipCode}
                                    helperText={errors.destinationZipCode?.message}
                                    onChange={(e) => {
                                        // Remove non-numeric, non-hyphen, non-comma characters
                                        let val = e.target.value.replace(/[^\d,-]/g, '');

                                        // Block leading space
                                        if (val.startsWith(' ')) return;

                                        const segments = val.split(',');
                                        const lastSegment = segments[segments.length - 1];

                                        // AUTO-COMMA LOGIC
                                        const isFullZip = /^\d{5}$/.test(lastSegment);
                                        const isFullRange = /^\d{5}-\d{5}$/.test(lastSegment);

                                        // Append comma if segment is complete and comma doesn't already exist
                                        if ((isFullZip || isFullRange) && !e.target.value.endsWith(',')) {
                                            val = val + ',';
                                        }

                                        onChange(val);
                                    }}
                                    disabled = {type === 'View'}
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
                    <Box sx={{ mt: 2 }}>
                        {((type === 'Add' || type === 'Edit' || type === 'Copy') && currentTab === 'warehouse') && <RateFieldAndChargeTableWarehouse type={type} />}
                    </Box>
                    <Box>
                        {((type === 'Add' || type === 'Edit' || type === 'View') && currentTab === 'transportation') && <Stack flexDirection={'row'} alignItems={'center'}>
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
                        </Stack>}
                    </Box>
                    {(type === 'Add' || type === 'Edit' || type === 'Copy') && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
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
        </>
    );
};

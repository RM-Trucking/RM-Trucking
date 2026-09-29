import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Typography,
    Stack,
    Divider,
    FormControlLabel,
    Dialog,
    DialogContent, CircularProgress,
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import { postAirportData, putAirportData } from '../../redux/slices/airportcode';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
// ----------------------------------------------------------------------


AirportDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedAirportRowDetails: PropTypes?.object
};

export default function AirportDetails({ type, handleCloseConfirm, selectedAirportRowDetails }) {
    const dispatch = useDispatch();
    const operationalMessage = useSelector((state) => state?.airportcodedata?.operationalMessage);
    const isLoading = useSelector((state) => state?.airportcodedata?.isLoading);
    // Define default values for the form
    const defaultValues = {
       airportCode: '',
         cityCode: '',
         state: '',
         zipCode : '',
    };
    const [readOnly, setReadOnly] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const { control, handleSubmit, watch, getValues, setValue } = useForm({ defaultValues });


    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);
        let obj={};
       
        if (type === 'Add') {
            dispatch(postAirportData(obj));
        }
        if (type === 'Edit') {
           
            dispatch(putAirportData(obj, selectedAirportRowDetails?.customerId));
        }
    };

    useEffect(() => {
        if (operationalMessage && handleCloseConfirm) {
            handleCloseConfirm();
        }
    }, [operationalMessage]);
    useEffect(() => {
        console.log('Selected Customer Details:', selectedAirportRowDetails);
        setValue('airportCode', selectedAirportRowDetails?.airportCode || '');
        setValue('cityCode', selectedAirportRowDetails?.cityCode || '');
        setValue('state', selectedAirportRowDetails?.state || '');
        setValue('zipCode', selectedAirportRowDetails?.zipCode || '');
       
    }, [selectedAirportRowDetails]);
    useEffect(() => {
        if (type === 'View') {
            setReadOnly(true);
        } else {
            setReadOnly(false);
        }
    }, [type]);
    // dialog actions and functions
    const handleAlert = () => {
        setOpenConfirmDialog(false);
    };

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Airport Code Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2, mt:2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                       

                        <Controller
                            name="airportCode"
                            control={control}
                            rules={{
                                required: 'Airport Code is required',
                                maxLength: {
                                    value: 3,
                                    message: 'Airport Code cannot exceed 3 characters'
                                },
                                minLength: {
                                    value: 3,
                                    message: 'Airport Code must be exactly 3 characters'
                                },
                                pattern: {
                                    value: /^[A-Z0-9]{3}$/i,
                                    message: 'Airport Code must be alphanumeric (letters/numbers)'
                                }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
                                    // Intercept onChange to format as uppercase and restrict length/spaces
                                    onChange={(e) => {
                                        let value = e.target.value.toUpperCase().replace(/\s/g, ''); // Uppercase & remove spaces
                                        if (value.length <= 3) {
                                            field.onChange(value);
                                        }
                                    }}
                                    label="Airport Code *"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 3 // Hard browser-level constraint to block 4th character
                                        }
                                    }}
                                />
                            )}
                        />

                        <Controller
                                name="cityCode"
                                control={control}
                                rules={{
                                    required: 'City Code is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'City code cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'City cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="City code*" // Added asterisk to visually mark it required
                                        disabled={readOnly}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays the required or validation error messages
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />

                            <Controller
                                name="state"
                                control={control}
                                rules={{
                                    required: 'State is required', // NEW: Enforces the required rule
                                    maxLength: {
                                        value: 100,
                                        message: 'State cannot exceed 100 characters'
                                    },
                                    validate: (value) => !value || value.trim().length > 0 || 'State cannot be only spaces'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        variant="standard"
                                        {...field}
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith(' ')) {
                                                field.onChange(value.trimStart());
                                            } else {
                                                field.onChange(value);
                                            }
                                        }}
                                        label="State*" // Added asterisk to visually mark it required
                                        disabled={readOnly}
                                        error={!!error}
                                        helperText={error ? error.message : ''} // NEW: Displays validation error text underneath the input
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                            />


                            <Controller
                                name="zipCode"
                                control={control}
                                rules={{
                                    required: 'Zipcode is required', // NEW: Enforces the required rule
                                    validate: (value) => {
                                        // Empty strings are intercepted cleanly by the required property above
                                        if (!value) return true;

                                        // 1. Block "all zeros"
                                        const rawDigits = value.replace(/[^\d]/g, '');
                                        if (/^0+$/.test(rawDigits)) return 'Invalid Zip Code (cannot be all zeros)';

                                        // 2. Strict Length/Format check
                                        // Check if it matches exactly 5 digits OR exactly 5-5 digits (11 total characters)
                                        const zipRegex = /(^\d{5}$)|(^\d{5}-\d{5}$)/;
                                        if (!zipRegex.test(value)) {
                                            return 'Zip Code must be exactly 5 digits or a range (#####-#####)';
                                        }

                                        // 3. Range-specific constraints (only if a range is present)
                                        if (value.includes('-')) {
                                            const parts = value.split('-');
                                            const firstZip = parts[0];
                                            const secondZip = parts[1];

                                            // Ensure the first 3 digits of both segments match perfectly
                                            if (firstZip.slice(0, 3) !== secondZip.slice(0, 3)) {
                                                return `End range prefix must match '${firstZip.slice(0, 3)}'`;
                                            }

                                            // Ensure the last 2 digits of the second segment are strictly greater
                                            const startSuffix = parseInt(firstZip.slice(-2), 10);
                                            const endSuffix = parseInt(secondZip.slice(-2), 10);

                                            if (endSuffix === startSuffix) return 'End range cannot be equal to start';
                                            if (endSuffix < startSuffix) return 'End range must be greater than start';
                                        }

                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        value={value || ''}
                                        onChange={(e) => {
                                            const input = e.target.value;
                                            // Allow only digits and a single dash character
                                            let raw = input.replace(/[^\d-]/g, '');

                                            // Detect backspacing/deletion
                                            const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';

                                            if (!isDeleting && raw.length === 5 && !raw.includes('-')) {
                                                // Auto-append dash only when typing forwards past the 5th digit
                                                raw = `${raw}-`;
                                            }

                                            // Prevent typing more than 11 characters (#####-#####)
                                            onChange(raw.slice(0, 11));
                                        }}
                                        inputProps={{ maxLength: 11, inputMode: 'numeric' }}
                                        label="Zip Code*" // Added asterisk to visually mark it required
                                        error={!!error}
                                        helperText={error?.message || 'Ex: 12345 or 12345-12346'}
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '20%' }}
                                        disabled={readOnly}
                                    />
                                )}
                            />

                    </Stack>

                </Stack>
                {(type === 'Add' || type === 'Edit') && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
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
                                mb: 1,
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
                                    mb: 1
                                },
                            }}
                        >
                            {type === 'Add' ? 'Add' : 'Edit'}
                        </Button>
                        }
                        {isLoading && <CircularProgress color="inherit" size={16} sx={{ ml: 1 }} />}
                    </Box>
                </Stack>}
                {/* {type === 'View' && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
                    <Button
                        variant="outlined"
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
                                mb: 1,
                                mr: 1,
                                borderColor: '#000'
                            },
                        }}
                    >
                        Cancel
                    </Button>
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
                                mb: 1
                            },
                        }}
                    >
                        Save
                    </Button>
                </Stack>} */}
            </Box>
        </>
    );
}

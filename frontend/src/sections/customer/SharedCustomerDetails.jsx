import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Box,
    Typography,
    Stack,
    Divider,
    FormControlLabel,
    MenuItem,
} from '@mui/material';
import StyledTextField from '../shared/StyledTextField';
import StyledCheckbox from '../shared/StyledCheckBox';
import { useDispatch, useSelector } from '../../redux/store';
import Iconify from '../../components/iconify';
import CustomerViewStationTable from './CustomerViewStationTable';
import { setTableBeingViewed } from '../../redux/slices/customer';
// ----------------------------------------------------------------------


SharedCustomerDetails.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func,
    selectedCustomerRowDetails: PropTypes?.object
};

export default function SharedCustomerDetails({ type, handleCloseConfirm, selectedCustomerRowDetails }) {
    const dispatch = useDispatch();
    // Define default values for the form
    const defaultValues = {
        customerName: '',
        rmAccountNo: '92898292989289',
        phoneNumber: '',
        website: '',
        corpAddressLine1: '',
        corpAddressLine2: '',
        corpCity: '',
        corpState: '',
        corpZipCode: '',
        sameAsCorporate: false,
        billAddressLine1: '',
        billAddressLine2: '',
        billCity: '',
        billState: '',
        billZipCode: '',
        customerNotes: '',
        customerStatus: '',
        reasonForStatus: ''
    };

    const { control, handleSubmit, watch, getValues, setValue } = useForm({ defaultValues });

    // Watch the checkbox value to conditionally render billing address
    const sameAsCorporate = watch('sameAsCorporate');

    const onSubmit = (data) => {
        console.log('Form Submitted (RHF Data):', data);
    };
    useEffect(() => {
        dispatch(setTableBeingViewed('station'));
    }, []);
    useEffect(() => {
        console.log('Selected Customer Details:', selectedCustomerRowDetails);
        setValue('customerName', selectedCustomerRowDetails?.customerName || '');
        setValue('rmAccountNo', selectedCustomerRowDetails?.rmAccountNo || '');
        setValue('phoneNumber', selectedCustomerRowDetails?.customerPhNo || '');
        setValue('website', selectedCustomerRowDetails?.customerWebsite || '');
        setValue('corpAddressLine1', selectedCustomerRowDetails?.corpAddressLine1 || '');
        setValue('corpAddressLine2', selectedCustomerRowDetails?.corpAddressLine2 || '');
        setValue('corpCity', selectedCustomerRowDetails?.corpCity || '');
        setValue('corpState', selectedCustomerRowDetails?.corpState || '');
        setValue('corpZipCode', selectedCustomerRowDetails?.corpZipCode || '');
        setValue('sameAsCorporate', false);
        setValue('billAddressLine1', selectedCustomerRowDetails?.billAddressLine1 || '');
        setValue('billAddressLine2', selectedCustomerRowDetails?.billAddressLine2 || '');
        setValue('billCity', selectedCustomerRowDetails?.billCity || '');
        setValue('billState', selectedCustomerRowDetails?.billState || '');
        setValue('billZipCode', selectedCustomerRowDetails?.billZipCode || '');
        setValue('customerNotes', selectedCustomerRowDetails?.notes || '');
    }, [selectedCustomerRowDetails]);

    return (
        <>
            {/* header  */}
            <>
                <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Details</Typography>
                    {type === 'Add' && <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />}
                </Stack>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
            </>
            {/* form  */}
            <Box component="form" sx={{ pt: 2, pb: 2 }}>
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        <Controller
                            name="customerName"
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                        width: '25%',
                                    }}
                                    label="Customer Name *"
                                    error={!!error}
                                    helperText={error ? 'Name is required' : ''}
                                />
                            )}
                        />
                        <Controller
                            name="rmAccountNo"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField variant="standard" sx={{ width: '25%' }} {...field} fullWidth label="Account Number" />
                            )}
                        />
                        <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState: { error } }) => (
                                <StyledTextField
                                    {...field}
                                    variant="standard"
                                    fullWidth
                                    sx={{ width: '25%' }}
                                    label="Customer Phone Number *"
                                    error={!!error}
                                    helperText={error ? 'Phone number is required' : ''}
                                />
                            )}
                        />
                        <Controller
                            name="website"
                            control={control}
                            render={({ field }) => (
                                <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '25%' }} label="Customer Website" />
                            )}
                        />
                    </Stack>

                    {/* Corporate Address Section */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Corporate Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            <Controller
                                name="corpAddressLine1"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 1" />
                                )}
                            />
                            <Controller
                                name="corpAddressLine2"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Address Line 2" />
                                )}
                            />
                            <Controller
                                name="corpCity"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="City" />
                                )}
                            />
                            <Controller
                                name="corpState"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="State" />
                                )}
                            />
                            <Controller
                                name="corpZipCode"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField sx={{ width: '20%' }} variant="standard" {...field} fullWidth label="Zip Code" />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* Checkbox for Billing Address */}
                    <Controller
                        name="sameAsCorporate"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        {...field}
                                        checked={field.value}
                                    />
                                }
                                label="Check if above Corporate Address is same for Billing Address"
                            />
                        )}
                    />

                    {/* Billing Address Section - Conditionally rendered */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Billing Address &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
                            <Controller
                                name="billAddressLine1"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }} label="Address Line 1" />
                                )}
                            />
                            <Controller
                                name="billAddressLine2"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }} label="Address Line 2" />
                                )}
                            />
                            <Controller
                                name="billCity"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }} label="City" />
                                )}
                            />
                            <Controller
                                name="billState"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }} label="State" />
                                )}
                            />
                            <Controller
                                name="billZipCode"
                                control={control}
                                render={({ field }) => (
                                    <StyledTextField variant="standard" {...field} fullWidth sx={{ width: '20%' }} label="Zip Code" />
                                )}
                            />
                        </Stack>
                    </fieldset>

                    {/* customer notes */}
                    <Controller
                        name="customerNotes"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState: { error } }) => (
                            <StyledTextField variant="standard" {...field} fullWidth label="Customer Notes *" error={!!error}
                                helperText={error ? 'Customer notes is required' : ''} />
                        )}
                    />

                    {/* status section  */}
                    <fieldset>
                        <legend><Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Status &nbsp;</Typography></legend>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} sx={{ mb: 2 }}>
                            <Controller
                                name="customerStatus"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        select // This turns the TextField into a Select
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Customer Status*"
                                        error={!!error}
                                        helperText={error ? 'Customer status is required' : ''}
                                    >
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                            <Controller
                                name="reasonForStatus"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState: { error } }) => (
                                    <StyledTextField
                                        {...field}
                                        select // This turns the TextField into a Select
                                        variant="standard"
                                        fullWidth
                                        sx={{ width: '25%' }}
                                        label="Reason For Status*"
                                        error={!!error}
                                        helperText={error ? 'Reason is required' : ''}
                                    >
                                        <MenuItem value="payment_defaulter">Payment Defaulter</MenuItem>
                                    </StyledTextField>
                                )}
                            />
                        </Stack>
                    </fieldset>

                </Stack>
                {type === 'Add' || type === 'Edit' && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
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
                        {type === 'Add' ? 'Add' : 'Edit'}
                    </Button>
                </Stack>}
                {type === 'View' && <Stack flexDirection={'row'} alignItems={'center'} sx={{ mt: 4 }}>
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
                </Stack>}
            </Box>
            {/* station table */}
            {
                type === 'View' && <CustomerViewStationTable />
            }
        </>
    );
}

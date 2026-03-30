import React, { useState } from 'react'; 

import { useForm, Controller } from 'react-hook-form'; 

import { 

  Box, 

  Stepper, 

  Step, 

  StepLabel, 

  Typography, 

  TextField, 

  MenuItem, 

  Button, 

  Paper, 

  Alert, 

  Snackbar, 

} from '@mui/material'; 

import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers'; 

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; 

import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';

 

// --- CONSTANTS & LISTS --- 
const shipmentTypes = [

  'Air Import', 

  'Air Export', 

  'Ocean Import', 

  'Ocean Export', 

  'Domestic', 

  'Non-Forwarder Domestic', 

]; 

 

const serviceLevels = [ 

  'Regular', 

  'Dedicated Truck', 

  'Special Deliveries', 

  'Conventions', 

  'Weekend (Date Specific)', 

  'Special Deliveries (Date Specific)', 

  'Conventions (Date Specific)', 

]; 

 

const customers = ['Customer 1', 'Customer 2', 'Customer 3']; 


 

const ShipmentForm = () => { 

  const [activeStep, setActiveStep] = useState(0); 

  const [errorVisible, setErrorVisible] = useState(false); 

 

  const { 

    control, 

    trigger, 

    formState: { errors }, 

    reset, 

  } = useForm({ 

    defaultValues: { 

      // Step 0 

      shipmentType: '', 

      serviceLevel: '', 

      date: null, 

      time: null, 

      // Step 1 - Customer 

      billingCustomer: '', 

      originAirport: '', 

      destinationAirport: '', 

      // Step 1 - Shipper 

      shipperName: '', 

      shipperAddr1: '', 

      shipperAddr2: '', 

      shipperCity: '', 

      shipperZip: '', 

      shipperContact: '', 

      shipperPhone: '', 

      // Step 1 - Consignee 

      consigneeName: '', 

      consigneeAddr1: '', 

      consigneeAddr2: '', 

      consigneeCity: '', 

      consigneeZip: '', 

      consigneeContact: '', 

      consigneePhone: '', 

    }, 

  }); 

 

  const handleNext = async () => { 

    let fieldsToValidate = []; 

    if (activeStep === 0) { 

      fieldsToValidate = ['shipmentType', 'serviceLevel', 'date', 'time']; 

    } else if (activeStep === 1) { 

      fieldsToValidate = [ 

        'billingCustomer', 

        'originAirport', 

        'destinationAirport', 

        'shipperZip', 

        'consigneeZip', 

        'shipperPhone', 

        'consigneePhone', 

      ]; 

    } 

 

    const isValid = await trigger(fieldsToValidate); 

    if (isValid) { 

      setActiveStep((prev) => prev + 1); 

    } else { 

      setErrorVisible(true); 

    } 

  }; 

 

  const handleBack = () => setActiveStep((prev) => prev - 1); 

 

  const commonBtnStyle = { 

    height: '24px', 

    fontWeight: 600, 

    textTransform: 'none', 

    borderRadius: '4px', 

    boxShadow: 'none', 

    px: 2, 

    fontSize: '0.8rem', 

  }; 

 

  // --- HELPER: RENDER ZIP CODE --- 

  const renderZipCodeField = (name) => ( 

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}> 

      <Controller 

        name={name} 

        control={control} 

        rules={{ 

          validate: (value) => { 

            if (!value || value.length <= 5) return true; 

            const parts = value.split('-'); 

            if (parts.length === 2 && parts[1].length === 5) { 

              const startSuffix = parseInt(parts[0].slice(-2)); 

              const endSuffix = parseInt(parts[1].slice(-2)); 

              if (endSuffix === startSuffix) return 'End range cannot be equal to start'; 

              if (endSuffix < startSuffix) return 'End range must be greater than start'; 

              return true; 

            } 

            return 'Complete the range (#####-#####)'; 

          }, 

        }} 

        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => ( 

          <TextField 

            {...field} 

            variant="standard" 

            fullWidth 

            label="Zip Code" 

            error={!!error} 

            helperText={error?.message || 'Ex: 12345 or 12345-12346'} 

            value={value || ''} 

            inputProps={{ maxLength: 11 }} 

            onChange={(e) => { 

              const input = e.target.value; 

              const raw = input.replace(/[^\d]/g, ''); 

              const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward'; 

              if (!input || raw.length === 0 || (isDeleting && (input.length <= 5 || !input.includes('-')))) { 

                onChange(raw.slice(0, 5)); 

                return; 

              } 

              let formatted = ''; 

              if (raw.length <= 5) { 

                formatted = raw; 

              } else { 

                const first5 = raw.slice(0, 5); 

                const prefix = first5.slice(0, 3); 

                let suffixPart = raw.slice(5); 

                if (!suffixPart.startsWith(prefix)) { 

                  const userTypedDigits = suffixPart.replace(prefix, '').slice(0, 2); 

                  suffixPart = prefix + userTypedDigits; 

                } 

                formatted = `${first5}-${suffixPart.slice(0, 5)}`; 

              } 

              onChange(formatted); 

            }} 

          /> 

        )} 

      /> 

    </Box> 

  ); 

 

  // --- HELPER: RENDER PHONE FIELD --- 

  const renderPhoneField = (name, label) => ( 

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}> 

      <Controller 

        name={name} 

        control={control} 

        rules={{ 

          required: 'Phone number is required', 

          maxLength: { value: 20, message: 'Phone number cannot exceed 20 characters' }, 

          pattern: { 

            value: /^\(\d{3}\) \d{3}-\d{4}.*$/, 

            message: 'Invalid phone format', 

          }, 

        }} 

        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => ( 

          <TextField 

            {...field} 

            value={value || ''} 

            variant="standard" 

            fullWidth 

            label={`${label} *`} 

            inputProps={{ maxLength: 20 }} 

            error={!!error} 

            helperText={error ? error.message : ''} 

            onChange={(e) => { 

              const val = e.target.value; 

              if (val.startsWith(' ')) return; 

              const formattedValue = formatPhoneNumber(val).slice(0, 20); 

              onChange(formattedValue); 

            }} 

          /> 

        )} 

      /> 

    </Box> 

  ); 

 

  const renderTextField = (name, label, required = false) => ( 

    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}> 

      <Controller 

        name={name} 

        control={control} 

        rules={{ required }} 

        render={({ field }) => ( 

          <TextField 

            {...field} 

            fullWidth 

            label={`${label}${required ? ' *' : ''}`} 

            variant="standard" 

            error={!!errors[name]} 

          /> 

        )} 

      /> 

    </Box> 

  ); 

 

  return ( 

    <LocalizationProvider dateAdapter={AdapterDayjs}> 

      <Box sx={{ p: 2, mt: 2 }}> 

        {/* HEADER & STEPPER */} 

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}> 

          <Box display={'flex'} alignItems={'center'}> 

            <Iconify icon="weui:back-filled" sx={{ mr: 1 }} /> 

            <Typography variant="subtitle2" fontWeight="bold">New Shipment</Typography> 

          </Box> 

 

          <Stepper 

            activeStep={activeStep} 

            alternativeLabel 

            sx={{ 

              width: { xs: '100%', md: '45%' }, 

              '& .MuiStepIcon-root': { color: '#000' }, 

              '& .MuiStepIcon-text': { fill: '#fff', fontWeight: 'bold' }, 

              '& .MuiStepConnector-line': { borderColor: '#000' }, 

            }} 

          > 

            {[1, 2, 3, 4, 5].map((_, i) => ( 

              <Step key={i}><StepLabel /></Step> 

            ))} 

          </Stepper> 

 

          <Box sx={{ display: 'flex', gap: 1 }}> 

            {activeStep > 0 && ( 

              <Button variant="outlined" onClick={handleBack} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Back</Button> 

            )} 

            <Button variant="outlined" onClick={() => { reset(); setActiveStep(0); }} sx={{ ...commonBtnStyle, color: '#000', borderColor: '#000' }}>Cancel</Button> 

            <Button variant="contained" onClick={handleNext} sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}> 

              {activeStep === 4 ? 'Finish' : 'Next'} 

            </Button> 

          </Box> 

        </Box> 

 

        {/* STEP 0 */} 

        {activeStep === 0 && ( 

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}> 

            <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>Shipment Details</Typography> 

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}> 

              <Box sx={{ flex: '1 1 22%' }}> 

                <Controller 

                  name="shipmentType" 

                  control={control} 

                  rules={{ required: true }} 

                  render={({ field }) => ( 

                    <TextField {...field} select fullWidth label="Type of Shipment *" variant="standard" error={!!errors.shipmentType}> 

                      {shipmentTypes.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))} 

                    </TextField> 

                  )} 

                /> 

              </Box> 

              <Box sx={{ flex: '1 1 22%' }}> 

                <Controller 

                  name="serviceLevel" 

                  control={control} 

                  rules={{ required: true }} 

                  render={({ field }) => ( 

                    <TextField {...field} select fullWidth label="Service Level *" variant="standard" error={!!errors.serviceLevel}> 

                      {serviceLevels.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))} 

                    </TextField> 

                  )} 

                /> 

              </Box> 

              <Box sx={{ flex: '1 1 22%' }}> 

                <Controller 

                  name="date" 

                  control={control} 

                  rules={{ required: true }} 

                  render={({ field }) => ( 

                    <DatePicker {...field} label="Select Date *" slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.date } }} /> 

                  )} 

                /> 

              </Box> 

              <Box sx={{ flex: '1 1 22%' }}> 

                <Controller 

                  name="time" 

                  control={control} 

                  rules={{ required: true }} 

                  render={({ field }) => ( 

                    <TimePicker {...field} label="Select Time *" ampm={false} slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.time } }} /> 

                  )} 

                /> 

              </Box> 

            </Box> 

          </Paper> 

        )} 

 

        {/* STEP 1 */} 

        {activeStep === 1 && ( 

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}> 

            <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>Customer Details</Typography> 

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}> 

              <Box sx={{ flex: '1 1 30%' }}> 

                <Controller name="billingCustomer" control={control} rules={{ required: true }} render={({ field }) => ( 

                  <TextField {...field} select fullWidth label="Billing Customer *" variant="standard" error={!!errors.billingCustomer}> 

                    {customers.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))} 

                  </TextField> 

                )} /> 

              </Box> 

              {renderTextField('originAirport', 'Origin Airport Code', true)} 

              {renderTextField('destinationAirport', 'Destination Airport Code', true)} 

            </Box> 

 

            {/* Shipper Section */} 

            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 4, position: 'relative' }}> 

              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Shipper Details</Typography> 

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}> 

                {renderTextField('shipperName', 'Shipper Name')} 

                {renderTextField('shipperAddr1', 'Address Line 1')} 

                {renderTextField('shipperAddr2', 'Address Line 2')} 

                {renderTextField('shipperCity', 'City')} 

                {renderZipCodeField('shipperZip')} 

                {renderTextField('shipperContact', 'Contact Person Name')} 

                {renderPhoneField('shipperPhone', 'Phone Number')} 

              </Box> 

            </Box> 

 

            {/* Consignee Section */} 

            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, position: 'relative' }}> 

              <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 15, bgcolor: '#fff', px: 1, fontWeight: 'bold' }}>Consignee Details</Typography> 

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}> 

                {renderTextField('consigneeName', 'Consignee Name')} 

                {renderTextField('consigneeAddr1', 'Address Line 1')} 

                {renderTextField('consigneeAddr2', 'Address Line 2')} 

                {renderTextField('consigneeCity', 'City')} 

                {renderZipCodeField('consigneeZip')} 

                {renderTextField('consigneeContact', 'Contact Person Name')} 

                {renderPhoneField('consigneePhone', 'Phone Number')} 

              </Box> 

            </Box> 

          </Paper> 

        )} 

 

        {activeStep > 1 && ( 

          <Paper sx={{ p: 10, textAlign: 'center' }} variant="outlined"> 

            <Typography variant="h5">Step {activeStep + 1} Content</Typography> 

          </Paper> 

        )} 

 

        <Snackbar open={errorVisible} autoHideDuration={3000} onClose={() => setErrorVisible(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}> 

          <Alert severity="error" variant="filled">Please check required fields.</Alert> 

        </Snackbar> 

      </Box> 

    </LocalizationProvider> 

  ); 

}; 

 

export default ShipmentForm; 
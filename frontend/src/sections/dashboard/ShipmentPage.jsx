import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Stepper, Step, StepLabel, Typography, TextField,
  MenuItem, Button, Paper, Alert, Snackbar
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Iconify from '../../components/iconify';
 
const shipmentTypes = ['Air Import', 'Air Export', 'Ocean Import', 'Ocean Export', 'Domestic', 'Non-Forwarder Domestic'];
const serviceLevels = ['Regular', 'Dedicated Truck', 'Special Deliveries', 'Conventions', 'Weekend (Date Specific)', 'Special Deliveries (Date Specific)', 'Conventions (Date Specific)'];
 
const ShipmentForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [errorVisible, setErrorVisible] = useState(false);
 
  const { control, formState: { errors }, trigger } = useForm({
    defaultValues: {
      shipmentType: '',
      serviceLevel: '',
      date: null,
      time: null,
    }
  });
 
  const handleNext = async () => {
    const isValid = await trigger(['shipmentType', 'serviceLevel', 'date', 'time']);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    } else {
      setErrorVisible(true);
    }
  };
 
  const commonBtnStyle = {
    height: '22px',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '4px',
    boxShadow: 'none',
    p: '2px 16px',
  };
 
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, mt: 2 }}>
        
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 15 }}>
          <Box display={'flex'} alignItems={'center'}>
            <Iconify icon="weui:back-filled" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" fontWeight="bold">New Shipment</Typography>
          </Box>
 
          <Stepper activeStep={activeStep} alternativeLabel sx={{ width: { xs: '100%', md: '50%' } }}>
            {[1, 2, 3, 4, 5].map((label) => (
              <Step key={label}><StepLabel /></Step>
            ))}
          </Stepper>
 
          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              sx={{ ...commonBtnStyle, mr: 1, color: '#000', borderColor: '#000' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ ...commonBtnStyle, bgcolor: '#a22', '&:hover': { bgcolor: '#811' } }}
            >
              {activeStep === 4 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </Box>
 
        {activeStep === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>
              Shipment Details
            </Typography>
 
            {/* FLEXBOX CONTAINER FOR FIELDS */}
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3, // Spacing between items
              width: '100%'
            }}>
              
              {/* Type of Shipment - Growing to take more space if needed */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' } }}>
                <Controller
                  name="shipmentType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select fullWidth label="Type of Shipment *" variant="standard"
                      error={!!errors.shipmentType}
                    >
                      {shipmentTypes.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Box>
 
              {/* Service Level */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' } }}>
                <Controller
                  name="serviceLevel"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select fullWidth label="Service Level *" variant="standard"
                      error={!!errors.serviceLevel}
                    >
                      {serviceLevels.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Box>
 
              {/* Date Picker */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' } }}>
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Select Date *"
                      slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.date } }}
                    />
                  )}
                />
              </Box>
 
              {/* Time Picker */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' } }}>
                <Controller
                  name="time"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TimePicker
                      {...field}
                      label="Select Time *"
                      ampm={false}
                      slotProps={{ textField: { variant: 'standard', fullWidth: true, error: !!errors.time } }}
                    />
                  )}
                />
              </Box>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ p: 10, textAlign: 'center' }}>
            <Typography variant="h5">Step {activeStep + 1} Content</Typography>
            <Button sx={{ mt: 2 }} onClick={() => setActiveStep(prev => prev - 1)}>Back</Button>
          </Paper>
        )}
 
        <Snackbar
          open={errorVisible}
          autoHideDuration={3000}
          onClose={() => setErrorVisible(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="error" variant="filled">
            Please fill in all required fields.
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};
 
export default ShipmentForm;
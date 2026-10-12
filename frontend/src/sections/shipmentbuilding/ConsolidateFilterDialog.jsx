import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    MenuItem,
    Button,
    Box,
    Stack,
    Typography
} from '@mui/material';
import { Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';

export default function ConsolidateFilterDialog({ open, handleClose, control, errors, handleSubmit, onSubmit }) {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    border: '3px solid #2196f3', // Matches the blue layout frame in your image
                    boxSizing: 'border-box'
                }
            }}
        >
            {/* Dialog Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    Consolidate Filter
                </Typography>
                <IconButton aria-label="close" onClick={handleClose} sx={{ color: '#888' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Form Content Wrapper synced to parent react-hook-form handleSubmit */}
            <Box component="form" sx={{ width: '100%', boxSizing: 'border-box' }}>
                <DialogContent sx={{ px: 3, py: 1, overflowX: 'hidden' }}>

                    {/* Main Master Stack containing the 3 rows */}
                    <Stack direction="column" spacing={4} sx={{ width: '100%' }}>

                        {/* ROW 1: Routing, Agent, Customer */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ width: '100%' }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="routing"
                                    control={control}
                                    rules={{ required: 'Routing is required' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Select Routing"
                                            error={!!errors.routing}
                                            helperText={errors.routing ? errors.routing.message : ' '}
                                            required
                                        >
                                            <MenuItem value="PICKUP_LINE_HAUL_DELIVERY">
                                                Pickup Linehaul Delivery
                                            </MenuItem>
                                            <MenuItem value="PICKUP_LINE_HAUL">
                                                Pickup Linehaul
                                            </MenuItem>
                                            <MenuItem value="LINE_HAUL_ONLY">
                                                Linehaul Only
                                            </MenuItem>
                                            <MenuItem value="LINE_HAUL_DELIVERY">
                                                Linehaul Delivery
                                            </MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="agent"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Select Agent"
                                            error={!!errors.agent}
                                            helperText={errors.agent ? errors.agent.message : ' '}
                                        >
                                            <MenuItem value="Cal Sierra">Cal Sierra</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="customer"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Select Customer"
                                            error={!!errors.customer}
                                            helperText={errors.customer ? errors.customer.message : ' '}
                                        >
                                            <MenuItem value="Oliver">Oliver</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </Stack>

                        {/* ROW 2: Origin, Origin State, Origin City */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ width: '100%' }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="origin"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Origin"
                                            error={!!errors.origin}
                                            helperText={errors.origin ? errors.origin.message : ' '}
                                        >
                                            <MenuItem value="Austin, Texas">Austin, Texas</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="originState"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Origin - State"
                                            error={!!errors.originState}
                                            helperText={errors.originState ? errors.originState.message : ' '}
                                        >
                                            <MenuItem value="Austin">Austin</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="originCity"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Origin - City"
                                            error={!!errors.originCity}
                                            helperText={errors.originCity ? errors.originCity.message : ' '}
                                        >
                                            <MenuItem value="Texas">Texas</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </Stack>

                        {/* ROW 3: Destination, Destination State, Destination City */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ width: '100%' }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="destination"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Destination"
                                            error={!!errors.destination}
                                            helperText={errors.destination ? errors.destination.message : ' '}
                                        >
                                            <MenuItem value="Miami, Florida">Miami, Florida</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="destinationState"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Destination - State"
                                            error={!!errors.destinationState}
                                            helperText={errors.destinationState ? errors.destinationState.message : ' '}
                                        >
                                            <MenuItem value="Florida">Florida</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0px' } }}>
                                <Controller
                                    name="destinationCity"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            variant="standard"
                                            label="Destination - City"
                                            error={!!errors.destinationCity}
                                            helperText={errors.destinationCity ? errors.destinationCity.message : ' '}
                                        >
                                            <MenuItem value="Miami">Miami</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </Stack>

                    </Stack>
                </DialogContent>
            </Box>

            {/* Action Controls Section */}
            <DialogActions sx={{ p: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    sx={{
                        color: '#333',
                        borderColor: '#888',
                        borderRadius: '6px',
                        textTransform: 'none',
                        px: 4,
                        fontWeight: 500,
                        '&:hover': { borderColor: '#555', bgcolor: '#fafafa' }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    sx={{
                        bgcolor: '#a22',
                        color: '#fff',
                        borderRadius: '6px',
                        textTransform: 'none',
                        px: 4,
                        fontWeight: 500,
                        '&:hover': { bgcolor: '#811' }
                    }}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
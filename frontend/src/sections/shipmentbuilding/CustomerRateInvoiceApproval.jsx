import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Closest standard MUI truck icon

export default function CustomerRateInvoiceApproval({ open, handleClose, handleSubmit, amount }) {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                },
            }}
        >
            {/* Title Header with Close Button */}
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1a1a1a' }}>
                    Customer rate Invoice Approval
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        color: '#000',
                        padding: '4px',
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {/* Styled Divider underneath title */}
            <Box sx={{ borderBottom: '1px solid #e0e0e0', mx: 2 }} />

            {/* Content Area */}
            <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
                {/* Truck Icon Visual Anchor */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <LocalShippingIcon sx={{ fontSize: 64, color: '#bdbdbd', transform: 'scaleX(-1)' }} />
                </Box>

                {/* Primary Alert Message */}
                <Typography variant="body1" sx={{ mb: 3, color: '#333', lineHeight: 1.5, fontWeight: 500 }}>
                    Are you sure you to submit the Invoice Approval for Customer rate & the total amount{' '}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                        ${amount}
                    </Box>
                </Typography>

                {/* Secondary Context Message */}
                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5 }}>
                    Once approved, the amount cannot be changed or reverted.
                    <br />
                    Do you want to continue?
                </Typography>
            </DialogContent>

            {/* Action Buttons */}
            <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
                {/* Cancel Button */}
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        flex: 1,
                        maxWidth: '140px',
                        textTransform: 'none',
                        borderRadius: '8px',
                        borderColor: '#555',
                        color: '#000',
                        fontWeight: 600,
                        '&:hover': {
                            borderColor: '#000',
                            backgroundColor: '#f5f5f5',
                        },
                    }}
                >
                    Cancel
                </Button>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        flex: 1,
                        maxWidth: '140px',
                        textTransform: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#a61c1c', // Deep red match from your image
                        color: '#fff',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: '#821414',
                            boxShadow: 'none',
                        },
                    }}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

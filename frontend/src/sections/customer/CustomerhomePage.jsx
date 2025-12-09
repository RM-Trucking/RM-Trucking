import { useState, useEffect } from 'react';
import {
    Box, Stack, Typography, Button, Divider, Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import SharedSearchField from '../shared/SharedSearchField';
import ErrorFallback from '../shared/ErrorBoundary';
import CustomerHomePageTable from './CustomerHomePageTable';
import Iconify from '../../components/iconify';
import SharedCustomerDetails from './SharedCustomerDetails';
// ----------------------------------------------------------------------


export default function CustomerhomePage() {

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const onClickOfNewCustomer = () => {
        setOpenConfirmDialog(true);
    }
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
    };

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
                <SharedHomePageHeader title="Customers" buttonText='New Customer' onButtonClick={onClickOfNewCustomer} />
                <SharedSearchField page="customers" />
                <CustomerHomePageTable />

                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1543px',
                            height: '520px',
                            maxHeight : 'none',
                            maxWidth : 'none',
                        }
                    }}
                >
                    <DialogTitle >
                        <>
                            <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Details</Typography>
                                <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                        </>
                    </DialogTitle>
                    <DialogContent>
                        <SharedCustomerDetails type={'Add'} handleCloseConfirm={handleCloseConfirm}/>
                    </DialogContent>
                </Dialog>
            </ErrorBoundary>

        </>
    );
}

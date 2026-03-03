import { useState, useEffect } from 'react';
import {
    Box, Stack, Typography, Button, Divider, Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import { useDispatch, useSelector } from '../../../redux/store';
import SharedHomePageHeader from '../../shared/SharedHomepageHeader';
import SharedSearchField from '../../shared/SharedSearchField';
import ErrorFallback from '../../shared/ErrorBoundary';
import { setSelectedCustomerRowDetails } from '../../../redux/slices/customer';
import FuelSurchargeTabs from './FuelSurchargeTabs';
// ----------------------------------------------------------------------


export default function CustomerhomePage() {
    const dispatch = useDispatch();
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const onClickOfNewFuelCharge = () => {
        dispatch(setSelectedCustomerRowDetails({}));
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
                <SharedHomePageHeader title="Fuel Surcharge Maintenance" buttonText='New Fuel Surcharge' onButtonClick={onClickOfNewFuelCharge} />
                {/* tabs */}
                <FuelSurchargeTabs />
                <SharedSearchField page="fuelSurcharge" />
                {/* fuel surcharge table */}

                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1543px',
                            height: '520px',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        {/* fuel surcharge details form */}
                    </DialogContent>
                </Dialog>
            </ErrorBoundary>

        </>
    );
}

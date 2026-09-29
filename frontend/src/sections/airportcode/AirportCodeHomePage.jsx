import { useState, useEffect } from 'react';
import {
    Box, Typography, Dialog,
    DialogContent,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import { useDispatch, useSelector } from '../../redux/store';
import ErrorFallback from '../shared/ErrorBoundary';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import SharedSearchField from '../shared/SharedSearchField';
// ----------------------------------------------------------------

export default function AirportCodeHomePage() {
    const dispatch = useDispatch();
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const onClickOfAirportCode = () => {
        // dispatch(setSelectedAccessorialRowDetails({}));
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
                <SharedHomePageHeader title="Airport Code Maintenance" buttonText='New Airport Code' onButtonClick={onClickOfAirportCode} />
                <SharedSearchField page="airportcode" />
                
                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1543px',
                            height: '230px',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        {/* <AccessorialDetails type="Add" handleCloseConfirm={handleCloseConfirm} /> */}
                    </DialogContent>
                </Dialog>
            </ErrorBoundary>
        </>
    );
}
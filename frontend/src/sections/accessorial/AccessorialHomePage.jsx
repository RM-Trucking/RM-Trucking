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
import AccessorialTable from './AccessorialTable';
import AccessorialDetails from './AccessorialDetails';
import { setSelectedAccessorialRowDetails } from '../../redux/slices/accessorial';
// ----------------------------------------------------------------

export default function AccessorialHomePage() {
    const dispatch = useDispatch();
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const onClickOfAddAccessorial = () => {
        dispatch(setSelectedAccessorialRowDetails({}));
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
                <SharedHomePageHeader title="Accessorial Maintenance" buttonText='Add Accessorial' onButtonClick={onClickOfAddAccessorial} />
                <SharedSearchField page="accessorial" />
                <AccessorialTable />
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
                        <AccessorialDetails type="Add" handleCloseConfirm={handleCloseConfirm} />
                    </DialogContent>
                </Dialog>
            </ErrorBoundary>
        </>
    );
}
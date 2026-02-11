import { useState, useEffect } from 'react';
import {
  Box, Typography, Dialog,
  DialogContent
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import { useDispatch, useSelector } from '../../redux/store';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import SharedSearchField from '../shared/SharedSearchField';
import CarrierTabs from './CarrierTabs';
import { setSelectedCarrierRowDetails } from '../../redux/slices/carrier';
import CarrierTable from './CarrierTable';
import CarrierDetails from './CarrierDetails';

// ----------------------------------------------------------------

export default function CarrierHomePage() {
  const dispatch = useDispatch();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const logError = (error, info) => {
    // Use an error reporting service here
    console.error("Error caught:", info);
    console.log(error);
  };
  const onClickOfNewCarrier = () => {
    dispatch(setSelectedCarrierRowDetails({}));
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
        <Box>
          <SharedHomePageHeader title="Carrier Maintenance" buttonText='New Carrier' onButtonClick={onClickOfNewCarrier} />
          <CarrierTabs />
          <SharedSearchField page="carrier" />
          <CarrierTable />
        </Box>
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
            <CarrierDetails type='Add' handleCloseConfirm={handleCloseConfirm}/>
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </>
  );
}
import { useState, useEffect } from 'react';
import {
  Box, Typography, Dialog,
  DialogContent,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import SharedSearchField from '../shared/SharedSearchField';
import ZoneTable from './ZoneTable';
import ZoneDetails from './ZoneDetails';
// ----------------------------------------------------------------

export default function ZoneHomePage() {
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const logError = (error, info) => {
    // Use an error reporting service here
    console.error("Error caught:", info);
    console.log(error);
  };
  const onClickOfAddZone = () => {
    // dispatch(setSelectedZoneRowDetails({}));
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
        <SharedHomePageHeader title="Zone Maintenance" buttonText='Add Zone' onButtonClick={onClickOfAddZone} />
        <SharedSearchField page="zone" />
        <ZoneTable />
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
          if (event.key === 'Escape') {
            handleCloseConfirm();
          }
        }}
          sx={{
            '& .MuiDialog-paper': { // Target the paper class
              width: '1543px',
              height: '450px',
              maxHeight: 'none',
              maxWidth: 'none',
            }
          }}
        >
          <DialogContent>
            <ZoneDetails type="Add" handleCloseConfirm={handleCloseConfirm} />
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </>
  );
}
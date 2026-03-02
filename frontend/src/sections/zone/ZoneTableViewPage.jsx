import { useState, useEffect } from 'react';
import {
  Box, Typography, Dialog,
  DialogContent,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import { useDispatch } from '../../redux/store';
import ErrorFallback from '../shared/ErrorBoundary';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import ZoneTableView from './ZoneTableView';
// ----------------------------------------------------------------

export default function ZoneTableViewPage() {
  const dispatch = useDispatch();
  const logError = (error, info) => {
    // Use an error reporting service here
    console.error("Error caught:", info);
    console.log(error);
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
        <SharedHomePageHeader title="Zone Maintenance"  />
        <ZoneTableView />
      </ErrorBoundary>
    </>
  );
}
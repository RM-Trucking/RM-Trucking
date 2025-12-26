import { useState, useEffect } from 'react';
import {
  Box, Typography
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import RateTabs from './RateTabs';
// ----------------------------------------------------------------

export default function RatehomePage() {
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
        <Box sx={{ p: 3 }}>
         <Typography sx={{ fontSize: '18px', fontWeight: 600, mt:2 }}>Rate Maintenance</Typography>
          <RateTabs />
        </Box>
      </ErrorBoundary>
    </>
  );
}
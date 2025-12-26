import { useState, useEffect } from 'react';
import {
  Box, Stack, Typography, Button, Divider, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
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
        <Box>
         <Typography sx={{ fontSize: '18px', fontWeight: 600, mt:2 }}>Rate Maintenance</Typography>
        </Box>
      </ErrorBoundary>
    </>
  );
}
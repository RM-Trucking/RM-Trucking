import { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import SharedSearchField from '../shared/SharedSearchField';
import ErrorFallback from '../shared/ErrorBoundary';
// ----------------------------------------------------------------------


export default function CustomerhomePage() {
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", error, info);
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
                {/* The components within this boundary are protected */}
                <SharedHomePageHeader title="Customers" buttonText='New Customer' />
                <SharedSearchField page="customers" />
            </ErrorBoundary>

        </>
    );
}

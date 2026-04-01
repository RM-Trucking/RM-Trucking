import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Stack, Typography, Button, Divider, Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import { useDispatch, useSelector } from '../../redux/store';
import SharedHomePageHeader from '../shared/SharedHomepageHeader';
import ErrorFallback from '../shared/ErrorBoundary';
import { PATH_DASHBOARD } from '../../routes/paths';
// ----------------------------------------------------------------------


export default function HomePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };

    const onClickOfNewDashboard = () => {
       // route to shipment
       navigate(PATH_DASHBOARD.general.dashboard.shipmentView);
    }
    

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
                {/* <SharedHomePageHeader title="Dashboard" buttonText='New Shipment' onButtonClick={onClickOfNewDashboard} /> */}
                
            </ErrorBoundary>

        </>
    );
}

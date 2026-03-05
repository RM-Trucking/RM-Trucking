import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Stack, Divider, Tabs, Tab,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../../redux/store';
import { setCurrentFuelSurchargeTab, clearFuelSurchargeData, } from '../../../redux/slices/fuel';

import ErrorFallback from '../../shared/ErrorBoundary';
// ----------------------------------------------------------------------


FuelSurchargeTabs.propTypes = {};

export default function FuelSurchargeTabs({ }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const TABS = [
        {
            value: 'general',
            label: 'General',
        },
        {
            value: 'customer',
            label: 'Customer',
        },
    ];
    const {
        currentFuelSurchargeTab
    } = useSelector(({ fueldata }) => fueldata);

    // error boundary info
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const OnTabChange = (newValue) => {
        console.log('new tab value', newValue);
        dispatch(setCurrentFuelSurchargeTab(newValue));
        dispatch(clearFuelSurchargeData([]));
    }
    useEffect(() => {
        dispatch(setCurrentFuelSurchargeTab(currentFuelSurchargeTab));
    }, []);
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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                    <Tabs
                        value={currentFuelSurchargeTab}
                        onChange={(event, newValue) => {
                            OnTabChange(newValue);
                        }}
                        sx={{
                            '& .MuiTabs-flexContainer': {
                                display: 'flex',
                                alignItems: 'center',
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#A22',
                                height: 2
                            },
                        }}
                    >
                        {TABS.map((tab) => (
                            <Tab
                                key={tab.value}
                                value={tab.value}
                                label={tab.label}
                                sx={{
                                    '&.Mui-selected': {
                                        color: '#A22', // Color for the selected tab text
                                        fontWeight: '600',
                                    },
                                    color: 'black', // Default text color
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />

            </ErrorBoundary>
        </>
    );
}

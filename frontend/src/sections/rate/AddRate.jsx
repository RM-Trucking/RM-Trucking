import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Divider, Typography, Tab,
    Button, Stack,
    DialogContent
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../redux/store';
import { setCurrentRateTab } from '../../redux/slices/rate';
import ErrorFallback from '../shared/ErrorBoundary';
import RateSearchFields from './../customer/RateSearchFields';
import Iconify from '../../components/iconify';
// ----------------------------------------------------------------------


AddRate.propTypes = {
    type: PropTypes.string,
    handleCloseConfirm: PropTypes.func
};

export default function AddRate({ type, handleCloseConfirm }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();


    // error boundary info
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
                {/* header  */}
                <>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Rate ID</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mb: 1 }} />
                </>
                {/* adding rate search fields here */}
                <RateSearchFields padding={0} type={'Add Rate'} />

            </ErrorBoundary>
        </>
    );
}

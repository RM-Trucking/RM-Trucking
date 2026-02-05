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
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
// ----------------------------------------------------------------------


RateLogs.propTypes = {

};

export default function RateLogs({ }) {
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
                <Box sx={{ mt: 2 }}>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Rate Log</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mb: 1 }} />
                </Box>
                {/* capsule  */}
                <Box sx={{ p: 2, width: '500px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', border: 'rgba(216, 216, 216, 1)', bgcolor: 'rgba(216, 216, 216, 1)' }}>
                    <Stack flexDirection={'row'} alignItems={'center'}>
                        <Typography sx={{ width: '45%' }} variant='normal'>Last Update</Typography>
                        <Stack flexDirection={'column'} alignItems={'flex-start'}>
                            <Typography variant='normal' sx={{ fontWeight: 600, fontFamily: 'Open Sans' }}>Noah Williams</Typography>
                            <Typography variant='normal' sx={{ fontWeight: 400, fontFamily: 'Open Sans', fontStyle: 'italic' }}>14/09/2025 13:00</Typography>
                        </Stack>
                    </Stack>
                </Box>

            </ErrorBoundary>
        </>
    );
}

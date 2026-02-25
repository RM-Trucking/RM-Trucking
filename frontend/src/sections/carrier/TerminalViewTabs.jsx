import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Divider, Tabs, Tab,
    Button, Dialog,
    DialogContent, Stack
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../redux/store';
import { setCurrentTerminalTab, setSelectedTeminalTabRowDetails, } from '../../redux/slices/carrier';
import { setCurrentRateRoutedFrom, } from '../../redux/slices/rate';
import ErrorFallback from '../shared/ErrorBoundary';
import StationAccessorial from '../customer/StationAccessorial';
import TerminalDetails from './TerminalDetails';
import RateSearchFields from '../customer/RateSearchFields';
import { PATH_DASHBOARD } from '../../routes/paths';
import AddRate from '../rate/AddRate';
import TerminalPersonnelDetails from './TerminalPersonnelDetails';
// ----------------------------------------------------------------------


TerminalViewTabs.propTypes = {

};

export default function TerminalViewTabs({ }) {
    const { currentTerminalTab, selectedTerminalTabRowDetails } = useSelector(({ carrierdata }) => carrierdata);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const TABS = [
        {
            value: 'personnel',
            label: 'Personnel',
        },
        {
            value: 'quality',
            label: 'Quality',
        },
        {
            value: 'accessorial',
            label: 'Accessorial',
        },
        {
            value: 'rate',
            label: 'Rate',
        },
    ];

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [actionType, setActionType] = useState('');

    // error boundary info
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const OnTabChange = (newValue) => {
        console.log('new tab value', newValue);
        dispatch(setCurrentTerminalTab(newValue));
    }
    const onClickOfAddCarrierTabButton = () => {
        // Implement the logic for adding a new item based on the current tab
        setActionType('Add');
        dispatch(setSelectedTeminalTabRowDetails({}));
        console.log('Add button clicked for tab:', currentTerminalTab);
        setOpenConfirmDialog(true);
    }
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        setActionType('');
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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 2,
                    }}>
                    <Tabs
                        value={currentTerminalTab}
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
                    {(currentTerminalTab.toLowerCase() !== 'rate' && currentTerminalTab.toLowerCase() !== 'quality') && <Button
                        variant="outlined"
                        onClick={() => onClickOfAddCarrierTabButton()}
                        sx={{
                            height: '22px',
                            fontWeight: 600,
                            color: '#fff',
                            textTransform: 'none', // Prevent uppercase styling
                            '&.MuiButton-outlined': {
                                borderRadius: '4px',
                                color: '#fff',
                                boxShadow: 'none',
                                p: '2px 16px',
                                bgcolor: '#a22',
                                borderColor: '#a22',
                            },
                        }}
                    >
                        Add {currentTerminalTab.charAt(0).toUpperCase() + currentTerminalTab.slice(1)}
                    </Button>}
                    {currentTerminalTab.toLowerCase() === 'rate' &&
                        <Stack direction="row" spacing={1} alignItems={'center'}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setOpenConfirmDialog(true);
                                }}
                                sx={{
                                    height: '22px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    textTransform: 'none', // Prevent uppercase styling
                                    '&.MuiButton-outlined': {
                                        borderRadius: '4px',
                                        color: '#fff',
                                        boxShadow: 'none',
                                        p: '2px 16px',
                                        bgcolor: '#a22',
                                        borderColor: '#a22',
                                    },
                                }}
                            >
                                Create Rate
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    dispatch(setCurrentRateRoutedFrom('carrier'));
                                    navigate(PATH_DASHBOARD?.maintenance?.carrierMaintenance?.rateMaintenanceView);
                                }}
                                sx={{
                                    height: '22px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    textTransform: 'none', // Prevent uppercase styling
                                    '&.MuiButton-outlined': {
                                        borderRadius: '4px',
                                        color: '#fff',
                                        boxShadow: 'none',
                                        p: '2px 16px',
                                        bgcolor: '#a22',
                                        borderColor: '#a22',
                                    },
                                }}
                            >
                                Select Rate
                            </Button>
                        </Stack>
                    }
                </Box>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mb: 2 }} />
                {currentTerminalTab.toLowerCase() === 'rate' && <Box
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation(); // Prevents the event from reaching the Dialog/Parent Form
                        }
                    }}>
                    <RateSearchFields padding={1} type={'Search'} currentTab={'transportation'} />
                </Box>}
                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1545px',
                            height: 'auto',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        {
                            currentTerminalTab.toLowerCase() === 'personnel' && <TerminalPersonnelDetails type={actionType} handleCloseConfirm={handleCloseConfirm} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'accessorial' && <StationAccessorial type={actionType} handleCloseConfirm={handleCloseConfirm} />
                        }
                        {
                            currentTerminalTab.toLowerCase() === 'rate' && <AddRate type={'Add'} handleCloseConfirm={handleCloseConfirm} />
                        }

                    </DialogContent>
                </Dialog>
            </ErrorBoundary>
        </>
    );
}

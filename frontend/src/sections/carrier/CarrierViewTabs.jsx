import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Divider, Tabs, Tab,
    Button, Dialog,
    DialogContent
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../redux/store';
import { setCurrentCarrierViewTab } from '../../redux/slices/carrier';
import ErrorFallback from '../shared/ErrorBoundary';
import { setSelectedCarrierTabRowDetails } from '../../redux/slices/carrier';
import StationAccessorial from '../customer/StationAccessorial';
import TerminalDetails from './TerminalDetails';
// ----------------------------------------------------------------------


CarrierViewTabs.propTypes = {
    selectedRowCarrierType: PropTypes.string,
};

export default function CarrierViewTabs({ selectedRowCarrierType }) {
    const { currentCarrierViewTab, selectedCarrierTabRowDetails } = useSelector(({ carrierdata }) => carrierdata);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const TABS = [
        {
            value: 'terminal',
            label: 'Terminal Details',
        },
        {
            value: 'accessorial',
            label: 'Accessorial',
        },
    ];
    const filteredTabs = TABS.filter((tab) => {
        if (selectedRowCarrierType === 'Airport') {
            return tab.value === 'terminal'; // Only show Terminal
        }
        return true; // Show both for 'LTL' or others
    });
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
        dispatch(setCurrentCarrierViewTab(newValue));
    }
    const onClickOfAddCarrierTabButton = () => {
        // Implement the logic for adding a new item based on the current tab
        setActionType('Add');
        dispatch(setSelectedCarrierTabRowDetails({}));
        console.log('Add button clicked for tab:', currentCarrierViewTab);
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
                        value={currentCarrierViewTab}
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
                        {filteredTabs.map((tab) => (
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
                    <Button
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
                        Add {currentCarrierViewTab.charAt(0).toUpperCase() + currentCarrierViewTab.slice(1)}
                    </Button>
                </Box>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mb: 2 }} />
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
                            currentCarrierViewTab.toLowerCase() === 'accessorial' && <StationAccessorial type={actionType} handleCloseConfirm={handleCloseConfirm}  />
                        }
                        {
                            currentCarrierViewTab.toLowerCase() === 'terminal' && <TerminalDetails type={actionType} handleCloseConfirm={handleCloseConfirm}  />
                        }

                    </DialogContent>
                </Dialog>
            </ErrorBoundary>
        </>
    );
}

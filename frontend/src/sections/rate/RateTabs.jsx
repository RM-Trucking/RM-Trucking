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
import { setCurrentRateTab } from '../../redux/slices/rate';
import ErrorFallback from '../shared/ErrorBoundary';
import RateSearchFields from '../customer/RateSearchFields';
import AddRate from './AddRate';
// ----------------------------------------------------------------------


RateTabs.propTypes = {};

export default function RateTabs({ }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const TABS = [
        // {
        //     value: 'transportation',
        //     label: 'Transportation',
        // },
        {
            value: 'warehouse',
            label: 'Warehouse',
        },
    ];
    
    const { rateSearchObj, currentRateTab } = useSelector(({ ratedata }) => ratedata);
    
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    // error boundary info
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const OnTabChange = (newValue) => {
        console.log('new tab value', newValue);
        dispatch(setCurrentRateTab(newValue));
    }
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
    };

    const onClickOfAddRate = () => {
        // Implement the logic for adding a new item based on the current tab
        setOpenConfirmDialog(true);
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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 2,
                    }}>
                    <Tabs
                        value={currentRateTab}
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
                    <Button
                        variant="outlined"
                        onClick={() => onClickOfAddRate()}
                        sx={{
                            height: '30px',
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
                        Add Rate
                    </Button>
                    

                </Box>
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)', mb:2 }} />
                {/* rate search details  */}
                <RateSearchFields padding = {0} type={'Search'} currentTab = {currentRateTab}/>

                {/*  dialog for add station tab item can go here */}

                <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirm();
                    }
                }}
                    sx={{
                        '& .MuiDialog-paper': { // Target the paper class
                            width: '1545px',
                            height: '80%',
                            maxHeight: 'none',
                            maxWidth: 'none',
                        }
                    }}
                >
                    <DialogContent>
                        <AddRate type={'Add'} handleCloseConfirm={handleCloseConfirm}/>                  
                    </DialogContent>
                </Dialog>

            </ErrorBoundary>
        </>
    );
}

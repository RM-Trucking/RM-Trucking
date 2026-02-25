import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Stack, Divider, Tabs, Tab,
    Button, Dialog,
    DialogContent, MenuItem
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../redux/store';
import { setStationCurrentTab } from '../../redux/slices/customer';
import StationTabsTable from './StationTabsTable';
import ErrorFallback from '../shared/ErrorBoundary';
import StationDepartment from './StationDepartment';
import StationPersonnel from './StationPersonnel';
import StationAccessorial from './StationAccessorial';
import RateSearchFields from './RateSearchFields';
import { PATH_DASHBOARD } from '../../routes/paths';
import { setSelectedStationTabRowDetails, setStationTabTableData } from '../../redux/slices/customer';
import AddRate from '../rate/AddRate';
import { setCurrentRateTab, setCurrentRateRoutedFrom } from '../../redux/slices/rate';
import StyledTextField from '../shared/StyledTextField';
// ----------------------------------------------------------------------


StationTabs.propTypes = {};

export default function StationTabs({ }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const TABS = [
        {
            value: 'department',
            label: 'Department',
        },
        {
            value: 'personnel',
            label: 'Personnel',
        },
        {
            value: 'rate',
            label: 'Rate',
        },
        {
            value: 'accessorial',
            label: 'Accessorial',
        },
    ];
    const {
        stationCurrentTab, selectedStationTabRowDetails, selectedCustomerStationDetails
    } = useSelector(({ customerdata }) => customerdata);
    const { rateSearchObj, currentRateTab } = useSelector(({ ratedata }) => ratedata);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openConfirmRateDialog, setOpenConfirmRateDialog] = useState(false);
    const [actionType, setActionType] = useState('');

    // error boundary info
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
        // navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.root);
    };
    const OnTabChange = (newValue) => {
        console.log('new tab value', newValue);
        dispatch(setStationCurrentTab(newValue));
        dispatch(setStationTabTableData([]));
        if (newValue === 'rate') {
            dispatch(setCurrentRateTab('transportation'));
        }
    }
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        setActionType('');
    };
    const handleCloseConfirmRateDilog = () => {
        setOpenConfirmRateDialog(false);
    };

    const onClickOfAddStationTabButton = () => {
        // Implement the logic for adding a new item based on the current tab
        setActionType('Add');
        dispatch(setSelectedStationTabRowDetails({}));
        console.log('Add button clicked for tab:', stationCurrentTab);
        setOpenConfirmDialog(true);
    }
    useEffect(() => {
        dispatch(setStationCurrentTab(stationCurrentTab));
    }, []);
    useEffect(() => {
        if (actionType === 'Edit') {
            setOpenConfirmDialog(true);
        }
    }, [actionType]);
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
                        value={stationCurrentTab}
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
                    {stationCurrentTab.toLowerCase() !== 'rate' && <Button
                        variant="outlined"
                        onClick={() => onClickOfAddStationTabButton()}
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
                        Add {stationCurrentTab.charAt(0).toUpperCase() + stationCurrentTab.slice(1)}
                    </Button>}
                    {stationCurrentTab.toLowerCase() === 'rate' &&
                        <Stack direction="row" spacing={1} alignItems={'center'} sx={{ width: '50%', justifyContent: 'flex-end' }}>
                            <StyledTextField
                                select
                                label="Rate"
                                variant="standard"
                                onChange={(e) => {
                                    dispatch(setCurrentRateTab(e.target.value));
                                    // call api for transportation data on rate table
                                }}
                                value={currentRateTab}
                                sx={{ mr: 1, }}
                            >
                                <MenuItem value="warehouse">Warehouse</MenuItem>
                                <MenuItem value="transportation">Transportation</MenuItem>
                            </StyledTextField>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setOpenConfirmRateDialog(true);
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
                                    dispatch(setCurrentRateRoutedFrom('customer'));
                                    navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.rateMaintenanceView);
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
                <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                {/* rate search details  */}
                {stationCurrentTab.toLowerCase() === 'rate' && <Box
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation(); // Prevents the event from reaching the Dialog/Parent Form
                        }
                    }}>
                    <RateSearchFields padding={1} type={'Search'} currentTab={'transportation'} />
                </Box>}
                <StationTabsTable currentTab={stationCurrentTab} setActionType={setActionType} />

                {/*  dialog for add station tab item can go here */}

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
                            stationCurrentTab.toLowerCase() === 'department' && <StationDepartment type={actionType} handleCloseConfirm={handleCloseConfirm} stationName={selectedCustomerStationDetails.stationName} selectedStationTabRowDetails={selectedStationTabRowDetails} />
                        }
                        {
                            stationCurrentTab.toLowerCase() === 'personnel' && <StationPersonnel type={actionType} handleCloseConfirm={handleCloseConfirm} selectedStationTabRowDetails={selectedStationTabRowDetails} />
                        }
                        {
                            stationCurrentTab.toLowerCase() === 'accessorial' && <StationAccessorial type={actionType} handleCloseConfirm={handleCloseConfirm} selectedStationTabRowDetails={selectedStationTabRowDetails} />
                        }

                    </DialogContent>
                </Dialog>

                {/* add rate dilog  */}
                <Dialog open={openConfirmRateDialog} onClose={handleCloseConfirmRateDilog} onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        handleCloseConfirmRateDilog();
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
                        <AddRate type={'Add'} handleCloseConfirm={handleCloseConfirmRateDilog} />
                    </DialogContent>
                </Dialog>

            </ErrorBoundary>
        </>
    );
}

import PropTypes from 'prop-types';
import {
    Box, Stack, Divider, Tabs, Tab,
    Button,
} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from '../../redux/store';
import { setStationCurrentTab } from '../../redux/slices/customer';
import StationTabsTable from './StationTabsTable';
import ErrorFallback from '../shared/ErrorBoundary';
// ----------------------------------------------------------------------


StationTabs.propTypes = {};

export default function StationTabs({ }) {
    const dispatch = useDispatch();
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
        stationCurrentTab
    } = useSelector(({ customerdata }) => customerdata);
    // error boundary info
    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const OnTabChange = (newValue) => {
        console.log('new tab value', newValue);
        dispatch(setStationCurrentTab(newValue));
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
                    <Button
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
                    </Button>
                   
                </Box>
                 <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                <StationTabsTable currentTab={stationCurrentTab} />
            </ErrorBoundary>
        </>
    );
}

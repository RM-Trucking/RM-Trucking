import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Box, Stack, InputAdornment, TextField, IconButton } from '@mui/material';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setCustomerSearchStr, setStationSearchStr, getCustomerData, getCustomerStationData } from '../../redux/slices/customer';
import { getZoneData, setZoneSearchStr } from '../../redux/slices/zone';
import { setAccessorialSearchStr, getAccessorialData } from '../../redux/slices/accessorial';
import { setCarrierSearchStr, getCarrierData } from '../../redux/slices/carrier';
// ----------------------------------------------------------------------


SharedSearchField.propTypes = {
    page: PropTypes.string,
};

export default function SharedSearchField({ page }) {
    const dispatch = useDispatch();

    // state declarations
    const [searchValue, setSearchValue] = useState('');
    const pagination = useSelector((state) => state?.customerdata?.pagination);
    const customerSearchStr = useSelector((state) => state?.customerdata?.customerSearchStr);
    const stationSearchStr = useSelector((state) => state?.customerdata?.stationSearchStr);
    const zoneSearchStr = useSelector((state) => state?.zonedata?.zoneSearchStr);
    const zonePagination = useSelector((state) => state?.zonedata?.pagination);
    const accessorialSearchStr = useSelector((state) => state?.accessorialdata?.accessorialSearchStr);
    const accessorialPagination = useSelector((state) => state?.accessorialdata?.pagination);
    const selectedCustomerRowDetails = useSelector((state) => state?.customerdata?.selectedCustomerRowDetails);
    const carrierSearchStr = useSelector((state) => state?.carrierdata?.carrierSearchStr);
    const carrierPagination = useSelector((state) => state?.carrierdata?.pagination);

    const handleSearch = (event) => {
        setSearchValue(event.target.value);
        // setting search str in redux store
        if (page === 'customers') dispatch(setCustomerSearchStr(event?.target?.value));
        if (page === 'station') dispatch(setStationSearchStr(event?.target?.value));
        if (page === 'zone') dispatch(setZoneSearchStr(event?.target?.value));
        if (page === 'accessorial') dispatch(setAccessorialSearchStr(event?.target?.value));
        if (page === 'carrier') dispatch(setCarrierSearchStr(event?.target?.value));
        // calling api on each change of search input
        if (page === 'customers') { dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: event.target.value })); }
        if (page === 'station') { dispatch(getCustomerStationData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: event.target.value, customerId: selectedCustomerRowDetails.customerId })); }
        if (page === 'zone') { dispatch(getZoneData({ pageNo: 1, pageSize: zonePagination.pageSize, searchStr: event.target.value })); }
        if (page === 'accessorial') { dispatch(getAccessorialData({ pageNo: 1, pageSize: accessorialPagination.pageSize, searchStr: event.target.value })); }
        if (page === 'carrier') { dispatch(getCarrierData({ pageNo: 1, pageSize: carrierPagination.pageSize, searchStr: event.target.value })); }
        
    }
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            // Prevent the default behavior (like form submission if in a form)
            event.preventDefault();
            // Call your API function here
            if (page === 'customers') { dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue })); }
            if (page === 'station') { dispatch(getCustomerStationData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue, customerId: selectedCustomerRowDetails.customerId })); }
            if (page === 'zone') { dispatch(getZoneData({ pageNo: 1, pageSize: zonePagination.pageSize, searchStr: searchValue })); }
            if (page === 'accessorial') { dispatch(getAccessorialData({ pageNo: 1, pageSize: accessorialPagination.pageSize, searchStr: searchValue })); }
            if (page === 'carrier') { dispatch(getCarrierData({ pageNo: 1, pageSize: carrierPagination.pageSize, searchStr: searchValue })); }
        }
    };
    useEffect(() => {
        if (page === 'customers') {
            setSearchValue(customerSearchStr);
        }
        if (page === 'station') {
            setSearchValue(stationSearchStr);
        }
        if (page === 'zone') {
            setSearchValue(zoneSearchStr);
        }
        if (page === 'accessorial') {
            setSearchValue(accessorialSearchStr);
        }
        if (page === 'carrier') {
            setSearchValue(carrierSearchStr);
        }
    }, [customerSearchStr, stationSearchStr, zoneSearchStr, accessorialSearchStr, carrierSearchStr]);

    return (
        <>
            <Box width='100%'>
                <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'flex-end'} sx={{ padding: 2 }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search..."
                        fullWidth
                        value={searchValue}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end" onClick={() => {
                                        if (page === 'customers') { dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue })); }
                                        if (page === 'station') { dispatch(getCustomerStationData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue, customerId: selectedCustomerRowDetails.customerId })); }
                                        if (page === 'zone') { dispatch(getZoneData({ pageNo: 1, pageSize: zonePagination.pageSize, searchStr: searchValue })); }
                                        if (page === 'accessorial') { dispatch(getAccessorialData({ pageNo: 1, pageSize: accessorialPagination.pageSize, searchStr: searchValue })); }
                                        if (page === 'carrier') { dispatch(getCarrierData({ pageNo: 1, pageSize: carrierPagination.pageSize, searchStr: searchValue })); }
                                    }}>
                                        <Iconify icon="material-symbols:search" sx={{ mr: 1 }} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiInputBase-input.MuiOutlinedInput-input': {
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 0 0 5px',
                            },
                            width: "25%"
                        }}
                    />
                </Stack>
            </Box>
        </>
    );
}

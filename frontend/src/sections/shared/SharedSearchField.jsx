import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Box, Stack, InputAdornment, TextField, IconButton } from '@mui/material';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setCustomerSearchStr, setStationSearchStr, getCustomerData, getCustomerStationData } from '../../redux/slices/customer';
import { getZoneData, setZoneSearchStr } from '../../redux/slices/zone';
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
    const selectedCustomerRowDetails = useSelector((state) => state?.customerdata?.selectedCustomerRowDetails);

    const handleSearch = (event) => {
        setSearchValue(event.target.value);
        // setting search str in redux store
        if (page === 'customers') dispatch(setCustomerSearchStr(event?.target?.value));
        if (page === 'station') dispatch(setStationSearchStr(event?.target?.value));
        if (page === 'zone') dispatch(setZoneSearchStr(event?.target?.value));
        // calling api on each change of search input
        if (page === 'customers') { dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: event.target.value })); }
        if (page === 'station') { dispatch(getCustomerStationData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: event.target.value, customerId: selectedCustomerRowDetails.customerId })); }
        if (page === 'zone') { dispatch(getZoneData({ pageNo: 1, pageSize: zonePagination.pageSize, searchStr: event.target.value })); }
    }
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            // Prevent the default behavior (like form submission if in a form)
            event.preventDefault();
            // Call your API function here
            if (page === 'customers') { dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue })); }
            if (page === 'station') { dispatch(getCustomerStationData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue, customerId: selectedCustomerRowDetails.customerId })); }
            if (page === 'zone') { dispatch(getZoneData({ pageNo: 1, pageSize: zonePagination.pageSize, searchStr: searchValue })); }
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
    }, [customerSearchStr, stationSearchStr, zoneSearchStr]);

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

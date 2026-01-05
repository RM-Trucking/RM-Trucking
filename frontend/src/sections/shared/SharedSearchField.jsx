import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Stack, InputAdornment, TextField, IconButton } from '@mui/material';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setCustomerSearchStr, getCustomerData } from '../../redux/slices/customer';
// ----------------------------------------------------------------------


SharedSearchField.propTypes = {
    page: PropTypes.string,
};

export default function SharedSearchField({ page }) {
    const dispatch = useDispatch();

    // state declarations
    const [searchValue, setSearchValue] = useState('');
    const pagination = useSelector((state) => state?.customerdata?.pagination);

    const handleSearch = (event) => {
        setSearchValue(event.target.value);
        if (page === 'customers' || page === 'station') dispatch(setCustomerSearchStr(event?.target?.value));
        dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: event.target.value }))
    }
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            // Prevent the default behavior (like form submission if in a form)
            event.preventDefault();
            // Call your API function here
            dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue }))
        }
    };

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
                                    <IconButton edge="end" onClick={() => dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: searchValue }))}>
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

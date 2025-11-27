import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Stack, InputAdornment, TextField, IconButton } from '@mui/material';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { setCustomerSearchStr } from '../../redux/slices/customer';
// ----------------------------------------------------------------------


SharedSearchField.propTypes = {
    page: PropTypes.string,
};

export default function SharedSearchField({ page }) {
    const dispatch = useDispatch();

    // state declarations
    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (event) => {
        setSearchValue(event.target.value);
        if (page === 'customers') dispatch(setCustomerSearchStr(event?.target?.value));
    }
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
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end">
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

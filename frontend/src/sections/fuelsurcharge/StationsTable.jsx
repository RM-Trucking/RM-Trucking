import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import {
    Box, Stack, Typography, Button, Dialog,
    DialogContent, Tooltip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from '../../redux/store';
import CustomNoRowsOverlay from '../shared/CustomNoRowsOverlay';
import Iconify from '../../components/iconify';
import { setTableBeingViewed } from '../../redux/slices/customer';
import { getNotesData, postNote } from '../../redux/slices/note';
import StyledTextField from '../shared/StyledTextField';
import convertLocalToET from '../../utils/timeConversion';

StationsTable.PropTypes = {
    stations: PropTypes.array,
    handleCloseConfirm: PropTypes.func
};

export default function StationsTable({ stations, handleCloseConfirm }) {
    const dispatch = useDispatch();
    const [multilineTextValue, setMultilineTextValue] = useState('');
    const isLoading = useSelector((state) => state?.notedata?.isLoading);
    const notesData = useSelector((state) => state?.notedata?.notesData);
    const stationColumns = [
        {
            field: "stationName",
            headerName: "Station Name",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal' sx={{ p: 2, }}>{params?.row?.stationName}</Typography>
                );
                return element;
            },
        },
    ];

    // get call for notes
    useEffect(() => {
        dispatch(setTableBeingViewed('Stations'));
    }, []);

    return (
        <>
                      
            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={stations}
                    columns={stationColumns}
                    loading={isLoading}
                    getRowId={(row) => row?.stationId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                />
            </Box>
            <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'flex-end'} sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => handleCloseConfirm()}
                    size="small"
                    sx={{
                        '&.MuiButton-contained': {
                            borderRadius: '4px',
                            color: '#ffffff',
                            boxShadow: 'none',
                            fontSize: '14px',
                            p: '2px 16px',
                            bgcolor: '#A22',
                            fontWeight: 'normal',
                            ml: 1,
                            mb: 1
                        },
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </>
    );
}
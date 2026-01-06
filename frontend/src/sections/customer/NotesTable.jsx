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
import StyledTextField from '../shared/StyledTextField';

NotesTable.PropTypes = {
    notes: PropTypes.array,
    handleCloseConfirm: PropTypes.func
};

export default function NotesTable({ notes, handleCloseConfirm }) {
    const dispatch = useDispatch();
    const [multilineTextValue, setMultilineTextValue] = useState('');
    const rows = [
        {
            id: 0,
            time: new Date(),
            user: 'Admin',
            note: 'Message text'
        },
        {
            id: 1,
            time: new Date(),
            user: 'Admin',
            note: 'Message text'
        }
    ]
    const notesColumns = [
        {
            field: "time",
            headerName: "Time",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },
        {
            field: "user",
            headerName: "User",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Typography>{params?.row?.user.toUpperCase()}</Typography>
                );
                return element;
            },
        },

        {
            field: "note",
            headerName: "Note",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
        },

        {
            field: "actions",
            headerName: "Action",
            minWidth: 110,
            flex: 1,
            renderCell: (params) => {
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            mb: 1.2,
                            mt: 1.2,
                        }}
                    >
                        <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000' }} />
                        </Tooltip>
                    </Box>
                );
                return element;
            },
        },
    ];
    return (
        <>
            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={rows}
                    columns={notesColumns}
                    // loading={customerLoading}
                    getRowId={(row) => row?.id}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    getRowHeight={() => 'auto'}
                />
            </Box>
            <StyledTextField
                fullWidth
                id={'Add Notes'}
                label={'Add a new note'}
                multiline
                value={multilineTextValue}
                rows={4}
                onChange={(event) => {
                    if (event.target.value === '') {
                        setMultilineTextValue('');
                    } else {
                        setMultilineTextValue(event.target.value);
                    }
                }}
                sx={{
                    mt: 1,
                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                        padding: '8px 16px 5px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                    },
                    '& .MuiInputBase-input.MuiOutlinedInput-input': {},
                }}
            />
            <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ mt: 2 }}>
                <Button variant="outlined" startIcon={<AddIcon />}>
                    Add Note
                </Button>
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
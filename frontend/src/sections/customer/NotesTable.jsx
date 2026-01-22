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

NotesTable.PropTypes = {
    notes: PropTypes.obj,
    handleCloseConfirm: PropTypes.func
};

export default function NotesTable({ notes, handleCloseConfirm }) {
    const dispatch = useDispatch();
    const [multilineTextValue, setMultilineTextValue] = useState('');
    const isLoading = useSelector((state) => state?.notedata?.isLoading);
    const notesData = useSelector((state) => state?.notedata?.notesData);
    const notesColumns = [
        {
            field: "createdAt",
            headerName: "Time",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal'>{convertLocalToET(new Date(params.row.createdAt))}</Typography>
                );
                return element;
            }
        },
        {
            field: "createdByName",
            headerName: "User",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const element = (
                    <Typography>{params?.row?.createdByName}</Typography>
                );
                return element;
            },
        },

        {
            field: "messageText",
            headerName: "Note",
            minWidth: 200,
            flex: 1,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            autoHeight: true,
            renderCell: (params) => {
                const element = (
                    <Typography variant='normal' sx={{ p: 2, wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 'normal' }}>{params?.row?.messageText}</Typography>
                );
                return element;
            },
        },
    ];

    // get call for notes
    useEffect(() => {
        dispatch(setTableBeingViewed('Notes'));
        dispatch(getNotesData(notes?.noteThreadId));
    }, []);

    const addNote = () => {
        const obj = {
            "noteThreadId": notes?.noteThreadId,
            "messageText": multilineTextValue
        };
        dispatch(postNote(obj));
        setMultilineTextValue('');
    }

    return (
        <>
            <StyledTextField
                fullWidth
                id={'Add Notes'}
                label={'Add a new note'}
                multiline
                value={multilineTextValue}
                rows={4}
                // 1. Physically restrict the browser to 2000 characters
                inputProps={{ maxLength: 2000 }}
                onChange={(event) => {
                    const value = event.target.value;

                    // 2. Prevent leading spaces (empty space initially)
                    if (value.startsWith(' ')) {
                        return; // Ignore the input if it's a leading space
                    }

                    // 3. Optional: State-level length check (redundant but safe)
                    if (value.length <= 2000) {
                        setMultilineTextValue(value);
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

            <Button variant="contained" startIcon={<AddIcon />} disabled={multilineTextValue?.length === 0}
                onClick={() => addNote()}
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
                        mb: 1,
                        mt: 1
                    },
                }}
            >
                Add Note
            </Button>
            <Box sx={{ height: 400, width: "100%", flex: 1, mt: 2 }}>
                <DataGrid
                    rows={notesData}
                    columns={notesColumns}
                    loading={isLoading}
                    getRowId={(row) => row?.noteMessageId}
                    pagination
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    hideFooterSelectedRowCount
                    getRowHeight={() => 'auto'}
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
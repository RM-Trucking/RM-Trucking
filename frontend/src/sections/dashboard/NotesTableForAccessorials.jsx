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

NotesTableForAccessorials.PropTypes = {
    notes: PropTypes.array,
    handleCloseConfirm: PropTypes.func,
    getValues: PropTypes.func,
    setValue: PropTypes.func,
    index: PropTypes.number,
    updatePickupAcc: PropTypes.func,
    updateLineHaulAcc: PropTypes.func,
    updateDeliveryAcc: PropTypes.func,
    field: PropTypes.object,
    activeAccType: PropTypes.string,
};

export default function NotesTableForAccessorials({ notes, handleCloseConfirm, getValues, setValue, index, updatePickupAcc, updateLineHaulAcc, updateDeliveryAcc, field, activeAccType }) {
    const dispatch = useDispatch();
    const [multilineTextValue, setMultilineTextValue] = useState('');
    // 1. Initialize local state directly with the props provided on mount
    const [notesData, setNotesData] = useState([]);
    const notesColumns = [
        {
            field: "messageText",
            headerName: "Note",
            minWidth: 200,
            flex: 1,
            filterable: false,
            sortable: false,
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
    }, []);
    useEffect(() => {
        console.log("Notes in NotesTableForAccessorials: ", notes);
        if (Array.isArray(notes)) {
            setNotesData(notes);
        } else {
            const noteObj = {
                messageText: notes,
                noteThreadId: null,
                noteMessageId: `new-${Date.now()}`, // Temporary ID for frontend rendering
                createdAt: new Date().toISOString(),
                createdByName: notes?.[0]?.createdByName || 'Current User' // Replace with actual user name from auth context
            };
            const updatedNotes = [...(notesData || []), noteObj];
            setNotesData(updatedNotes);
        }

    }, [notes]);

    const addNote = () => {
        const noteObj = {
            messageText: multilineTextValue,
            noteThreadId: notes?.[0]?.noteThreadId || null,
            noteMessageId: `new-${Date.now()}`, // Temporary ID for frontend rendering
            createdAt: new Date().toISOString(),
            createdByName: notes?.[0]?.createdByName || 'Current User' // Replace with actual user name from auth context
        };
        // 1. Calculate the updated array immediately
        const updatedNotes = [...(notesData || []), noteObj];

        // 2. Update your React state
        setNotesData(updatedNotes);

        // 3. Update your form data using the fresh array directly
        if (activeAccType === 'Pickup') {
            updatePickupAcc(index, {
                id: field.id, // Keeps the internal form field key intact
                accessorial: field.accessorial,
                type: field.type,
                charges: field.charges,
                notes: updatedNotes, // Use the freshly calculated array with the new note
            });
        }
        if (activeAccType === 'LineHaul') {
            updateLineHaulAcc(index, {
                id: field.id, // Keeps the internal form field key intact
                accessorial: field.accessorial,
                type: field.type,
                charges: field.charges,
                notes: updatedNotes, // Use the freshly calculated array with the new note
            });
        }
        if (activeAccType === 'Delivery') {
            updateDeliveryAcc(index, {
                id: field.id, // Keeps the internal form field key intact
                accessorial: field.accessorial,
                type: field.type,
                charges: field.charges,
                notes: updatedNotes, // Use the freshly calculated array with the new note
            });
        }

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
                    getRowId={(row) => row?.noteMessageId}
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
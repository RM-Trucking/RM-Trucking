import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent, Autocomplete, Snackbar

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

// shared components
import ErrorFallback from '../shared/ErrorBoundary';
import Iconify from '../../components/iconify';
import { useDispatch, useSelector } from '../../redux/store';
import { getRateChargeData } from '../../redux/slices/rate';
import { setTableBeingViewed } from '../../redux/slices/customer';
import StyledTextField from '../shared/StyledTextField';
// ----------------------------------------------------------------

RateFieldAndChargeTable.propTypes = {
    type: PropTypes.string,
};
export default function RateFieldAndChargeTable({ type }) {
    const dispatch = useDispatch();
    const initialArrayValue = [
        { id: 1, rateField: 'Min Charge', charge: '', readonly: true },
        { id: 2, rateField: '100', charge: '', readonly: true },
        { id: 3, rateField: '1000', charge: '', readonly: true },
        { id: 4, rateField: '3000', charge: '', readonly: true },
        { id: 5, rateField: '5000', charge: '', readonly: true },
        { id: 6, rateField: '10000', charge: '', readonly: true },
        { id: 7, rateField: 'Max Charge', charge: '', readonly: true },
        { id: 8, rateField: '', charge: '', readonly: false },
    ];
    const { isLoading, rateFieldChargeData } = useSelector((state) => state.ratedata);
    const [tableData, setTableData] = useState(initialArrayValue);
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const columns = [
        {
            field: 'rateField',
            headerName: 'Weight Break in Pounds',
            width: 200,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const handleTableUpdate = (id, field, value) => {
                    console.log(`Updating row id ${id}, field ${field} with value: ${value}`);
                    const updatedData = [...tableData];
                    const index = updatedData.findIndex(item => item.id === id);
                    // Clone the specific object to make it writable
                    updatedData[index] = { ...updatedData[index], rateField: value };
                    setTableData(updatedData);
                }
                const element = <Autocomplete
                    freeSolo
                    fullWidth
                    options={['Min Charge', 'Max Charge']}
                    // 1. Control the visual value
                    value={params.row.rateField || ''}
                    // 2. Control the typing state
                    inputValue={params.row.rateField || ''}
                    disabled={params.row.readonly}

                    // Handle Dropdown Selection
                    onChange={(event, newValue) => {
                        handleTableUpdate(params.row.id, 'rateField', newValue || '');
                    }}

                    // 3. Handle Typing (This is where we block alphabets)
                    onInputChange={(event, newInputValue, reason) => {
                        if (reason === 'clear') {
                            handleTableUpdate(params.row.id, 'rateField', '');
                            return;
                        }

                        let value = newInputValue;

                        // Allow predefined text exactly
                        if (value === 'Min Charge' || value === 'Max Charge') {
                            handleTableUpdate(params.row.id, 'rateField', value);
                            return;
                        }

                        // Logic: If user starts typing something else, it MUST be numeric
                        // Step A: Strip everything except numbers and one dot
                        let cleanValue = value.replace(/[^0-9.]/g, '');

                        // Step B: Handle multiple dots
                        const parts = cleanValue.split('.');
                        if (parts.length > 2) {
                            cleanValue = parts[0] + '.' + parts.slice(1).join('');
                        }

                        // Step C: Limit to 2 decimal places
                        const finalParts = cleanValue.split('.');
                        if (finalParts[1] && finalParts[1].length > 2) {
                            cleanValue = finalParts[0] + '.' + finalParts[1].slice(0, 2);
                        }

                        // Step D: Update the table (which updates the inputValue via props)
                        handleTableUpdate(params.row.id, 'rateField', cleanValue);
                    }}

                    renderInput={(paramsInput) => (
                        <StyledTextField
                            {...paramsInput}
                            variant="standard"
                            fullWidth
                            label=""
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.stopPropagation(); // Stops popup from closing
                                }
                            }}
                            inputProps={{
                                ...paramsInput.inputProps,
                                maxLength: 50,
                                inputMode: 'decimal',
                            }}
                        />
                    )}
                />
                return element
            }
        },
        {
            field: 'charge',
            headerName: 'Rate (per 100 lbs)',
            width: 200,
            headerAlign: 'center',
            cellClassName: 'center-status-cell',
            renderCell: (params) => {
                const updateRowValue = (id, field, value) => {
                    console.log(`Updating row id ${id}, field ${field} with value: ${value}`);
                    const updatedData = [...tableData];
                    const index = updatedData.findIndex(item => item.id === id);
                    // Clone the specific object to make it writable
                    updatedData[index] = { ...updatedData[index], charge: value };
                    setTableData(updatedData);
                }
                const element = <StyledTextField
                    variant="standard"
                    fullWidth
                    value={params.row.charge}
                    label=""
                    onChange={(e) => {
                        const val = e.target.value;

                        // 1. Regex to allow:
                        // - Up to 10 digits before the decimal
                        // - An optional decimal point
                        // - Up to 2 digits after the decimal
                        // - NO spaces or characters allowed
                        const regex = /^\d{0,10}(\.\d{0,2})?$/;

                        if (regex.test(val)) {
                            // update your table data here
                            updateRowValue(params.row.id, 'charge', val);
                        }
                    }}
                    disabled={params.row.readonly}
                />
                return element;
            }
        },
        {
            field: 'actions',
            headerName: '',
            width: 200,
            cellClassName: 'center-status-cell',
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const isLastRow = params.row.id === tableData[tableData.length - 1]?.id;
                const onEdit = () => {
                    const updatedData = [...tableData];
                    // Find the index of the row you clicked
                    const index = updatedData.findIndex(item => item.id === params.row.id);

                    if (index !== -1) {
                        // Set readonly to false to enable the inputs
                        updatedData[index] = { ...updatedData[index], readonly: false };
                        setTableData(updatedData);
                        console.log(`Row at index ${index} is now editable.`);
                    }
                }
                const onAdd = () => {
                    const lastRow = tableData[tableData.length - 1];
                    if (tableData.length > 0 && tableData[tableData.length - 1].rateField === '' || tableData[tableData.length - 1].charge === '') {
                        setSnackbarOpen(true);
                        setSnackbarMessage('Please fill in the last row before adding a new one.');
                        return;
                    }
                    // 2. Validation: Prevent adding if the last row's rateField is a duplicate
                    const isSpecialText = lastRow.rateField === 'Min Charge' || lastRow.rateField === 'Max Charge';
                    if (isSpecialText) {
                        // Check if this text exists in any OTHER row (excluding the last row itself)
                        const duplicateExists = tableData.slice(0, -1).some(row => row.rateField === lastRow.rateField);

                        if (duplicateExists) {
                            setSnackbarOpen(true);
                            setSnackbarMessage(`${lastRow.rateField} is already present in the table. Please change it before adding a new row.`);
                            return;
                        }
                    }

                    const lockedData = tableData.map((row) => ({
                        ...row,
                        readonly: true
                    }));
                    const newId = lockedData.length > 0 ? Math.max(...lockedData.map(d => d.id)) + 1 : 1;

                    // 3. Define the new editable row
                    const newRow = {
                        id: newId,
                        rateField: '',
                        charge: '',
                        readonly: false // This new row remains editable
                    };

                    // 4. Update the state with the locked rows + the new editable row
                    setTableData([...lockedData, newRow]);
                }
                const toggleReadonly = (id, status) => {
                    const updatedData = tableData.map((row) =>
                        row.id === id ? { ...row, readonly: status } : row
                    );
                    setTableData(updatedData);
                };
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            mb: 1.2,
                            alignItems: 'flex-end', ml: 2
                        }}
                    >
                        {isLastRow ? (
                            /* ALWAYS SHOW ADD ON THE LAST ROW */
                            <Tooltip title="Add New Row" arrow>
                                <Iconify
                                    icon="basil:add-solid"
                                    sx={{ color: '#A22', cursor: 'pointer', fontSize: '24px' }}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevents popup close
                                        onAdd();
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            /* TOGGLE EDIT/SAVE FOR ALL OTHER ROWS */
                            <>
                                {params.row.readonly ? (
                                    <Tooltip title="Edit" arrow>
                                        <Iconify
                                            icon="tabler:edit"
                                            sx={{ color: '#000', cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReadonly(params.row.id, false);
                                            }}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Save" arrow>
                                        <Iconify
                                            icon="fluent:save-24-filled"
                                            sx={{ color: '#2E7D32', cursor: 'pointer', fontSize: '24px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReadonly(params.row.id, true);
                                            }}
                                        />
                                    </Tooltip>
                                )}

                                <Tooltip title="Delete" arrow>
                                    <Iconify
                                        icon="material-symbols:delete-rounded"
                                        sx={{ color: '#000', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const updatedData = tableData.filter(row => row.id !== params.row.id);
                                            setTableData(updatedData);
                                        }}
                                    />
                                </Tooltip>
                            </>
                        )}
                    </Box>
                );
                return element;
            },
        }
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('charge'));
        dispatch(getRateChargeData());
    }, []);
    useEffect(() => {
        // if type is view table should not be editable
        console.log(type, 'in transportation sub table')
    }, [type]);
    useEffect(() => {
        console.log(rateFieldChargeData);
        let list = [];
        if (rateFieldChargeData.length > 0) {
            list = rateFieldChargeData.map((item, index) => {
                return {
                    id: index,
                    rateField: item.rateField,
                    charge: item.charge,
                    readonly: true,
                };
            });
            list.push({ id: list.length, rateField: '', charge: '', readonly: false });
            console.log("Rate Field and Charge Data updated:", list);
            setTableData(list);
        }
    }, [rateFieldChargeData]);

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
                <Box sx={{ width: "50%", height: "300px", flex: 1, mt: 2 }}>

                    <DataGrid
                        rows={tableData}
                        columns={columns}
                        loading={isLoading}
                        getRowId={(row) => row?.id}
                        getRowHeight={() => 'auto'}
                        hideFooterSelectedRowCount
                        hideFooterPagination
                        hideFooter
                    />
                </Box>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000} // Adjust the duration as needed
                    onClose={() => {
                        setSnackbarOpen(false);
                    }}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                />
            </ErrorBoundary>
        </>
    );
}
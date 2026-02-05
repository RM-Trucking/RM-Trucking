import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, Tooltip, Dialog, DialogContent

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
import { set } from 'react-hook-form';
// ----------------------------------------------------------------

RateFieldAndChargeTable.propTypes = {
    type: PropTypes.string,
};
export default function RateFieldAndChargeTable({type}) {
    const dispatch = useDispatch();
    const initialArrayValue = [
        { id: 1, rateField: '', charge: '', readonly: false },
    ];
    const { isLoading, rateFieldChargeData } = useSelector((state) => state.ratedata);
    const [tableData, setTableData] = useState(initialArrayValue);

    const logError = (error, info) => {
        // Use an error reporting service here
        console.error("Error caught:", info);
        console.log(error);
    };
    const columns = [
        {
            field: 'rateField',
            headerName: 'Rate Field',
            width: 150,
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
                const element = <StyledTextField
                    variant="standard"
                    fullWidth
                    value={params.row.rateField}
                    label=""
                    // 1. Enforce max length at the HTML level
                    slotProps={{
                        htmlInput: { maxLength: 50 }
                    }}
                    onChange={(e) => {
                        let value = e.target.value;

                        // 2. Prevent leading spaces by trimming the start
                        if (value.startsWith(' ')) {
                            value = value.trimStart();
                        }

                        // Proceed with your table data update logic
                        handleTableUpdate(params.row.id, 'rateField', value);
                    }}

                    disabled={params.row.readonly}
                />
                return element
            }
        },
        {
            field: 'charge',
            headerName: 'Charges ($/lb)',
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
                const onEdit = () => {
                    console.log(params.row.rateField);
                }
                const onDelete = () => {
                    console.log(params.row.rateField);
                }
                const onAdd = () => {
                    console.log(params.row.rateField);
                    const updatedData = [...tableData];
                    const obj = {
                        id: updatedData.length, rateField: '', charge: '', readonly: false
                    };
                    updatedData.push(obj);
                    setTableData(updatedData);
                }
                const element = (
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            mb: 1.2,
                            alignItems: 'flex-end', ml: 2
                        }}
                    >

                        {params.row.readonly && <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => onEdit()} />
                        </Tooltip>}

                        {params.row.readonly && <Tooltip title={'Delete'} arrow>
                            <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => onDelete()} />
                        </Tooltip>}
                        {!params.row.readonly && <Tooltip title={'Add'} arrow>
                            <Iconify icon="basil:add-solid" sx={{ color: '#A22', marginTop: '15px' }} onClick={() => onAdd()} />
                        </Tooltip>}
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
        console.log(type,'in transportation sub table')
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
            </ErrorBoundary>
        </>
    );
}
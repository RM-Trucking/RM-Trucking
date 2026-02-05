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
import { setWarehouseRatesFieldChargeData, getRateChargeData } from '../../redux/slices/rate';
import { setTableBeingViewed } from '../../redux/slices/customer';
import StyledTextField from '../shared/StyledTextField';
// ----------------------------------------------------------------
RateFieldAndChargeTableWarehouse.propTypes = {
type: PropTypes.string,
};

export default function RateFieldAndChargeTableWarehouse({ type }) {
    const dispatch = useDispatch();
    const initialArrayValue = [
        { id: 1, rateField: 'Min Charge', charge: '', readonly: false },
        { id: 2, rateField: 'Rate Per 100 LB', charge: '', readonly: false },
        { id: 3, rateField: 'Max Charge', charge: '', readonly: false },
    ];
    const { isLoading, selectedCurrentRateRow, } = useSelector((state) => state.ratedata);
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

                const element = <Typography variant='normal'>
                    {params.row.rateField}
                </Typography>
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
                    const updatedData = [...tableData];
                    // Clone the specific object to make it writable
                    updatedData[params.row.id - 1] = { ...updatedData[params.row.id - 1], charge: value };
                    setTableData(updatedData);
                    dispatch(setWarehouseRatesFieldChargeData(updatedData));
                }
                const element = <StyledTextField
                    variant="standard"
                    fullWidth
                     value={params.row.charge ?? ''} 
                    label=""
                    onChange={(e) => {
                        const val = e.target.value;

                        // 1. Regex to allow:
                        // - Up to 8 digits before the decimal
                        // - An optional decimal point
                        // - Up to 2 digits after the decimal
                        // - NO spaces or characters allowed
                        const regex = /^\d{0,8}(\.\d{0,2})?$/;

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
                    const updatedData = [...tableData];
                    // Clone the specific object to make it writable
                    updatedData[params.row.id - 1] = { ...updatedData[params.row.id - 1], readonly: false };
                    setTableData(updatedData);
                    dispatch(setWarehouseRatesFieldChargeData(updatedData));
                }
                const onSave = () => {
                    const updatedData = [...tableData];
                    // Clone the specific object to make it writable
                    updatedData[params.row.id - 1] = { ...updatedData[params.row.id - 1], readonly: true };
                    setTableData(updatedData);
                    dispatch(setWarehouseRatesFieldChargeData(updatedData));
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

                        {params.row.readonly && (type === 'Edit' || type === 'Copy') && <Tooltip title={'Edit'} arrow>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => onEdit()} />
                        </Tooltip>}
                        {!params.row.readonly && (type === 'Edit' || type === 'Copy') && <Tooltip title={'Save'} arrow>
                            <Iconify icon="ic:baseline-save" sx={{ color: '#000', marginTop: '15px', mr: 2 }} onClick={() => onSave()} />
                        </Tooltip>}


                    </Box>
                );
                return element;
            },
        }
    ];

    useEffect(() => {
        // Dispatch action to fetch rate dashboard data
        dispatch(setTableBeingViewed('warehouse charge'));
        dispatch(getRateChargeData());
    }, []);

    useEffect(() => {
        if (Object.keys(selectedCurrentRateRow).length !== 0) {
            // Update table data based on selectedCurrentRateRow
            const charges = [
                selectedCurrentRateRow.minRate,
                selectedCurrentRateRow.ratePerPound,
                selectedCurrentRateRow.maxRate
            ];

            const updatedData = tableData.map((item, index) =>
                index < 3 ? { ...item, charge: charges[index], readonly: true } : item
            );

            setTableData(updatedData);

            dispatch(setWarehouseRatesFieldChargeData(updatedData));
        }
    }, [selectedCurrentRateRow])
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
                <Box sx={{ width: "40%", height: "206px", flex: 1, mt: 2 }}>

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
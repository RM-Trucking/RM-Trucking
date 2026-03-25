import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridToolbar, GridFilterPanel, useGridApiContext, gridFilterModelSelector, useGridSelector, gridVisibleColumnDefinitionsSelector, gridFilterableColumnDefinitionsSelector } from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import { Box, Switch, Stack, Typography, Button, Chip, Tooltip, Divider, Dialog, DialogContent, Snackbar, MenuItem, Select, IconButton } from '@mui/material';
import { useDispatch, useSelector } from '../../redux/store';
import { clearNotesState } from '../../redux/slices/note';
import Iconify from '../../components/iconify';
import { PATH_DASHBOARD } from '../../routes/paths';
import { getCustomerData, setSelectedCustomerRowDetails, customerStatusChange, setOperationalMessage, setStationTabTableData, setCustomerSearchStr } from '../../redux/slices/customer';
import SharedCustomerDetails from './SharedCustomerDetails';
import NotesTable from './NotesTable';
import StyledTextField from '../shared/StyledTextField';

const ColoredSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#A22',
        '&:hover': {
            backgroundColor: alpha('#A22', theme.palette.action.hoverOpacity),
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: '#A22',
    },
}));
let pageObjCopy;

function CustomFilterPanel() {
    const apiRef = useGridApiContext();
    const dispatch = useDispatch();
    const gridColumns = apiRef?.current?.getAllColumns();


    // 1. Get column definitions dynamically from the grid
    // const columns = useGridSelector(apiRef, gridVisibleColumnDefinitionsSelector)
    // .filter(col => col.filterable !== false && col.field !== '__check__');
    // const columns = useGridSelector(apiRef, gridFilterableColumnDefinitionsSelector)
    //     .filter(col => col.field !== '__check__');

    // 2. Local state for manual multi-filtering
    const [filters, setFilters] = useState([{ id: Date.now(), field: '', operator: 'contains', value: '' }]);
    const [logicOperator, setLogicOperator] = useState('and');

    const addFilter = () => setFilters([...filters, { id: Date.now(), field: '', operator: 'contains', value: '' }]);

    const updateFilter = (id, key, val) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
    };

    const handleApply = () => {
        // 3. Send the custom multi-filter model to your server-side action
        // dispatch(getCustomerData({
        //     filterModel: {
        //         items: filters.filter(f => f.field && f.value), // Only send valid filters
        //         logicOperator: logicOperator
        //     },
        //     pageNo: 1
        // }));
        console.log(filterModel, logicOperator);
        apiRef.current.hideFilterPanel(); // Close panel after applying
    };

    return (
        <Box sx={{ p: 2, minWidth: 450 }}>
            <Typography variant="subtitle2" mb={1}>Logic Operator</Typography>
            <StyledTextField
                select
                value={logicOperator}
                onChange={(e) => setLogicOperator(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
            >
                <MenuItem value="and">And</MenuItem>
                <MenuItem value="or">Or</MenuItem>
            </StyledTextField>

            {filters.map((f) => (
                <Box key={f.id} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    {/* Dynamic Column Dropdown */}
                    <StyledTextField
                        select
                        value={f.field}
                        onChange={(e) => updateFilter(f.id, 'field', e.target.value)}
                        size="small"
                        displayEmpty
                        sx={{ width: 150 }}
                    >
                        <MenuItem value="" disabled>Select Column</MenuItem>
                        {gridColumns.map(col => (
                            <MenuItem key={col.field} value={col.field}>
                                {col.headerName || col.field}
                            </MenuItem>
                        ))}
                    </StyledTextField>

                    <StyledTextField
                        size="small"
                        placeholder="Filter value..."
                        value={f.value}
                        onChange={(e) => updateFilter(f.id, 'value', e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />

                    <IconButton onClick={() => setFilters(filters.filter(x => x.id !== f.id))} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}

            <Button size="small" onClick={addFilter} sx={{ mt: 1 }}>+ Add Filter Condition</Button>

            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button variant="contained" onClick={handleApply}>
                    Apply Filter
                </Button>
            </Box>
        </Box>
    );
}

export default function CustomerHomePageTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const customerRows = useSelector((state) => state?.customerdata?.customerRows);
    const operationalMessage = useSelector((state) => state?.customerdata?.operationalMessage);
    const error = useSelector((state) => state?.customerdata?.error)
    const pagination = useSelector((state) => state?.customerdata?.pagination);
    const customerSearchStr = useSelector((state) => state?.customerdata?.customerSearchStr);
    const selectedCustomerRowDetails = useSelector((state) => state?.customerdata?.selectedCustomerRowDetails);
    const customerLoading = useSelector((state) => state?.customerdata?.isLoading);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const notesRef = useRef({});
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // pagination model
    const [paginationModel, setPaginationModel] = useState({
        page: pagination.page,
        pageSize: pagination.pageSize,
    });
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    // filter text
    const [filterFieldText, setFilterFieldText] = useState('');

    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues
    } = useForm({
        defaultValues: {
            reasonForStatusChange: '',
        }
    });

    // datagrid columns
    const columns = [{
        field: "customerName",
        headerName: "Customer Name",
        minWidth: 100,
        flex: 1,
        filterable: false,
    },
    {
        field: "rmAccountNumber",
        headerName: "RM Account #",
        minWidth: 100,
        flex: 1,
        filterable: false,
        renderCell: (params) => {
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        color: '#A22',
                        width: '100%',
                        textDecoration: 'underline'
                    }}
                >
                    {params?.row?.rmAccountNumber}
                </Box>
            );
            return element;
        },
    },
    {
        field: "phoneNumber",
        headerName: "Customer Phone #",
        minWidth: 100,
        flex: 1,
        filterable: false,
    },
    {
        field: "website",
        headerName: "Customer Website",
        minWidth: 100,
        flex: 1,
        filterable: false,
    },
    {
        field: "activeStatus",
        headerName: "Status",
        minWidth: 100,
        align: 'center',
        cellClassName: 'center-status-cell',
        filterable: false,
        renderCell: (params) => {
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                    }}
                >
                    <Chip label={params?.row?.activeStatus?.toLowerCase() === 'y' ? 'Active' : 'Inactive'} sx={{ backgroundColor: (params?.row?.activeStatus?.toLowerCase() !== 'y') ? 'rgba(143, 143, 143, 1)' : 'rgba(92, 172, 105, 1)', }} />
                </Box>
            );
            return element;
        },
    },
    {
        field: "notes",
        headerName: "Notes",
        minWidth: 100,
        flex: 1,
        filterable: false,
        renderCell: (params) => {
            const handleDialogOpen = () => {
                setOpenConfirmDialog(true);
                notesRef.current = params?.row;
            }
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                    }}
                >

                    <Iconify icon="icon-park-solid:notes" onClick={handleDialogOpen} sx={{ color: '#7fbfc4', marginTop: '15px', cursor: 'pointer' }} />

                </Box>
            );
            return element;
        },
    },
    {
        field: "actions",
        headerName: "Action",
        minWidth: 300,
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
            const handleSwitchChange = async (event) => {
                try {
                    let obj = { activeStatus: event.target.checked ? 'Y' : 'N' };
                    // using callback to refresh table data after delete
                    await dispatch(customerStatusChange(params?.row?.customerId, obj)).unwrap();
                } catch (err) {
                    console.log('error in status change', err);
                }
                localStorage.setItem('customerId', params?.row?.customerId);
            }
            const element = (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                    }}
                >
                    <Tooltip title={'View'} arrow>
                        <Box onClick={() => {
                            dispatch(setSelectedCustomerRowDetails(params?.row));
                            dispatch(setStationTabTableData([]));
                            localStorage.setItem('customerId', params?.row?.customerId);
                            navigate(PATH_DASHBOARD?.maintenance?.customerMaintenance?.customerView);
                        }} sx={{ display: 'inline-flex', cursor: 'pointer' }} >
                            <Iconify icon="carbon:view-filled" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                        </Box>
                    </Tooltip>
                    <Tooltip title={'Edit'} arrow>
                        <Box onClick={() => {
                            dispatch(setSelectedCustomerRowDetails(params?.row));
                            localStorage.setItem('customerId', params?.row?.customerId);
                            setOpenEditDialog(true);
                        }} sx={{ display: 'inline-flex', cursor: 'pointer' }}>
                            <Iconify icon="tabler:edit" sx={{ color: '#000', marginTop: '15px', mr: 2 }} />
                        </Box>
                    </Tooltip>

                    <ColoredSwitch slotProps={{ input: { 'aria-label': 'controlled' } }} checked={params?.row?.activeStatus === 'Y'} onChange={(event) => handleSwitchChange(event, params)} />
                </Box>
            );
            return element;
        },
    },
    ];

    // call api to get table data
    useEffect(() => {
        dispatch(clearNotesState());
        dispatch(getCustomerData({ pageNo: pagination.page, pageSize: pagination.pageSize, searchStr: customerSearchStr }));
    }, []);

    useEffect(() => {
        if (pagination) {
            setPaginationModel({
                page: pagination.page ? parseInt(pagination.page, 10) - 1 : 0,
                pageSize: pagination.pageSize || 10,
            });
        }
    }, [pagination]);

    useEffect(() => {
        if (error) {
            setSnackbarMessage(`${(error?.error && error?.message) ? `${error?.error}. ${error?.message}` : `${error}`}`);
            setSnackbarOpen(true);
        }
    }, [error])
    // operational message on customer
    useEffect(() => {
        if (operationalMessage) {
            setSnackbarMessage(operationalMessage);
            setSnackbarOpen(true);
        }
    }, [operationalMessage])

    useEffect(() => {
        console.log('customer rows updated', customerRows);
    }, [customerRows])

    // dialog actions and functions
    const handleCloseConfirm = () => {
        setOpenConfirmDialog(false);
        notesRef.current = {};
    };

    const handleCloseEdit = () => {
        setOpenEditDialog(false);
    };

    const handleCloseDelete = () => {
        setDeleteDialogOpen(false);
    };

    const onSubmit = (data) => {
        console.log('Form Submitted:', data);
        handleCloseDelete();
    };

    const onServerFilterChange = useCallback((filterModel) => {
        if (filterModel?.items[0]?.value === '' || filterModel?.items[0]?.value === undefined) {
            dispatch(setCustomerSearchStr(''));
            dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: '' }));
        }
        if (filterModel?.items[0]?.value && filterModel?.items[0]?.field === 'customerName') {
            dispatch(setCustomerSearchStr(filterModel?.items[0]?.value));
            dispatch(getCustomerData({ pageNo: 1, pageSize: pagination.pageSize, searchStr: filterModel?.items[0]?.value }));
        }
    }, []);

    return (<>
        <Box sx={{ height: 300, width: "100%", flex: 1 }}>
            <DataGrid
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) => {
                    setPaginationModel(newModel);
                    dispatch(getCustomerData({
                        pageNo: newModel.page + 1,
                        pageSize: newModel.pageSize,
                        searchStr: customerSearchStr
                    }));
                }}
                rows={customerRows}
                columns={columns}
                loading={customerLoading}
                getRowId={(row) => row?.customerId}
                hideFooterSelectedRowCount
                onPageChange={(newPage) => {
                    dispatch(getCustomerData({ pageNo: newPage + 1, pageSize: pagination?.pageSize || 10, searchStr: customerSearchStr }));
                }}
                onPageSizeChange={(newPageSize) => {
                    dispatch(getCustomerData({ pageNo: 1, pageSize: newPageSize, searchStr: customerSearchStr }));
                }}
                pageSizeOptions={[5, 10, 50, 100]}
                rowCount={parseInt(pagination?.totalRecords || '0', 10)}
                autoHeight
                pagination

                // regarding filters
                showToolbar
                slots={{
                    filterPanel: CustomFilterPanel,
                }}
                filterMode="server"
                slotProps={{
                    toolbar: {
                        // 1. Hide the Search (Quick Filter)
                        showQuickFilter: false,

                        // 2. Hide the Export (CSV/Print) buttons
                        csvOptions: { disableToolbarButton: true },
                        printOptions: { disableToolbarButton: true },

                        // 3. Hide the Columns selector button
                        disableColumnSelector: true,

                        // 4. Hide the Density selector (optional, if you don't want it)
                        // disableDensitySelector: true,
                    },
                    filterPanel: {
                        disableAddFilterButton: true, // Since you handle adding in your custom UI
                        disableRemoveAllButton: true,
                    }
                }}
            // onFilterModelChange={onServerFilterChange}
            />
        </Box>
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirm} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseConfirm();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: '1000px',
                    height: '80%',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Customer Notes</Typography>
                        <Iconify icon="carbon:close" onClick={() => handleCloseConfirm()} sx={{ cursor: 'pointer' }} />
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                </>
                <Box sx={{ pt: 2 }}>
                    <NotesTable notes={notesRef.current} handleCloseConfirm={handleCloseConfirm} />
                </Box>
            </DialogContent>
        </Dialog>
        <Dialog open={openEditDialog} onClose={handleCloseEdit} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseEdit();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: '1543px',
                    height: '520px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                <SharedCustomerDetails type={'Edit'} handleCloseConfirm={handleCloseEdit} selectedCustomerRowDetails={selectedCustomerRowDetails} />
            </DialogContent>
        </Dialog>
        <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} onKeyDown={(event) => {
            if (event.key === 'Escape') {
                handleCloseDelete();
            }
        }}
            sx={{
                '& .MuiDialog-paper': { // Target the paper class
                    width: '1000px',
                    height: '200px',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            }}
        >
            <DialogContent>
                {/* header  */}
                <>
                    <Stack flexDirection="row" alignItems={'center'} justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Reason For Status Change</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(143, 143, 143, 1)' }} />
                </>
                <Stack flexDirection={'row'} justifyContent={'center'} alignItems={'center'} sx={{ mt: 2, mb: 1 }}>
                    <Controller
                        name="reasonForStatusChange"
                        control={control}
                        rules={{ required: 'Reason for status change is required' }}
                        render={({ field }) => (
                            <StyledTextField
                                {...field}
                                select
                                label="Reason for Status"
                                variant="standard" fullWidth required
                                sx={{
                                    width: '35%',
                                }}
                                error={!!errors.reasonForStatusChange} helperText={errors.reasonForStatusChange?.message}
                            >
                                <MenuItem value='Payment Defaulter'>Payment Defaulter</MenuItem>
                            </StyledTextField>
                        )}
                    />
                </Stack>
                <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'flex-end'} sx={{ mt: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseDelete}
                        size="small"
                        sx={{
                            '&.MuiButton-outlined': {
                                borderRadius: '4px',
                                color: '#000',
                                boxShadow: 'none',
                                fontSize: '14px',
                                p: '2px 16px',
                                bgcolor: '#fff',
                                fontWeight: 'normal',
                                ml: 1,
                                mr: 1,
                                borderColor: '#000'
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        type='submit'
                        onClick={handleSubmit(onSubmit)}
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
                            },
                        }}
                    >
                        Ok
                    </Button>
                </Stack>

            </DialogContent>
        </Dialog>
        <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000} // Adjust the duration as needed
            onClose={() => {
                setSnackbarOpen(false);
                dispatch(setOperationalMessage());
            }}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        />
    </>)
}

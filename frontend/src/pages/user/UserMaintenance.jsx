import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { HEADER } from '../../config';

const employeeNames = [
  'James Smith',
  'Emma Johnson',
  'Michael Brown',
  'Olivia Davis',
  'William Miller',
  'Sophia Wilson',
  'Benjamin Moore',
  'Ava Taylor',
  'Noah Anderson',
  'Liam Thomas',
];

const roles = [
  'Super Admin',
  'Ground Staff',
  'Admin',
  'Warehouse Staff',
  'Warehouse Supervisor',
  'Route Planner',
  'Loading Dock Operator',
  'Logistics Admin',
  'Maintenance Technician',
  'Ground Staff',
];
const customerNames = ['Ventana Customer', 'Acme Distribution', 'Northstar Logistics', 'Pioneer Supply'];
const customerRoles = ['Ventana Customer', 'Account Admin', 'Shipping User', 'Billing Contact'];
const stationOptions = ['Station 1', 'Station 2', 'Station 3'];

const createRows = (count, isCustomer = false) =>
  Array.from({ length: count }, (_, index) => {
    const name = isCustomer
      ? customerNames[index % customerNames.length]
      : employeeNames[index % employeeNames.length];

    return {
      id: `${isCustomer ? 'customer' : 'employee'}-${index + 1}`,
      serialNumber: String(index + 1).padStart(2, '0'),
      name,
      loginName: isCustomer ? `customer${index + 1}` : name.replace(' ', '.'),
      email: isCustomer ? `contact${index + 1}@example.com` : `${name.replace(' ', '').toLowerCase()}@rmtruck.com`,
      companyName: isCustomer ? ['Ventana', 'Acme', 'Northstar', 'Pioneer'][index % 4] : '',
      stationList: isCustomer ? stationOptions.slice(0, (index % stationOptions.length) + 1) : [],
      role: isCustomer ? customerRoles[index % customerRoles.length] : roles[index % roles.length],
      createdDate: '1/23/25, 4:48 PM',
      createdBy: index === 0 ? '' : 'Admin',
      status: index === 1 ? 'Inactive' : 'Active',
    };
  });

export default function UserMaintenance() {
  const [employeeRows, setEmployeeRows] = useState(() => createRows(50));
  const [customerRows, setCustomerRows] = useState(() => createRows(150, true));
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const gridContainerRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setGridHeight(entry.contentRect.height);
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);
  // Reserve space for the header, pagination, and grid borders.
  const rowHeight = Math.max(44, Math.floor((gridHeight - 102) / paginationModel.pageSize));
  const [formOpen, setFormOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formValues, setFormValues] = useState({ name: '', loginName: '', email: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const currentRows = activeTab === 0 ? employeeRows : customerRows;
  const setCurrentRows = activeTab === 0 ? setEmployeeRows : setCustomerRows;
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return currentRows.filter((row) => {
      const matchesSearch = !normalizedSearch ||
        [row.name, row.loginName, row.role, row.createdBy].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (statusFilter === 'All' || row.status === statusFilter);
    });
  }, [currentRows, search, statusFilter]);

  const openNewForm = () => {
    setEditingRow(null);
    setFormValues(activeTab === 0
      ? { name: '', loginName: '', email: '', role: '' }
      : { name: '', companyName: '', stationList: [], loginName: '', email: '', role: '', password: '', confirmPassword: '' });
    setFormError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormOpen(true);
  };

  const openEditForm = (row) => {
    setEditingRow(row);
    setFormValues(activeTab === 0
      ? { name: row.name, loginName: row.loginName, email: row.email || '', role: row.role }
      : {
          name: row.name,
          companyName: row.companyName || '',
          stationList: row.stationList || [],
          loginName: row.loginName,
          email: row.email || '',
          role: row.role,
          password: '',
          confirmPassword: '',
        });
    setFormError('');
    setFormOpen(true);
  };

  const saveUser = (event) => {
    event.preventDefault();
    if (activeTab === 1) {
      const password = formValues.password || '';
      const confirmPassword = formValues.confirmPassword || '';
      const hasPassword = password.length > 0;
      const passwordIsValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

      if ((!editingRow && !hasPassword) || (hasPassword && !passwordIsValid)) {
        setFormError('Use at least 8 characters, including uppercase, lowercase, and a special character.');
        return;
      }
      if ((hasPassword || !editingRow) && password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }

    const userValues = Object.fromEntries(
      Object.entries(formValues).filter(([key]) => key !== 'password' && key !== 'confirmPassword')
    );
    const updatedRow = editingRow
      ? { ...editingRow, ...userValues }
      : {
          ...userValues,
          id: `${activeTab === 0 ? 'employee' : 'customer'}-${Date.now()}`,
          serialNumber: String(currentRows.length + 1).padStart(2, '0'),
          createdDate: new Date().toLocaleString(),
          createdBy: 'Admin',
          status: 'Active',
        };

    setCurrentRows((rows) => editingRow
      ? rows.map((row) => (row.id === editingRow.id ? updatedRow : row))
      : [...rows, updatedRow]);
    setFormError('');
    setFormOpen(false);
  };

  const toggleStatus = (rowId) => {
    setCurrentRows((rows) => rows.map((row) => (
      row.id === rowId ? { ...row, status: row.status === 'Active' ? 'Inactive' : 'Active' } : row
    )));
  };

  const columns = [
    { field: 'serialNumber', headerName: 'SNo', minWidth: 42, flex: 0.4, sortable: true, filterable: false },
    { field: 'name', headerName: activeTab === 0 ? 'Employee Name' : 'Customer Name', minWidth: 0, flex: 0.9, filterable: false },
    { field: 'loginName', headerName: 'Login Name', minWidth: 0, flex: 1, filterable: false },
    { field: 'role', headerName: 'Role', minWidth: 0, flex: 1, filterable: false },
    { field: 'createdDate', headerName: 'Created Date', minWidth: 0, flex: 1.1, filterable: false },
    { field: 'createdBy', headerName: 'Created By', minWidth: 0, flex: 0.8, filterable: false },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 72,
      flex: 0.7,
      filterable: false,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            minWidth: 68,
            height: 24,
            color: '#fff',
            fontSize: 12,
            bgcolor: value === 'Active' ? '#58ae6b' : '#ee7777',
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 90,
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={0}>
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit ${row.name}`} onClick={() => openEditForm(row)}>
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === 'Active' ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" aria-label={`Toggle status for ${row.name}`} onClick={() => toggleStatus(row.id)}>
              {row.status === 'Active'
                ? <ToggleOnIcon sx={{ fontSize: 19, color: '#58ae6b' }} />
                : <ToggleOffIcon sx={{ fontSize: 19, color: '#ee7777' }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="View details">
            <IconButton size="small" aria-label={`View ${row.name}`} onClick={() => setDetailsRow(row)}>
              <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: `calc(100dvh - ${HEADER.H_DASHBOARD_DESKTOP + 8}px)`, minHeight: 360, px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 1, width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontSize: 16, fontWeight: 700, color: '#222' }}>
          User Maintenance
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openNewForm}
          sx={{ flexShrink: 0, bgcolor: '#b51f24', textTransform: 'none', fontSize: 11, '&:hover': { bgcolor: '#95191d' } }}
        >
          {activeTab === 0 ? 'New Employee' : 'New Customer'}
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column-reverse', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ borderBottom: '1px solid #e4e4e4', minHeight: 40, mb: 1, flexShrink: 0 }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            setPaginationModel((model) => ({ ...model, page: 0 }));
          }}
          aria-label="User type"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, px: 1, textTransform: 'none', fontSize: 12, color: '#777' }, '& .Mui-selected': { color: '#222' }, '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 } }}
        >
          <Tab label={`Employee (${employeeRows.length})`} />
          <Tab label={`Customer (${customerRows.length})`} />
        </Tabs>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} sx={{ pb: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPaginationModel((model) => ({ ...model, page: 0 }));
            }}
            placeholder="Search"
            aria-label="Search users"
            InputProps={{
              endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: '#888', fontSize: 17 }} /></InputAdornment>,
            }}
            sx={{ width: { xs: 'auto', sm: 165 }, flex: { xs: 1, sm: 'unset' }, minWidth: 0, '& .MuiInputBase-root': { height: 30, fontSize: 11 } }}
          />
          <Tooltip title="Filter by status">
            <IconButton size="small" aria-label="Filter by status" onClick={(event) => setFilterAnchor(event.currentTarget)}>
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
            {['All', 'Active', 'Inactive'].map((status) => (
              <MenuItem
                key={status}
                selected={statusFilter === status}
                onClick={() => {
                  setStatusFilter(status);
                  setFilterAnchor(null);
                  setPaginationModel((model) => ({ ...model, page: 0 }));
                }}
              >
                {status}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Stack>

      <Box ref={gridContainerRef} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', minWidth: 0, mt: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          rowHeight={rowHeight}
          columnHeaderHeight={46}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          localeText={{
            noRowsLabel: 'No users found',
            MuiTablePagination: { labelRowsPerPage: 'Items per page:' },
          }}
          sx={{
            width: '100%',
            minWidth: 0,
            fontSize: 14,
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
            '& .MuiDataGrid-footerContainer': { minHeight: 52, maxHeight: 52 },
            '& .MuiDataGrid-cell': { px: 0.75 },
            '& .MuiDataGrid-columnHeader': { px: 0.75 },
          }}
        />
      </Box>

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 'min(740px, calc(100vw - 24px))',
            m: 1.5,
            borderLeft: '6px solid #b51f24',
            borderRadius: 0.5,
          },
        }}
      >
        <Box component="form" onSubmit={saveUser}>
          <DialogTitle sx={{ px: 2.75, py: 1.5, fontSize: 14, fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <span>{editingRow ? `Edit ${activeTab === 0 ? 'Employee' : 'Customer'}` : `New ${activeTab === 0 ? 'Employee' : 'Customer'}`}</span>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormOpen(false)}
                  sx={{ minWidth: 56, py: 0.15, px: 1, color: '#333', borderColor: '#aaa', fontSize: 10, textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  sx={{ minWidth: 44, py: 0.15, px: 1, bgcolor: '#b51f24', fontSize: 10, textTransform: 'none', '&:hover': { bgcolor: '#95191d' } }}
                >
                  {editingRow ? 'Save' : 'Add'}
                </Button>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 2.75, pt: '12px !important', pb: 2.5, maxHeight: 'calc(100vh - 100px)' }}>
            {activeTab === 0 ? (
              <Box
                component="fieldset"
                sx={{ m: 0, minWidth: 0, px: 1.5, pt: 1.25, pb: 2, border: '1px solid #999', borderRadius: 1 }}
              >
                <Typography component="legend" sx={{ px: 0.5, fontSize: 11, fontWeight: 600 }}>
                  Employee Details
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                    columnGap: 3.25,
                    rowGap: 2,
                    alignItems: 'end',
                    pt: 0.5,
                  }}
                >
                  <TextField
                    label="Employee Name"
                    required
                    variant="standard"
                    size="small"
                    value={formValues.name}
                    onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                  />
                  <TextField
                    label="Login Employee Name"
                    required
                    variant="standard"
                    size="small"
                    value={formValues.loginName}
                    onChange={(event) => setFormValues({ ...formValues, loginName: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                  />
                  <TextField
                    label="Employee Email ID"
                    type="email"
                    variant="standard"
                    size="small"
                    value={formValues.email}
                    onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                  />
                  <FormControl required variant="standard" size="small">
                    <InputLabel sx={{ fontSize: 10 }}>Role</InputLabel>
                    <Select
                      value={formValues.role}
                      onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                      sx={{ fontSize: 11, minHeight: 25 }}
                    >
                      {[...new Set(roles)].map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                <Box
                  component="fieldset"
                  sx={{ m: 0, minWidth: 0, px: 1.5, pt: 1.25, pb: 2, border: '1px solid #999', borderRadius: 1 }}
                >
                  <Typography component="legend" sx={{ px: 0.5, fontSize: 11, fontWeight: 600 }}>
                    Customer Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                      columnGap: 3.25,
                      rowGap: 2,
                      alignItems: 'end',
                      pt: 0.5,
                    }}
                  >
                    <FormControl required variant="standard" size="small">
                      <InputLabel sx={{ fontSize: 10 }}>Customer Name</InputLabel>
                      <Select
                        value={formValues.name}
                        onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                        sx={{ fontSize: 11, minHeight: 25 }}
                      >
                        {[...new Set([...customerNames, formValues.name].filter(Boolean))].map((name) => (
                          <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl required variant="standard" size="small">
                      <InputLabel sx={{ fontSize: 10 }}>Station List</InputLabel>
                      <Select
                        multiple
                        value={formValues.stationList || []}
                        onChange={(event) => setFormValues({ ...formValues, stationList: event.target.value })}
                        renderValue={(selected) => selected.join(', ')}
                        sx={{ fontSize: 11, minHeight: 25 }}
                      >
                        {stationOptions.map((station) => (
                          <MenuItem key={station} value={station} dense>
                            <Checkbox size="small" checked={(formValues.stationList || []).includes(station)} sx={{ p: 0.25, mr: 0.5 }} />
                            <ListItemText primary={station} primaryTypographyProps={{ fontSize: 11 }} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Customer Email ID / Username"
                      required
                      type="email"
                      variant="standard"
                      size="small"
                      value={formValues.email}
                      onChange={(event) => setFormValues({ ...formValues, email: event.target.value, loginName: event.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                    />
                    <FormControl required variant="standard" size="small">
                      <InputLabel sx={{ fontSize: 10 }}>Role</InputLabel>
                      <Select
                        value={formValues.role}
                        onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                        sx={{ fontSize: 11, minHeight: 25 }}
                      >
                        {[...new Set([...customerRoles, formValues.role].filter(Boolean))].map((role) => (
                          <MenuItem key={role} value={role}>{role}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Company Name"
                      variant="standard"
                      size="small"
                      value={formValues.companyName || ''}
                      onChange={(event) => setFormValues({ ...formValues, companyName: event.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                    />
                  </Box>
                </Box>

                <Box
                  component="fieldset"
                  sx={{ m: 0, minWidth: 0, px: 1.5, pt: 1.25, pb: 1.75, border: '1px solid #999', borderRadius: 1 }}
                >
                  <Typography component="legend" sx={{ px: 0.5, fontSize: 11, fontWeight: 600 }}>
                    Customer Password Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(145px, 1fr))' }, columnGap: 3.25, maxWidth: 340, pt: 0.5 }}>
                    <TextField
                      label="New Password"
                      required={!editingRow}
                      type={showPassword ? 'text' : 'password'}
                      variant="standard"
                      size="small"
                      value={formValues.password || ''}
                      onChange={(event) => {
                        setFormValues({ ...formValues, password: event.target.value });
                        setFormError('');
                      }}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} edge="end">
                              {showPassword ? <VisibilityOffIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                    />
                    <TextField
                      label="Confirm Password"
                      required={!editingRow}
                      type={showConfirmPassword ? 'text' : 'password'}
                      variant="standard"
                      size="small"
                      value={formValues.confirmPassword || ''}
                      onChange={(event) => {
                        setFormValues({ ...formValues, confirmPassword: event.target.value });
                        setFormError('');
                      }}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirmPassword((visible) => !visible)} edge="end">
                              {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 10 }, '& .MuiInputBase-input': { fontSize: 11, py: 0.5 } }}
                    />
                  </Box>
                  <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ mb: 0.5, color: '#777', fontSize: 9 }}>Password Must:</Typography>
                    {[
                      ['Include an uppercase and a lowercase letter', /[A-Z]/.test(formValues.password || '') && /[a-z]/.test(formValues.password || '')],
                      ['Include a number and a special character', /[0-9]/.test(formValues.password || '') && /[^A-Za-z0-9]/.test(formValues.password || '')],
                      ['Be at least 8 characters long', (formValues.password || '').length >= 8],
                    ].map(([label, isValid]) => (
                      <Stack key={label} direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.2 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isValid ? '#55ad6a' : '#aaa' }} />
                        <Typography sx={{ color: isValid ? '#777' : '#999', fontSize: 9 }}>{label}</Typography>
                      </Stack>
                    ))}
                  </Box>
                  {formError && <Typography role="alert" sx={{ mt: 1, color: 'error.main', fontSize: 10 }}>{formError}</Typography>}
                </Box>
              </Stack>
            )}
          </DialogContent>
        </Box>
      </Dialog>

      <Dialog open={Boolean(detailsRow)} onClose={() => setDetailsRow(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16 }}>User Details</DialogTitle>
        <DialogContent>
          {detailsRow && (
            <Stack spacing={1} sx={{ py: 1 }}>
              {[['Name', detailsRow.name], ['Login Name', detailsRow.loginName], ['Role', detailsRow.role], ['Created Date', detailsRow.createdDate], ['Created By', detailsRow.createdBy || '—'], ['Status', detailsRow.status]].map(([label, value]) => (
                <Stack key={label} direction="row" spacing={1}>
                  <Typography sx={{ width: 110, fontSize: 12, color: '#666' }}>{label}</Typography>
                  <Typography sx={{ fontSize: 12 }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

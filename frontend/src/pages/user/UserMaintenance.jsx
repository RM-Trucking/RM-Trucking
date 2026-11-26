import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
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
import { useDispatch, useSelector } from 'react-redux';
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
import { getAuthorityRoleOptions, selectAuthorityRoles } from '../../redux/slices/role';
import { createUser, getCustomerOptions, getStationOptions, getUsers, selectUserPage, updateUserRow } from '../../redux/slices/userMaintenance';

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

export default function UserMaintenance() {
  const dispatch = useDispatch();
  const {
    customerOptions, customerOptionsLoading, customerOptionsError,
    stationOptions: customerStations, stationOptionsLoading, stationOptionsError,
  } = useSelector((state) => state.userMaintenance);
  const [activeTab, setActiveTab] = useState(0);
  const employeeTab = activeTab === 0;
  const roleKind = employeeTab ? 'EMPLOYEE' : 'CUSTOMER';
  const employeePage = useSelector((state) => selectUserPage(state, 'EMPLOYEE'));
  const customerPage = useSelector((state) => selectUserPage(state, 'CUSTOMER'));
  const { rows, totalCount, loading, error } = employeeTab ? employeePage : customerPage;
  const { options: authorityRoleOptions, loading: authorityRolesLoading, error: authorityRolesError } = useSelector((state) => selectAuthorityRoles(state, roleKind));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [employeePagination, setEmployeePagination] = useState({ page: 0, pageSize: 20 });
  const [customerPagination, setCustomerPagination] = useState({ page: 0, pageSize: 20 });
  const [userRefresh, setUserRefresh] = useState(0);
  const paginationModel = employeeTab ? employeePagination : customerPagination;
  const setPaginationModel = employeeTab ? setEmployeePagination : setCustomerPagination;
  useEffect(() => {
    const request = dispatch(getUsers({
      userType: roleKind,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      search: search.trim() || undefined,
      activeStatus: { Active: 'Y', Inactive: 'N' }[statusFilter],
    }));
    return () => request.abort();
  }, [dispatch, roleKind, paginationModel, userRefresh, search, statusFilter]);
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
  const [savingUser, setSavingUser] = useState(false);
  const savingUserRef = useRef(false);
  const creatingEmployee = activeTab === 0 && !editingRow;
  const creatingCustomer = activeTab === 1 && !editingRow;
  const customerOptionStatus = creatingCustomer && (
    customerOptionsLoading ? 'Loading customers…' : customerOptionsError || (customerOptions.length === 0 ? 'No customers available.' : '')
  );
  const stationOptionStatus = creatingCustomer && (
    !formValues.customerId ? 'Select a customer first.'
      : stationOptionsLoading ? 'Loading stations…'
      : stationOptionsError || (customerStations.length === 0 ? 'No stations available.' : '')
  );
  const availableStations = creatingCustomer
    ? (formValues.customerId ? customerStations : [])
    : stationOptions.map((stationName) => ({ stationId: stationName, stationName }));
  const selectedStations = (creatingCustomer ? formValues.stationIds : formValues.stationList) || [];
  const roleOptions = !editingRow
    ? authorityRoleOptions.filter(({ id }) => Number.isSafeInteger(Number(id)) && Number(id) > 0)
    : [...new Set([...(employeeTab ? roles : customerRoles), formValues.role].filter(Boolean))].map((role) => ({ id: role, role }));
  const selectedRole = roleOptions.find(({ id }) => String(id) === formValues.role);
  const roleOptionStatus = !editingRow && (
    authorityRolesLoading ? 'Loading roles…' : authorityRolesError || (roleOptions.length === 0 ? 'No roles available.' : '')
  );

  const openNewForm = () => {
    dispatch(getAuthorityRoleOptions(roleKind));
    if (!employeeTab) dispatch(getCustomerOptions());
    setEditingRow(null);
    setFormValues(activeTab === 0
      ? { name: '', loginName: '', email: '', role: '' }
      : { name: '', companyName: '', customerId: '', stationIds: [], loginName: '', email: '', role: '', password: '', confirmPassword: '' });
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

  const closeForm = () => {
    if (!savingUserRef.current) setFormOpen(false);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (savingUserRef.current) return;
    if (creatingCustomer && (customerOptionStatus || stationOptionStatus || roleOptionStatus || !selectedRole || selectedStations.length === 0)) return;
    if (!employeeTab) {
      const password = formValues.password || '';
      const confirmPassword = formValues.confirmPassword || '';
      const passwordIsValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

      if ((creatingCustomer || password) && !passwordIsValid) {
        setFormError('Use at least 8 characters, including uppercase, lowercase, and a special character.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }
    if (!editingRow) {
      if (roleOptionStatus || !selectedRole) return;

      savingUserRef.current = true;
      setSavingUser(true);
      setFormError('');
      try {
        await dispatch(createUser({
          userName: formValues.name.trim(),
          loginUserName: formValues.loginName.trim(),
          email: formValues.email.trim(),
          userType: roleKind,
          roleIds: [Number(selectedRole.id)],
          ...(creatingCustomer && {
            customerId: Number(formValues.customerId),
            stationIds: selectedStations.map(Number),
            password: formValues.password,
          }),
        }));
        setUserRefresh((count) => count + 1);
        setFormOpen(false);
      } catch (error) {
        setFormError(typeof error === 'string' ? error : error?.message || 'Unable to create user.');
      } finally {
        savingUserRef.current = false;
        setSavingUser(false);
      }
      return;
    }
    const userValues = Object.fromEntries(
      Object.entries(formValues).filter(([key]) => key !== 'password' && key !== 'confirmPassword')
    );
    dispatch(updateUserRow({ userType: roleKind, changes: { id: editingRow.id, ...userValues } }));
    setFormError('');
    setFormOpen(false);
  };

  const toggleStatus = ({ id, status }) => {
    const nextStatus = status === 'Active' ? 'Inactive' : 'Active';
    dispatch(updateUserRow({ userType: roleKind, changes: { id, status: nextStatus } }));
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
            <IconButton size="small" aria-label={`Toggle status for ${row.name}`} onClick={() => toggleStatus(row)}>
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
            (value === 0 ? setEmployeePagination : setCustomerPagination)((model) => ({ ...model, page: 0 }));
          }}
          aria-label="User type"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, px: 1, textTransform: 'none', fontSize: 12, color: '#777' }, '& .Mui-selected': { color: '#222' }, '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 } }}
        >
          <Tab label={`Employee (${employeePage.totalCount})`} />
          <Tab label={`Customer (${customerPage.totalCount})`} />
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
        {error && (
          <Alert severity="error" action={<Button color="inherit" onClick={() => setUserRefresh((count) => count + 1)}>Retry</Button>}>
            {error}
          </Alert>
        )}
        <DataGrid
          key={activeTab}
          rows={rows}
          columns={columns}
          rowHeight={rowHeight}
          columnHeaderHeight={46}
          paginationModel={paginationModel}
          paginationMode="server"
          rowCount={totalCount}
          loading={loading}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 25, 50]}
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
        onClose={closeForm}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 'min(1100px, calc(100vw - 32px))',
            minHeight: activeTab === 0 ? 'min(320px, calc(100dvh - 32px))' : 'min(560px, calc(100dvh - 32px))',
            maxHeight: 'calc(100dvh - 32px)',
            m: 2,
            borderRadius: 0.5,
          },
        }}
      >
        <Box component="form" onSubmit={saveUser} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <DialogTitle sx={{ px: 3, py: 2, flexShrink: 0, fontSize: 20, fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 2, flexWrap: 'wrap' }}>
              <span>{editingRow ? `Edit ${activeTab === 0 ? 'Employee' : 'Customer'}` : `New ${activeTab === 0 ? 'Employee' : 'Customer'}`}</span>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={closeForm}
                  disabled={savingUser}
                  sx={{ minWidth: 80, py: 0.75, px: 2, color: '#333', borderColor: '#aaa', fontSize: 14, textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  disabled={savingUser || Boolean(roleOptionStatus || customerOptionStatus || stationOptionStatus)}
                  sx={{ minWidth: 80, py: 0.75, px: 2, bgcolor: '#b51f24', fontSize: 14, textTransform: 'none', '&:hover': { bgcolor: '#95191d' } }}
                >
                  {savingUser ? 'Adding…' : editingRow ? 'Save' : 'Add'}
                </Button>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: '16px !important', pb: 3, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {activeTab === 0 ? (
              <Box
                component="fieldset"
                sx={{ m: 0, minWidth: 0, px: 2, pt: 2, pb: 3, border: '1px solid #999', borderRadius: 1 }}
              >
                <Typography component="legend" sx={{ px: 0.5, fontSize: 16, fontWeight: 600 }}>
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
                    disabled={savingUser}
                    variant="standard"
                    size="small"
                    value={formValues.name}
                    onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                  />
                  <TextField
                    label="Login Employee Name"
                    required
                    disabled={savingUser}
                    variant="standard"
                    size="small"
                    value={formValues.loginName}
                    onChange={(event) => setFormValues({ ...formValues, loginName: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                  />
                  <TextField
                    label="Employee Email ID"
                    type="email"
                    required={creatingEmployee}
                    disabled={savingUser}
                    variant="standard"
                    size="small"
                    value={formValues.email}
                    onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                  />
                  <FormControl
                    required
                    variant="standard"
                    size="small"
                    disabled={savingUser || Boolean(roleOptionStatus)}
                    error={creatingEmployee && Boolean(authorityRolesError)}
                  >
                    <InputLabel sx={{ fontSize: 14 }}>Role</InputLabel>
                    <Select
                      value={formValues.role}
                      onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                      sx={{ fontSize: 16, minHeight: 36 }}
                    >
                      {roleOptions.map(({ id, role }) => (
                        <MenuItem key={id} value={String(id)}>{role}</MenuItem>
                      ))}
                    </Select>
                    {roleOptionStatus && <FormHelperText>{roleOptionStatus}</FormHelperText>}
                  </FormControl>
                </Box>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                <Box
                  component="fieldset"
                  sx={{ m: 0, minWidth: 0, px: 2, pt: 2, pb: 3, border: '1px solid #999', borderRadius: 1 }}
                >
                  <Typography component="legend" sx={{ px: 0.5, fontSize: 16, fontWeight: 600 }}>
                    Customer Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                      columnGap: 3.25,
                      rowGap: 2,
                      alignItems: 'start',
                      pt: 0.5,
                    }}
                  >
                    <FormControl
                      required
                      variant="standard"
                      size="small"
                      disabled={savingUser || Boolean(customerOptionStatus)}
                      error={creatingCustomer && Boolean(customerOptionsError)}
                    >
                      <InputLabel sx={{ fontSize: 14 }}>Customer Name</InputLabel>
                      <Select
                        value={creatingCustomer ? formValues.customerId : formValues.name}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (creatingCustomer) {
                            const customer = customerOptions.find(({ customerId }) => String(customerId) === value);
                            if (customer) {
                              dispatch(getStationOptions(value));
                              setFormValues({ ...formValues, customerId: value, name: customer.customerName, stationIds: [] });
                            }
                          } else {
                            setFormValues({ ...formValues, name: value });
                          }
                        }}
                        sx={{ fontSize: 16, minHeight: 36 }}
                      >
                        {creatingCustomer
                          ? customerOptions.map(({ customerId, customerName }) => (
                              <MenuItem key={customerId} value={String(customerId)}>{customerName}</MenuItem>
                            ))
                          : [...new Set([...customerNames, formValues.name].filter(Boolean))].map((name) => (
                              <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                      </Select>
                      {customerOptionStatus && <FormHelperText>{customerOptionStatus}</FormHelperText>}
                    </FormControl>
                    <FormControl
                      required
                      variant="standard"
                      size="small"
                      disabled={savingUser || Boolean(stationOptionStatus)}
                      error={creatingCustomer && Boolean(formValues.customerId && stationOptionsError)}
                    >
                      <InputLabel sx={{ fontSize: 14 }}>Station List</InputLabel>
                      <Select
                        multiple
                        value={selectedStations}
                        onChange={(event) => {
                          const field = creatingCustomer ? 'stationIds' : 'stationList';
                          setFormValues({ ...formValues, [field]: event.target.value });
                        }}
                        renderValue={(selected) => availableStations
                          .filter(({ stationId }) => selected.includes(String(stationId)))
                          .map(({ stationName }) => stationName)
                          .join(', ')}
                        sx={{ fontSize: 16, minHeight: 36 }}
                      >
                        {availableStations.map(({ stationId, stationName }) => (
                          <MenuItem key={stationId} value={String(stationId)} dense>
                            <Checkbox size="small" checked={selectedStations.includes(String(stationId))} sx={{ p: 0.25, mr: 0.5 }} />
                            <ListItemText primary={stationName} primaryTypographyProps={{ fontSize: 16 }} />
                          </MenuItem>
                        ))}
                      </Select>
                      {stationOptionStatus && <FormHelperText>{stationOptionStatus}</FormHelperText>}
                    </FormControl>
                    <TextField
                      label="Customer Email ID / Username"
                      required
                      disabled={savingUser}
                      type="email"
                      variant="standard"
                      size="small"
                      value={formValues.email}
                      onChange={(event) => setFormValues({
                        ...formValues,
                        email: event.target.value,
                        loginName: event.target.value,
                      })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1, height: 36, boxSizing: 'border-box' } }}
                    />
                    <FormControl
                      required
                      variant="standard"
                      size="small"
                      disabled={savingUser || Boolean(roleOptionStatus)}
                      error={creatingCustomer && Boolean(authorityRolesError)}
                    >
                      <InputLabel sx={{ fontSize: 14 }}>Role</InputLabel>
                      <Select
                        value={formValues.role}
                        onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                        sx={{ fontSize: 16, minHeight: 36 }}
                      >
                        {roleOptions.map(({ id, role }) => (
                          <MenuItem key={id} value={String(id)}>{role}</MenuItem>
                        ))}
                      </Select>
                      {roleOptionStatus && <FormHelperText>{roleOptionStatus}</FormHelperText>}
                    </FormControl>
                    <TextField
                      label="Company Name"
                      disabled={savingUser}
                      variant="standard"
                      size="small"
                      value={formValues.companyName || ''}
                      onChange={(event) => setFormValues({ ...formValues, companyName: event.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                    />
                  </Box>
                </Box>

                <Box
                  component="fieldset"
                  sx={{ m: 0, minWidth: 0, px: 1.5, pt: 1.25, pb: 1.75, border: '1px solid #999', borderRadius: 1 }}
                >
                  <Typography component="legend" sx={{ px: 0.5, fontSize: 16, fontWeight: 600 }}>
                    Customer Password Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(145px, 1fr))' }, columnGap: 3.25, maxWidth: 500, pt: 0.5 }}>
                    <TextField
                      label="New Password"
                      required={creatingCustomer}
                      disabled={savingUser}
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
                      sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                    />
                    <TextField
                      label="Confirm Password"
                      required={creatingCustomer}
                      disabled={savingUser}
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
                      sx={{ '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                    />
                  </Box>
                  <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ mb: 0.5, color: '#777', fontSize: 12 }}>Password Must:</Typography>
                    {[
                      ['Include an uppercase and a lowercase letter', /[A-Z]/.test(formValues.password || '') && /[a-z]/.test(formValues.password || '')],
                      ['Include a number and a special character', /[0-9]/.test(formValues.password || '') && /[^A-Za-z0-9]/.test(formValues.password || '')],
                      ['Be at least 8 characters long', (formValues.password || '').length >= 8],
                    ].map(([label, isValid]) => (
                      <Stack key={label} direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.2 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isValid ? '#55ad6a' : '#aaa' }} />
                        <Typography sx={{ color: isValid ? '#777' : '#999', fontSize: 12 }}>{label}</Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              </Stack>
            )}
            {formError && <Typography role="alert" sx={{ mt: 1, color: 'error.main', fontSize: 14 }}>{formError}</Typography>}
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

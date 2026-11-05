import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { HEADER } from '../../config';

const employeeRoles = [
  'Super Admin',
  'Admin',
  'Warehouse Supervisor',
  'Warehouse Staff',
  'Route Planner',
  'Loading Admin',
  'Logistics Dock Operator',
  'Maintenance Technician',
  'Ground Staff',
  'General Staff',
];

const customerRoles = [
  'Customer Admin',
  'Account Admin',
  'Shipping User',
  'Billing Contact',
  'Read Only User',
];

const employeeCounts = ['01', '05', '10', '14', '02', '03', '05', '00', '00', '00'];
const sampleEmployees = [
  'Avery', 'Jordan', 'Taylor', 'Riley', 'Casey', 'Cameron', 'Morgan', 'Quinn', 'Skyler', 'Jamie',
  'Reese', 'Rowan', 'Parker', 'Drew', 'Payton', 'Robin', 'Ari', 'Sage', 'Cory', 'Frankie',
];
const sampleCustomers = [
  'Ventana Customer', 'Acme Distribution', 'Northstar Logistics', 'Pioneer Supply', 'Summit Freight',
];
const permissionModules = ['AIR Export', 'Network', 'Maintenance'];
const permissionSections = [
  {
    id: 'customer',
    title: 'Customer Access',
    items: [
      { id: 'createCustomer', label: 'Can Create Customer' },
      { id: 'editCustomer', label: 'Can Edit Customer' },
      { id: 'viewCustomer', label: 'Can View Customer' },
    ],
  },
  {
    id: 'carrier',
    title: 'Carrier Access',
    items: [
      { id: 'createCarrier', label: 'Can Create Carrier' },
      { id: 'editCarrier', label: 'Can Edit Carrier' },
      { id: 'viewCarrier', label: 'Can View Carrier' },
    ],
  },
  {
    id: 'user',
    title: 'User Access',
    items: [
      { id: 'createUser', label: 'Can Create User' },
      { id: 'editUser', label: 'Can Edit User' },
      { id: 'viewUser', label: 'Can View User' },
      { id: 'activateUser', label: 'Can Activate User' },
      { id: 'deactivateUser', label: 'Can De-activate User' },
      { id: 'resetPassword', label: 'Can Reset User Password' },
    ],
  },
  {
    id: 'role',
    title: 'Role Access',
    items: [
      { id: 'createRole', label: 'Can Create Role' },
      { id: 'editRole', label: 'Can Edit Role' },
      { id: 'viewRole', label: 'Can View Role' },
      { id: 'deleteRole', label: 'Can Delete Role' },
    ],
  },
];

const createDefaultPermissions = () => Object.fromEntries(
  permissionModules.map((module) => [
    module,
    Object.fromEntries(permissionSections.map((section) => [section.id, section.items.map((item) => item.id)])),
  ])
);

const createRows = (count, isCustomer = false) => {
  const roleOptions = isCustomer ? customerRoles : employeeRoles;
  return Array.from({ length: count }, (_, index) => {
    const roleIndex = index % roleOptions.length;
    return {
      id: `${isCustomer ? 'customer' : 'employee'}-role-${index + 1}`,
      serialNumber: String(index + 1).padStart(2, '0'),
      assignedCount: isCustomer ? String((index % 8) + 1).padStart(2, '0') : employeeCounts[index % employeeCounts.length],
      role: roleOptions[roleIndex],
      authorityRole: roleIndex === 0 ? '' : roleOptions[roleIndex - 1],
      permissions: createDefaultPermissions(),
    };
  });
};

export default function RoleMaintenance() {
  const [employeeRows, setEmployeeRows] = useState(() => createRows(20));
  const [customerRows, setCustomerRows] = useState(() => createRows(50, true));
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
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
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [roleValues, setRoleValues] = useState({ role: '', authorityRole: '' });
  const [permissionModule, setPermissionModule] = useState('Maintenance');
  const [permissionValues, setPermissionValues] = useState(createDefaultPermissions);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [formError, setFormError] = useState('');

  const rows = activeTab === 0 ? employeeRows : customerRows;
  const setRows = activeTab === 0 ? setEmployeeRows : setCustomerRows;
  const roleOptions = activeTab === 0 ? employeeRoles : customerRoles;
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query ||
        [row.role, row.authorityRole, row.assignedCount].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (roleFilter === 'All Roles' || row.role === roleFilter);
    });
  }, [rows, roleFilter, search]);

  const openNewRole = () => {
    setEditingRow(null);
    setRoleValues({ role: '', authorityRole: '' });
    setPermissionModule('Maintenance');
    setPermissionValues(createDefaultPermissions());
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const openEditRole = (row) => {
    setEditingRow(row);
    setRoleValues({ role: row.role, authorityRole: row.authorityRole });
    setPermissionModule('Maintenance');
    setPermissionValues(row.permissions || createDefaultPermissions());
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const saveRolePermissions = (event) => {
    event.preventDefault();
    const roleName = roleValues.role.trim();
    if (!roleName) {
      setFormError('Role name is required.');
      return;
    }
    if (rows.some((row) => row.role.toLowerCase() === roleName.toLowerCase() && row.id !== editingRow?.id)) {
      setFormError('A role with this name already exists.');
      return;
    }

    setRows((currentRows) => editingRow
      ? currentRows.map((row) => row.id === editingRow.id
        ? { ...row, role: roleName, permissions: permissionValues }
        : row)
      : [{
          id: `${activeTab === 0 ? 'employee' : 'customer'}-role-${Date.now()}`,
          serialNumber: String(currentRows.length + 1).padStart(2, '0'),
          assignedCount: '00',
          role: roleName,
          authorityRole: '',
          permissions: permissionValues,
        }, ...currentRows]);
    setPaginationModel((model) => ({ ...model, page: 0 }));
    setPermissionDialogOpen(false);
    setEditingRow(null);
  };

  const columns = [
    { field: 'serialNumber', headerName: 'SNo', width: 52, sortable: true, filterable: false },
    {
      field: 'assignedCount',
      headerName: activeTab === 0 ? 'No of Employee' : 'No of Customer',
      width: 140,
      filterable: false,
      renderCell: ({ row, value }) => (
        <Button
          size="small"
          onClick={() => setSelectedRow({ ...row, showAssignments: true })}
          sx={{ minWidth: 0, p: 0, color: '#b51f24', fontSize: 14, textDecoration: 'underline', textTransform: 'none' }}
        >
          {value}
        </Button>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      minWidth: 160,
      flex: 1,
      filterable: false,
      renderCell: ({ value }) => (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <GroupsOutlinedIcon sx={{ color: '#b51f24', fontSize: 14 }} />
          <span>{value}</span>
        </Stack>
      ),
    },
    { field: 'authorityRole', headerName: 'Authority Role', minWidth: 190, flex: 1.4, filterable: false },
    {
      field: 'actions',
      headerName: 'Action',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={0}>
          <Tooltip title="View role">
            <IconButton size="small" aria-label={`View ${row.role}`} onClick={() => setSelectedRow(row)}>
              <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit role">
            <IconButton size="small" aria-label={`Edit ${row.role}`} onClick={() => openEditRole(row)}>
              <EditOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete role">
            <IconButton size="small" aria-label={`Delete ${row.role}`} onClick={() => setRowToDelete(row)}>
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const assignedUsers = selectedRow?.showAssignments
    ? (activeTab === 0 ? sampleEmployees : sampleCustomers)
      .slice(0, Number(selectedRow.assignedCount))
      .map((name, index) => ({
        id: `${selectedRow.id}-assignee-${index + 1}`,
        serialNumber: String(index + 1).padStart(2, '0'),
        name,
      }))
    : [];

  return (
    <Box sx={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: `calc(100dvh - ${HEADER.H_DASHBOARD_DESKTOP + 8}px)`, minHeight: 360, px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 1, width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontSize: 16, fontWeight: 700, color: '#222' }}>
          Role Maintenance
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openNewRole}
          sx={{ flexShrink: 0, bgcolor: '#b51f24', textTransform: 'none', fontSize: 11, '&:hover': { bgcolor: '#95191d' } }}
        >
          New Role
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
            setRoleFilter('All Roles');
          }}
          aria-label="Role category"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, px: 1, textTransform: 'none', fontSize: 12, color: '#777' }, '& .Mui-selected': { color: '#222' }, '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 } }}
        >
          <Tab label={`Employee (${employeeRows.length})`} />
          <Tab label={`Customer (${customerRows.length})`} />
        </Tabs>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ pb: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPaginationModel((model) => ({ ...model, page: 0 }));
            }}
            placeholder="Search"
            aria-label="Search roles"
            InputProps={{
              endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: '#888', fontSize: 17 }} /></InputAdornment>,
            }}
            sx={{ width: { xs: 'auto', sm: 165 }, flex: { xs: 1, sm: 'unset' }, minWidth: 0, '& .MuiInputBase-root': { height: 30, fontSize: 11 } }}
          />
          <Tooltip title="Filter by role">
            <IconButton size="small" aria-label="Filter by role" onClick={(event) => setFilterAnchor(event.currentTarget)}>
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
            {['All Roles', ...new Set(roleOptions)].map((role) => (
              <MenuItem
                key={role}
                selected={roleFilter === role}
                onClick={() => {
                  setRoleFilter(role);
                  setFilterAnchor(null);
                  setPaginationModel((model) => ({ ...model, page: 0 }));
                }}
              >
                {role}
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
            noRowsLabel: 'No roles found',
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
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 'min(1280px, calc(100vw - 32px))',
            height: 'min(900px, calc(100dvh - 32px))',
            maxHeight: 'calc(100dvh - 32px)',
            m: 2,
            borderRadius: 0.5,
          },
        }}
      >
        <Box component="form" onSubmit={saveRolePermissions} sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <DialogTitle sx={{ px: 3, py: 2, flexShrink: 0, fontSize: 20, fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <span>{editingRow ? 'Edit' : 'New'} {activeTab === 0 ? 'Employee' : 'Customer'} Role</span>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPermissionDialogOpen(false)}
                  sx={{ minWidth: 80, py: 0.75, px: 2, color: '#333', borderColor: '#aaa', fontSize: 14, textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  sx={{ minWidth: 80, py: 0.75, px: 2, bgcolor: '#b51f24', fontSize: 14, textTransform: 'none', '&:hover': { bgcolor: '#95191d' } }}
                >
                  {editingRow ? 'Submit' : 'Create'}
                </Button>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: '12px !important', pb: 3, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
              <TextField
                label="Role Name"
                required
                variant="standard"
                size="small"
                value={roleValues.role}
                onChange={(event) => {
                  setRoleValues({ ...roleValues, role: event.target.value });
                  setFormError('');
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
              />
              {editingRow && (
                <>
                  <TextField
                    label={activeTab === 0 ? 'No of Employee' : 'No of Customer'}
                    variant="standard"
                    size="small"
                    value={editingRow.assignedCount}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ readOnly: true }}
                    sx={{ width: { xs: '100%', sm: 150 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
                  />
                  <GroupsOutlinedIcon sx={{ color: '#b51f24', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
                </>
              )}
            </Stack>

            <Tabs
              value={permissionModule}
              onChange={(_, value) => setPermissionModule(value)}
              aria-label="Role permission module"
              variant="scrollable"
              sx={{
                minHeight: 44,
                borderBottom: '1px solid #ddd',
                '& .MuiTab-root': { minHeight: 44, px: 1, py: 0, textTransform: 'none', fontSize: 14, color: '#777' },
                '& .Mui-selected': { color: '#222', fontWeight: 600 },
                '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 },
              }}
            >
              {permissionModules.map((module) => <Tab key={module} value={module} label={module} />)}
            </Tabs>

            {formError && <Typography role="alert" sx={{ mt: 1, color: 'error.main', fontSize: 14 }}>{formError}</Typography>}

            <Stack spacing={2.5} sx={{ pt: 2.5 }}>
              {permissionSections.map((section) => {
                const checkedItems = permissionValues[permissionModule]?.[section.id] || [];
                const allChecked = section.items.every((item) => checkedItems.includes(item.id));
                const someChecked = checkedItems.length > 0 && !allChecked;
                return (
                  <Box
                    key={section.id}
                    component="fieldset"
                    sx={{ m: 0, minWidth: 0, px: 2, pt: 1.5, pb: 2, border: '1px solid #999', borderRadius: 1 }}
                  >
                    <Typography component="legend" sx={{ px: 0.5, fontSize: 14, fontWeight: 600 }}>
                      {section.title}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 150px' },
                        columnGap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, alignItems: 'center' }}>
                        {section.items.map((item) => (
                          <FormControlLabel
                            key={item.id}
                            label={item.label}
                            control={(
                              <Checkbox
                                size="small"
                                checked={checkedItems.includes(item.id)}
                                onChange={(event) => {
                                  const isChecked = event.target.checked;
                                  setPermissionValues((current) => {
                                    const currentSection = current[permissionModule][section.id];
                                    return {
                                      ...current,
                                      [permissionModule]: {
                                        ...current[permissionModule],
                                        [section.id]: isChecked
                                          ? [...currentSection, item.id]
                                          : currentSection.filter((permission) => permission !== item.id),
                                      },
                                    };
                                  });
                                }}
                                sx={{ p: 0.75, mr: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }}
                              />
                            )}
                            sx={{ m: 0, minHeight: 36, '& .MuiFormControlLabel-label': { fontSize: 14 } }}
                          />
                        ))}
                      </Box>
                      <Box
                        sx={{
                          minHeight: 40,
                          borderLeft: { xs: 'none', sm: '2px solid #b51f24' },
                          borderTop: { xs: '1px solid #eee', sm: 'none' },
                          pl: { xs: 0, sm: 1.5 },
                          mt: { xs: 0.5, sm: 0 },
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <FormControlLabel
                          label="Select All"
                          control={(
                            <Checkbox
                              size="small"
                              checked={allChecked}
                              indeterminate={someChecked}
                              onChange={() => {
                                setPermissionValues((current) => ({
                                  ...current,
                                  [permissionModule]: {
                                    ...current[permissionModule],
                                    [section.id]: allChecked ? [] : section.items.map((item) => item.id),
                                  },
                                }));
                              }}
                              sx={{ p: 0.75, mr: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }}
                            />
                          )}
                          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 14, whiteSpace: 'nowrap' } }}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </DialogContent>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        fullWidth={!selectedRow?.showAssignments}
        maxWidth={selectedRow?.showAssignments ? false : 'xs'}
        PaperProps={selectedRow?.showAssignments ? { sx: { width: 'min(720px, calc(100vw - 24px))', m: 1.5 } } : undefined}
      >
        <DialogTitle sx={{ fontSize: 14, pb: 1, borderBottom: selectedRow?.showAssignments ? '1px solid #999' : 'none' }}>
          {selectedRow?.showAssignments ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {selectedRow.role} - {activeTab === 0 ? 'Employee' : 'Customer'} List
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => setSelectedRow(null)}
                sx={{ minWidth: 42, py: 0.15, px: 1, bgcolor: '#b51f24', fontSize: 10, textTransform: 'none' }}
              >
                OK
              </Button>
            </Stack>
          ) : 'Role Details'}
        </DialogTitle>
        <DialogContent sx={selectedRow?.showAssignments ? { pt: '12px !important', pb: 2 } : undefined}>
          {selectedRow?.showAssignments ? (
            <Box sx={{ height: 210, width: '100%', border: '1px solid #e2e2e2', borderRadius: 1, overflow: 'hidden' }}>
              <DataGrid
                rows={assignedUsers}
                columns={[
                  { field: 'serialNumber', headerName: 'SNo', width: 58, sortable: false, filterable: false },
                  { field: 'name', headerName: 'Names', flex: 1, sortable: false, filterable: false },
                ]}
                hideFooter
                disableColumnMenu
                disableRowSelectionOnClick
                rowHeight={27}
                columnHeaderHeight={28}
                localeText={{ noRowsLabel: 'No users assigned.' }}
                sx={{
                  border: 0,
                  fontSize: 10,
                  '& .MuiDataGrid-columnHeaders': { bgcolor: '#f5f5f5' },
                  '& .MuiDataGrid-columnHeaderTitle': { fontSize: 10, fontWeight: 600 },
                  '& .MuiDataGrid-cell': { borderColor: '#f0f0f0', outline: 'none !important' },
                }}
              />
            </Box>
          ) : selectedRow && (
            <Stack spacing={1} sx={{ py: 1 }}>
              <Typography sx={{ fontSize: 12 }}><b>Role:</b> {selectedRow.role}</Typography>
              <Typography sx={{ fontSize: 12 }}><b>Authority Role:</b> {selectedRow.authorityRole || 'None'}</Typography>
              <Typography sx={{ fontSize: 12 }}><b>{activeTab === 0 ? 'Employees' : 'Customers'}:</b> {selectedRow.assignedCount}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rowToDelete)} onClose={() => setRowToDelete(null)}>
        <DialogTitle sx={{ fontSize: 16 }}>Delete Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13 }}>Delete the “{rowToDelete?.role}” role?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRowToDelete(null)} color="inherit">Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setRows((currentRows) => currentRows.filter((row) => row.id !== rowToDelete.id));
              setRowToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

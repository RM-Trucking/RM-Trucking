import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { HEADER } from '../../config';
import { useDispatch, useSelector } from '../../redux/store';
import { getRoles, getAuthorityRoleOptions, getPermissionCatalog, createRole, deleteRole, setEmployeeRows, setCustomerRows } from '../../redux/slices/role';

const sampleEmployees = [
  'Avery', 'Jordan', 'Taylor', 'Riley', 'Casey', 'Cameron', 'Morgan', 'Quinn', 'Skyler', 'Jamie',
  'Reese', 'Rowan', 'Parker', 'Drew', 'Payton', 'Robin', 'Ari', 'Sage', 'Cory', 'Frankie',
];
const sampleCustomers = [
  'Ventana Customer', 'Acme Distribution', 'Northstar Logistics', 'Pioneer Supply', 'Summit Freight',
];
const permissionModules = ['AIR Export', 'Network', 'Maintenance'];
const permissionApplications = {
  'AIR Export': 'warehouse',
  Network: 'network_services',
  Maintenance: 'maintenance',
};

const getPermissionSections = (catalog, module) => Object.entries(
  catalog[permissionApplications[module]] || {}
).map(([id, permissions]) => ({
  id,
  title: id.split('_').map((word) => word === 'id' ? 'ID' : word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  items: permissions.map((permission) => ({ id: permission.permissionId, label: permission.displayName })),
}));

const createDefaultPermissions = (catalog = {}) => Object.fromEntries(
  permissionModules.map((module) => [
    module,
    Object.fromEntries(getPermissionSections(catalog, module).map((section) => [section.id, section.items.map((item) => item.id)])),
  ])
);

export default function RoleMaintenance() {
  const dispatch = useDispatch();
  const { employeeRows, customerRows, isLoading: rolesLoading, error: rolesError, permissionCatalog, catalogLoading, catalogError, saving } = useSelector((state) => state.roledata);
  const { authorityRoleOptions, authorityRolesLoading, authorityRolesError } = useSelector((state) => state.roledata);

  const [activeTab, setActiveTab] = useState(0);
  const roleKind = activeTab === 0 ? 'EMPLOYEE' : 'CUSTOMER';
  useEffect(() => {
    dispatch(getRoles(roleKind));
  }, [dispatch, roleKind]);
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
  const [permissionModule, setPermissionModule] = useState('AIR Export');
  const [permissionValues, setPermissionValues] = useState(() => createDefaultPermissions());
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSucceeded, setDeleteSucceeded] = useState(false);
  const [formError, setFormError] = useState('');
  const [description, setDescription] = useState('');
  const savingRef = useRef(false);
  const permissionSections = getPermissionSections(permissionCatalog, permissionModule);
  const selectedAuthorityRole = roleValues.authorityRole || authorityRoleOptions.find(
    (role) => editingRow?.parentRoleIds?.includes(role.id)
  )?.role || '';

  useEffect(() => {
    if (permissionDialogOpen) dispatch(getAuthorityRoleOptions(roleKind));
  }, [dispatch, permissionDialogOpen, roleKind]);

  useEffect(() => {
    if (!permissionDialogOpen) return undefined;
    let active = true;
    const loadCatalog = async () => {
      const action = await dispatch(getPermissionCatalog());
      if (active && getPermissionCatalog.fulfilled.match(action)) {
        setPermissionValues(editingRow?.permissions || createDefaultPermissions(action.payload));
      }
    };
    loadCatalog();
    return () => { active = false; };
  }, [permissionDialogOpen, editingRow, dispatch]);

  const rows = activeTab === 0 ? employeeRows : customerRows;
  const setRows = (update) => dispatch((activeTab === 0 ? setEmployeeRows : setCustomerRows)(update(rows)));
  const roleOptions = [...new Set(rows.map((row) => row.role))];
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
    setDescription('');
    setPermissionModule('AIR Export');
    setPermissionValues(createDefaultPermissions());
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const openEditRole = (row) => {
    setEditingRow(row);
    setDescription(row.description || '');
    setRoleValues({ role: row.role, authorityRole: row.authorityRole });
    setPermissionModule('AIR Export');
    setPermissionValues(row.permissions || createDefaultPermissions());
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const saveRolePermissions = async (event) => {
    event.preventDefault();
    if (catalogLoading || catalogError || authorityRolesLoading || authorityRolesError || saving || savingRef.current) return;
    const roleName = roleValues.role.trim();
    if (!roleName) {
      setFormError('Role name is required.');
      return;
    }
    const authorityRole = authorityRoleOptions.find((role) => role.role === selectedAuthorityRole);
    if (!authorityRole) {
      setFormError('Authority role is required.');
      return;
    }
    if (rows.some((row) => row.role.toLowerCase() === roleName.toLowerCase() && row.id !== editingRow?.id)) {
      setFormError('A role with this name already exists.');
      return;
    }

    let createdRole;
    if (!editingRow && activeTab === 0) {
      const permissionCodes = [...new Set(permissionModules.flatMap((module) =>
        Object.entries(permissionCatalog[permissionApplications[module]] || {}).flatMap(([section, permissions]) =>
          permissions
            .filter((permission) => permissionValues[module]?.[section]?.includes(permission.permissionId))
            .map((permission) => permission.permissionCode)
        )
      ))];
      savingRef.current = true;
      setFormError('');
      try {
        createdRole = await dispatch(createRole({
          name: roleName,
          description: description.trim(),
          roleKind: 'EMPLOYEE',
          status: 'ACTIVE',
          permissionCodes,
          parentRoleIds: authorityRole.id == null ? null : [authorityRole.id],
        })).unwrap();
      } catch (error) {
        setFormError(error?.message || error?.error || (typeof error === 'string' ? error : 'Unable to create role. Please try again.'));
        return;
      } finally {
        savingRef.current = false;
      }
    }

    setRows((currentRows) => editingRow
      ? currentRows.map((row) => row.id === editingRow.id
        ? { ...row, role: roleName, description: description.trim(), authorityRole: selectedAuthorityRole, permissions: permissionValues }
        : row)
      : [{
          id: createdRole?.roleId ?? createdRole?.id ?? `${activeTab === 0 ? 'employee' : 'customer'}-role-${Date.now()}`,
          serialNumber: String(currentRows.length + 1).padStart(2, '0'),
          assignedCount: '00',
          role: roleName,
          description: description.trim(),
          authorityRole: selectedAuthorityRole,
          permissions: permissionValues,
        }, ...currentRows]);
    setPaginationModel((model) => ({ ...model, page: 0 }));
    setPermissionDialogOpen(false);
    setEditingRow(null);
    if (!editingRow && activeTab === 0) dispatch(getRoles(roleKind));
  };

  const confirmDeleteRole = async () => {
    if (!rowToDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await dispatch(deleteRole(rowToDelete.id)).unwrap();
      setRowToDelete(null);
      setPaginationModel((model) => ({ ...model, page: 0 }));
      setDeleteSucceeded(true);
    } catch (error) {
      setDeleteError(error?.message || (typeof error === 'string' ? error : 'Unable to delete role.'));
    } finally {
      setDeleting(false);
    }
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
            <IconButton size="small" aria-label={`Delete ${row.role}`} onClick={() => {
              setDeleteError('');
              setRowToDelete(row);
            }}>
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

      {rolesError && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Typography role="alert" sx={{ color: 'error.main', fontSize: 14 }}>{rolesError}</Typography>
          <Button size="small" onClick={() => dispatch(getRoles(roleKind))}>Retry</Button>
        </Stack>
      )}

      <Box ref={gridContainerRef} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', minWidth: 0, mt: 2 }}>
        <DataGrid
          loading={rolesLoading}
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
        onClose={() => { if (!saving) setPermissionDialogOpen(false); }}
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
                  disabled={saving}
                  onClick={() => setPermissionDialogOpen(false)}
                  sx={{ minWidth: 80, py: 0.75, px: 2, color: '#333', borderColor: '#aaa', fontSize: 14, textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  disabled={saving || catalogLoading || Boolean(catalogError) || authorityRolesLoading || Boolean(authorityRolesError)}
                  variant="contained"
                  sx={{ minWidth: 80, py: 0.75, px: 2, bgcolor: '#b51f24', fontSize: 14, textTransform: 'none', '&:hover': { bgcolor: '#95191d' } }}
                >
                  {saving ? 'Creating...' : editingRow ? 'Submit' : 'Create'}
                </Button>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: '12px !important', pb: 3, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
              <TextField
                label="Role Name"
                disabled={saving}
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
              <TextField
                select
                label="Authority Role"
                disabled={saving || authorityRolesLoading || Boolean(authorityRolesError)}
                error={Boolean(authorityRolesError)}
                helperText={authorityRolesLoading ? 'Loading roles...' : authorityRolesError || (authorityRoleOptions.length === 0 ? 'No authority roles available.' : '')}
                required
                variant="standard"
                size="small"
                value={authorityRoleOptions.some((role) => role.role === selectedAuthorityRole) ? selectedAuthorityRole : ''}
                onChange={(event) => {
                  setRoleValues({ ...roleValues, authorityRole: event.target.value });
                  setFormError('');
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
              >
                {authorityRoleOptions.length === 0 && <MenuItem disabled value="">No roles available</MenuItem>}
                {authorityRoleOptions.map((role) => (
                  <MenuItem key={role.id ?? role.role} value={role.role}>{role.role}</MenuItem>
                ))}
              </TextField>
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

            <TextField
              label="Description"
              disabled={saving}
              variant="standard"
              size="small"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, width: { xs: '100%', sm: 464 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
            />

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

            {catalogLoading && <Typography role="status" sx={{ mt: 2, fontSize: 14 }}>Loading permissions...</Typography>}
            {catalogError && <Typography role="alert" sx={{ mt: 2, color: 'error.main', fontSize: 14 }}>{catalogError}</Typography>}
            {!catalogLoading && !catalogError && permissionSections.length === 0 && (
              <Typography sx={{ mt: 2, fontSize: 14 }}>No permissions available for this module.</Typography>
            )}

            <Stack spacing={2.5} sx={{ pt: 2.5 }}>
              {permissionSections.map((section) => {
                const checkedItems = permissionValues[permissionModule]?.[section.id] || [];
                const allChecked = section.items.length > 0 && section.items.every((item) => checkedItems.includes(item.id));
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
                                disabled={saving}
                                onChange={(event) => {
                                  const isChecked = event.target.checked;
                                  setPermissionValues((current) => {
                                    const currentSection = current[permissionModule]?.[section.id] || [];
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
                          alignSelf: 'stretch',
                          borderLeft: { xs: 'none', sm: '2px solid #b51f24' },
                          borderTop: { xs: '1px solid #eee', sm: 'none' },
                          pl: { xs: 0, sm: 1.5 },
                          mt: { xs: 0.5, sm: -1.5 },
                          mb: { xs: 0, sm: -2 },
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
                              disabled={saving}
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

      <Dialog
        open={Boolean(rowToDelete)}
        onClose={() => { if (!deleting) setRowToDelete(null); }}
        aria-labelledby="delete-role-title"
        aria-describedby="delete-role-description"
        slotProps={{ paper: { sx: { width: 500, maxWidth: 'calc(100% - 32px)', m: 2, p: '0 8px', border: '2px solid #2196f3', borderRadius: '10px', boxShadow: 'none', bgcolor: '#fff' } } }}
      >
        <DialogTitle id="delete-role-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #999', px: 0.5, py: 0.5, fontSize: 13 }}>
          Delete Role
          <IconButton aria-label="Close" size="small" onClick={() => setRowToDelete(null)} disabled={deleting} sx={{ p: 0.25, color: 'text.primary' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ '&&': { pt: 4, pb: '28px', px: 1 }, textAlign: 'center' }}>
          <Typography id="delete-role-description" sx={{ fontSize: 12 }}>
            Are you sure you want to delete the <strong>{rowToDelete?.role}</strong> role?
          </Typography>
          {deleteError && <Typography role="alert" color="error" sx={{ mt: 1, fontSize: 12 }}>{deleteError}</Typography>}
        </DialogContent>
        <DialogActions disableSpacing sx={{ justifyContent: 'center', gap: 1.25, pt: 0, pb: '17px', '& .MuiButton-root': { minWidth: 62, minHeight: 22, px: 1, py: 0, fontSize: 12, lineHeight: 1.5, textTransform: 'none', borderRadius: '5px' } }}>
          <Button variant="outlined" color="inherit" onClick={() => setRowToDelete(null)} disabled={deleting}>No</Button>
          <Button variant="contained" color="error" disableElevation onClick={confirmDeleteRole} disabled={deleting} sx={{ bgcolor: '#ad201d', '&:hover': { bgcolor: '#8c1917' } }}>
            {deleting ? 'Deleting…' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={deleteSucceeded}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={5000}
        onClose={(_, reason) => { if (reason !== 'clickaway') setDeleteSucceeded(false); }}
      >
        <Alert severity="success" variant="filled" onClose={() => setDeleteSucceeded(false)}>
          Role deleted successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}

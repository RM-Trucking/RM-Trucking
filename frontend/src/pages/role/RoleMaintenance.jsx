import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  MenuItem,
  Snackbar,
  SvgIcon,
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
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { HEADER } from '../../config';
import { useDispatch, useSelector } from '../../redux/store';
import { getRoles, getRoleDetails, getAuthorityRoleOptions, selectAuthorityRoles, getPermissionCatalog, clearPermissionCatalog, createRole, updateRole, deleteRole } from '../../redux/slices/role';

const sampleEmployees = [
  'Avery', 'Jordan', 'Taylor', 'Riley', 'Casey', 'Cameron', 'Morgan', 'Quinn', 'Skyler', 'Jamie',
  'Reese', 'Rowan', 'Parker', 'Drew', 'Payton', 'Robin', 'Ari', 'Sage', 'Cory', 'Frankie',
];
const sampleCustomers = [
  'Ventana Customer', 'Acme Distribution', 'Northstar Logistics', 'Pioneer Supply', 'Summit Freight',
];
const permissionModules = ['AIR Export', 'Network', 'Maintenance'];
const emptyPermissionCatalog = {};
const formatRoleTimestamp = (value) => typeof value === 'string'
  ? value.replace(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}):\d{2}.*$/, '$1 $2')
  : value;
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

const createPermissionValues = (catalog, selectedIds) => Object.fromEntries(
  permissionModules.map((module) => [
    module,
    Object.fromEntries(getPermissionSections(catalog, module).map((section) => [
      section.id,
      section.items.filter((item) => !selectedIds || selectedIds.has(String(item.id))).map((item) => item.id),
    ])),
  ])
);

export default function RoleMaintenance() {
  const dispatch = useDispatch();
  const { employeeRows, customerRows, isLoading: rolesLoading, error: rolesError, roleCounts, rolePagination, permissionCatalogs, saving } = useSelector((state) => state.roledata);
  const { options: authorityRoleOptions, loading: authorityRolesLoading, error: authorityRolesError } = useSelector((state) => selectAuthorityRoles(state, 'EMPLOYEE'));

  const [activeTab, setActiveTab] = useState(0);
  const roleKind = activeTab === 0 ? 'EMPLOYEE' : 'CUSTOMER';
  const { data: permissionCatalog = emptyPermissionCatalog, loading: catalogLoading = true, error: catalogError = '' } = permissionCatalogs[roleKind] ?? {};
  useEffect(() => {
    dispatch(getPermissionCatalog(roleKind));
  }, [dispatch, roleKind]);
  useEffect(() => {
    return () => { dispatch(clearPermissionCatalog()); };
  }, [dispatch]);
  const [search, setSearch] = useState('');
  const [submittedRoleName, setSubmittedRoleName] = useState('');
  const showClearSearch = Boolean(submittedRoleName) && search.trim() === submittedRoleName;
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const loadRoles = useCallback(() => {
    dispatch(getRoles({
      roleKind,
      roleName: submittedRoleName,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    }));
  }, [dispatch, roleKind, submittedRoleName, paginationModel]);
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);
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
  const [editedPermissions, setPermissionValues] = useState(null);
  const [viewingRole, setViewingRole] = useState(false);
  const [roleDetails, setRoleDetails] = useState(null);
  const [roleDetailsError, setRoleDetailsError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [description, setDescription] = useState('');
  const savingRef = useRef(false);
  const permissionSections = getPermissionSections(permissionCatalog, permissionModule);
  const roleDetailsLoading = Boolean(editingRow && !roleDetails && !roleDetailsError);
  const initialPermissions = useMemo(() => {
    if (editingRow && !roleDetails) return {};
    const selectedIds = roleDetails && new Set(roleDetails.permissions.map(({ permissionId }) => String(permissionId)));
    return createPermissionValues(permissionCatalog, selectedIds);
  }, [permissionCatalog, editingRow, roleDetails]);
  const permissionValues = editedPermissions ?? initialPermissions;
  const showAuthorityRole = roleKind === 'EMPLOYEE';
  const authorityRoleUnavailable = showAuthorityRole && (authorityRolesLoading || Boolean(authorityRolesError));
  const savedAuthority = (roleDetails?.authorityRoles ?? editingRow?.authorityRoles)?.[0];
  const savedAuthorityId = (roleDetails?.parentRoleIds ?? editingRow?.parentRoleIds)?.[0] ?? savedAuthority?.roleId;
  const savedAuthorityName = savedAuthority?.name ?? roleDetails?.authorityRoleName ?? editingRow?.authorityRole;
  const savedAuthorityOption = authorityRoleOptions.find((role) => (
    savedAuthorityId != null && String(role.id) === String(savedAuthorityId)
  )) ?? authorityRoleOptions.find((role) => role.role === savedAuthorityName);
  const authorityOptions = savedAuthorityName && !savedAuthorityOption
    ? [...authorityRoleOptions, { id: savedAuthorityId, role: savedAuthorityName }]
    : authorityRoleOptions;
  const selectedAuthorityRole = roleValues.authorityRole ?? savedAuthorityOption?.role ?? savedAuthorityName ?? '';

  useEffect(() => {
    if (permissionDialogOpen && showAuthorityRole) dispatch(getAuthorityRoleOptions(roleKind));
  }, [dispatch, permissionDialogOpen, roleKind, showAuthorityRole]);

  useEffect(() => {
    if (!permissionDialogOpen || !editingRow) return undefined;
    let active = true;
    const loadRole = async () => {
      try {
        const details = await dispatch(getRoleDetails(editingRow.id)).unwrap();
        if (!active) return;
        setRoleDetails(details);
        setRoleValues({
          role: details.name ?? editingRow.role,
          authorityRole: null,
        });
        setDescription(details.description ?? '');
      } catch (error) {
        if (active) setRoleDetailsError(error?.message || (typeof error === 'string' ? error : 'Unable to load role details.'));
      }
    };
    loadRole();
    return () => { active = false; };
  }, [permissionDialogOpen, editingRow, dispatch]);

  const rows = activeTab === 0 ? employeeRows : customerRows;
  const submitRoleSearch = (event) => {
    event.preventDefault();
    const roleName = search.trim();
    setSubmittedRoleName(roleName);
    setPaginationModel((model) => ({ ...model, page: 0 }));
  };

  const clearRoleSearch = () => {
    setSearch('');
    setSubmittedRoleName('');
    setPaginationModel((model) => ({ ...model, page: 0 }));
  };

  const openNewRole = () => {
    setEditingRow(null);
    setViewingRole(false);
    setRoleDetails(null);
    setRoleDetailsError('');
    setRoleValues({ role: '', authorityRole: '' });
    setDescription('');
    setPermissionModule('AIR Export');
    setPermissionValues(null);
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const openExistingRole = (row, readOnly) => {
    setEditingRow(row);
    setViewingRole(readOnly);
    setRoleDetails(null);
    setRoleDetailsError('');
    setDescription(row.description || '');
    setRoleValues({ role: row.role, authorityRole: null });
    setPermissionModule('AIR Export');
    setPermissionValues(null);
    setFormError('');
    setPermissionDialogOpen(true);
  };

  const saveRolePermissions = async (event) => {
    event.preventDefault();
    if (viewingRole || roleDetailsLoading || roleDetailsError || catalogLoading || catalogError || authorityRoleUnavailable || saving || savingRef.current) return;
    const roleName = roleValues.role.trim();
    if (!roleName) {
      setFormError(roleKind === 'CUSTOMER' && !editingRow ? 'Customer name is required.' : 'Role name is required.');
      return;
    }
    const authorityRole = showAuthorityRole
      ? authorityOptions.find((role) => role.role === selectedAuthorityRole)
      : undefined;
    if (showAuthorityRole && !editingRow && !authorityRole) {
      setFormError('Authority role is required.');
      return;
    }
    if (rows.some((row) => row.role.toLowerCase() === roleName.toLowerCase() && row.id !== editingRow?.id)) {
      setFormError('A role with this name already exists.');
      return;
    }

    const catalogPermissionIds = new Set();
    const selectedCodes = permissionModules.flatMap((module) =>
      Object.entries(permissionCatalog[permissionApplications[module]] || {}).flatMap(([section, permissions]) =>
        permissions.filter(({ permissionId }) => {
          catalogPermissionIds.add(String(permissionId));
          return permissionValues[module]?.[section]?.includes(permissionId);
        }).map(({ permissionCode }) => permissionCode)
      )
    );
    const savedCodesOutsideCatalog = roleDetails?.permissions
      .filter(({ permissionId }) => !catalogPermissionIds.has(String(permissionId)))
      .map(({ permissionCode }) => permissionCode) ?? [];
    const selectedParentIds = authorityRole?.id == null ? [] : [authorityRole.id];
    const savedParentIds = roleDetails?.parentRoleIds ?? editingRow?.parentRoleIds ?? selectedParentIds;
    const authorityChanged = showAuthorityRole && roleValues.authorityRole != null;
    const payload = {
      name: roleName,
      description: description.trim(),
      roleKind,
      status: roleDetails?.status ?? editingRow?.status ?? 'ACTIVE',
      permissionCodes: [...new Set([...selectedCodes, ...savedCodesOutsideCatalog])],
      parentRoleIds: editingRow
        ? (authorityChanged ? selectedParentIds : savedParentIds)
        : (selectedParentIds.length ? selectedParentIds : null),
    };

    savingRef.current = true;
    setFormError('');
    try {
      if (editingRow) {
        await dispatch(updateRole({ roleId: editingRow.id, payload })).unwrap();
        setSuccessMessage('Role edited successfully');
      } else {
        await dispatch(createRole(payload)).unwrap();
      }
    } catch (error) {
      setFormError(error?.message || error?.error || (typeof error === 'string' ? error : 'Unable to save role. Please try again.'));
      return;
    } finally {
      savingRef.current = false;
    }
    setPaginationModel((model) => ({ ...model, page: 0 }));
    setPermissionDialogOpen(false);
    setEditingRow(null);
  };

  const confirmDeleteRole = async () => {
    if (!rowToDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await dispatch(deleteRole(rowToDelete.id)).unwrap();
      setRowToDelete(null);
      setPaginationModel((model) => ({ ...model, page: 0 }));
      setSuccessMessage('Role deleted successfully');
    } catch (error) {
      setDeleteError(error?.message || (typeof error === 'string' ? error : 'Unable to delete role.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
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
    { field: 'authorityRole', headerName: 'Authority Role', minWidth: 175, flex: 1.2, filterable: false },
    {
      field: 'assignedCount',
      headerName: activeTab === 0 ? 'No of Employee' : 'No of Customer',
      width: activeTab === 0 ? 140 : 200,
      align: 'center',
      filterable: false,
      renderCell: ({ row, value }) => value == null || value === '' ? '-' : (
        <Button
          size="small"
          color="inherit"
          onClick={() => setSelectedRow({ ...row, showAssignments: true })}
          sx={{ minWidth: 0, p: 0, fontSize: 'inherit', textDecoration: 'underline', textTransform: 'none' }}
        >
          {value}
        </Button>
      ),
    },
    { field: 'createdAt', headerName: 'Created At', width: 200, filterable: false, valueFormatter: formatRoleTimestamp },
    { field: 'createdByName', headerName: 'Created By', width: 110, filterable: false },
    { field: 'updatedAt', headerName: 'Updated At', width: 200, filterable: false, valueFormatter: formatRoleTimestamp },
    { field: 'updatedByName', headerName: 'Updated By', width: 110, filterable: false },
    {
      field: 'actions',
      headerName: 'Action',
      width: 120,
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0} sx={{ height: '100%', '& .MuiIconButton-root:not(.Mui-disabled)': { color: '#b51f24' }, '& .MuiSvgIcon-root': { fontSize: 20 } }}>
          <Tooltip title="View role">
            <IconButton size="small" aria-label={`View ${row.role}`} onClick={() => openExistingRole(row, true)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit role">
            <span><IconButton size="small" aria-label={`Edit ${row.role}`} disabled={row.isSystemManaged === 'Y'} onClick={() => openExistingRole(row, false)}>
              <SvgIcon>
                <path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M14 7l3 3m-8 5 3.5-.5L21 6a2.1 2.1 0 0 0-3-3l-8.5 8.5L9 15Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </SvgIcon>
            </IconButton></span>
          </Tooltip>
          <Tooltip title="Delete role">
            <span><IconButton size="small" aria-label={`Delete ${row.role}`} disabled={row.isSystemManaged === 'Y'} onClick={() => {
              setDeleteError('');
              setRowToDelete(row);
            }}>
              <DeleteIcon />
            </IconButton></span>
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
          {activeTab === 0 ? 'New Employee Role' : 'New Customer Role'}
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
            setSearch('');
            setSubmittedRoleName('');
            setPaginationModel((model) => ({ ...model, page: 0 }));
          }}
          aria-label="Role category"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, px: 1, textTransform: 'none', fontSize: 12, color: '#777' }, '& .Mui-selected': { color: '#222' }, '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 } }}
        >
          <Tab label={`Employee (${roleCounts.EMPLOYEE ?? employeeRows.length})`} />
          <Tab label={`Customer (${roleCounts.CUSTOMER ?? customerRows.length})`} />
        </Tabs>
        <Stack component="form" onSubmit={submitRoleSearch} direction="row" alignItems="center" justifyContent="flex-end" sx={{ pb: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            aria-label="Search roles"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type={showClearSearch ? 'button' : 'submit'}
                    size="small"
                    aria-label={showClearSearch ? 'Clear role search' : 'Submit role search'}
                    onClick={showClearSearch ? clearRoleSearch : undefined}
                    edge="end"
                  >
                    {showClearSearch ? <CloseIcon sx={{ fontSize: 17 }} /> : <SearchIcon sx={{ fontSize: 17 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 250 }, minWidth: 0, '& .MuiInputBase-root': { height: 36, fontSize: 14 } }}
          />
        </Stack>
      </Stack>

      {rolesError && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Typography role="alert" sx={{ color: 'error.main', fontSize: 14 }}>{rolesError}</Typography>
          <Button size="small" onClick={loadRoles}>Retry</Button>
        </Stack>
      )}

      <Box ref={gridContainerRef} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', minWidth: 0, mt: 2 }}>
        <DataGrid
          loading={rolesLoading}
          rows={rows}
          columns={columns}
          columnVisibilityModel={{ authorityRole: roleKind === 'EMPLOYEE' }}
          rowHeight={rowHeight}
          columnHeaderHeight={46}
          paginationMode="server"
          rowCount={rolePagination[roleKind]?.totalCount ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 25, 50]}
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
            color: 'text.primary',
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
              <span>{viewingRole ? 'View' : editingRow ? 'Edit' : 'New'} {activeTab === 0 ? 'Employee' : 'Customer'} Role</span>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={saving}
                  onClick={() => setPermissionDialogOpen(false)}
                  sx={{ minWidth: 80, py: 0.75, px: 2, color: '#333', borderColor: '#aaa', fontSize: 14, textTransform: 'none' }}
                >
                  {viewingRole ? 'Close' : 'Cancel'}
                </Button>
                {!viewingRole && <Button
                  size="small"
                  type="submit"
                  disabled={saving || roleDetailsLoading || Boolean(roleDetailsError) || catalogLoading || Boolean(catalogError) || authorityRoleUnavailable}
                  variant="contained"
                  sx={{ minWidth: 80, py: 0.75, px: 2, bgcolor: '#b51f24', fontSize: 14, textTransform: 'none', '&:hover': { bgcolor: '#95191d' } }}
                >
                  {saving ? (editingRow ? 'Updating...' : 'Creating...') : editingRow ? 'Submit' : 'Create'}
                </Button>}
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{
            px: 3, pt: '12px !important', pb: 3, flex: 1, minHeight: 0, overflowY: 'auto',
            ...(viewingRole && {
              '& .MuiInputLabel-root, & .MuiInputLabel-root.Mui-disabled, & .MuiFormLabel-root.Mui-disabled, & .MuiTab-root': { color: '#000' },
              '& .MuiFormControlLabel-root .MuiFormControlLabel-label.Mui-disabled': { color: '#000' },
              '& .MuiInputBase-input, & .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' },
            }),
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
              <TextField
                label={roleKind === 'CUSTOMER' && !editingRow ? 'Customer Name' : 'Role Name'}
                disabled={saving || viewingRole || roleDetailsLoading}
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
              {showAuthorityRole && <TextField
                select
                label="Authority Role"
                disabled={saving || viewingRole || roleDetailsLoading || authorityRolesLoading || Boolean(authorityRolesError)}
                error={Boolean(authorityRolesError)}
                helperText={authorityRolesLoading ? 'Loading roles...' : authorityRolesError || (authorityOptions.length === 0 ? 'No authority roles available.' : '')}
                required={!editingRow}
                variant="standard"
                size="small"
                value={selectedAuthorityRole}
                onChange={(event) => {
                  setRoleValues({ ...roleValues, authorityRole: event.target.value });
                  setFormError('');
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiInputBase-input': { fontSize: 16, py: 1 } }}
              >
                {editingRow && !viewingRole && <MenuItem value="">None</MenuItem>}
                {authorityOptions.length === 0 && (!editingRow || viewingRole) && <MenuItem disabled value="">No roles available</MenuItem>}
                {authorityOptions.map((role) => (
                  <MenuItem key={role.id ?? role.role} value={role.role}>{role.role}</MenuItem>
                ))}
              </TextField>}
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
              disabled={saving || viewingRole || roleDetailsLoading}
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
                '& .MuiTab-root': { minHeight: 44, px: 1, py: 0, textTransform: 'none', fontSize: 14, color: viewingRole ? '#000' : '#777' },
                '& .Mui-selected': { color: viewingRole ? '#000' : '#222', fontWeight: 600 },
                '& .MuiTabs-indicator': { bgcolor: '#b51f24', height: 2 },
              }}
            >
              {permissionModules.map((module) => <Tab key={module} value={module} label={module} />)}
            </Tabs>

            {formError && <Typography role="alert" sx={{ mt: 1, color: 'error.main', fontSize: 14 }}>{formError}</Typography>}

            {(catalogLoading || roleDetailsLoading) && <Typography role="status" sx={{ mt: 2, fontSize: 14 }}>Loading permissions...</Typography>}
            {roleDetailsError && <Typography role="alert" sx={{ mt: 2, color: 'error.main', fontSize: 14 }}>{roleDetailsError}</Typography>}
            {catalogError && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                <Typography role="alert" color="error" sx={{ fontSize: 14 }}>{catalogError}</Typography>
                <Button size="small" onClick={() => dispatch(getPermissionCatalog(roleKind))}>Retry</Button>
              </Stack>
            )}
            {!catalogLoading && !catalogError && !roleDetailsLoading && !roleDetailsError && permissionSections.length === 0 && (
              <Typography sx={{ mt: 2, fontSize: 14 }}>No permissions available for this module.</Typography>
            )}

            <Stack spacing={2.5} sx={{ pt: 2.5 }}>
              {!roleDetailsLoading && !roleDetailsError && permissionSections.map((section) => {
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
                                disabled={saving || viewingRole}
                                onChange={(event) => {
                                  const isChecked = event.target.checked;
                                  setPermissionValues((edited) => {
                                    const current = edited ?? initialPermissions;
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
                              disabled={saving || viewingRole}
                              indeterminate={someChecked}
                              onChange={() => {
                                setPermissionValues((edited) => {
                                  const current = edited ?? initialPermissions;
                                  return {
                                    ...current,
                                    [permissionModule]: {
                                      ...current[permissionModule],
                                      [section.id]: allChecked ? [] : section.items.map((item) => item.id),
                                    },
                                  };
                                });
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
        key={successMessage}
        open={Boolean(successMessage)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={5000}
        onClose={(_, reason) => { if (reason !== 'clickaway') setSuccessMessage(''); }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

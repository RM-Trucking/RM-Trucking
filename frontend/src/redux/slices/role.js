import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

const errorMessage = (error) => error?.message || error?.error || (typeof error === 'string' ? error : 'Unable to complete the request.');

export const getRoles = createAsyncThunk('role/getRoles', async (roleKind = 'EMPLOYEE', { rejectWithValue }) => {
  try {
    const { data } = await axios.get('/authorization/roles', { params: { roleKind } });
    const payload = data?.data ?? data;
    const roles = Array.isArray(payload) ? payload : payload?.roles;
    if (data?.success === false || !Array.isArray(roles)) throw new Error(data?.message || 'Unable to load roles.');
    return roles;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const getAuthorityRoleOptions = createAsyncThunk('role/getAuthorityRoleOptions', async (roleKind, { rejectWithValue }) => {
  try {
    const { data } = await axios.get('/authorization/roles/options', { params: { roleKind } });
    const payload = data?.data ?? data;
    const options = Array.isArray(payload) ? payload : payload?.options ?? payload?.roles;
    if (data?.success === false || !Array.isArray(options)) throw new Error(data?.message || 'Unable to load authority roles.');
    return mapRoles(options, roleKind).filter((role) => role.role);
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const getPermissionCatalog = createAsyncThunk('role/getPermissionCatalog', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get('/authorization/permissions/catalog');
    if (data?.success !== true || !data.data || typeof data.data !== 'object') throw new Error('Unable to load the permissions catalog.');
    return data.data;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const createRole = createAsyncThunk('role/createRole', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axios.post('/authorization/roles', payload);
    if (data?.success === false) throw new Error(data.message || 'Unable to create role.');
    return data?.data;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const deleteRole = createAsyncThunk('role/deleteRole', async (roleId, { rejectWithValue }) => {
  try {
    const { data } = await axios.delete(`/authorization/roles/${encodeURIComponent(roleId)}`);
    if (data?.success === false) throw new Error(data.message || 'Unable to delete role.');
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

const mapRoles = (items, roleKind) => items.map((role, index) => ({
  ...role,
  id: role.roleId ?? role.ROLEID ?? role.ROLE_ID ?? role.id ?? role.value,
  role: role.roleName ?? role.ROLENAME ?? role.ROLE_NAME ?? role.name ?? role.NAME ?? role.label ?? '',
  roleKind: String(role.roleKind ?? role.ROLEKIND ?? role.ROLE_KIND ?? roleKind).toUpperCase(),
  serialNumber: String(index + 1).padStart(2, '0'),
  assignedCount: String(role.assignedCount ?? role.employeeCount ?? role.customerCount ?? '?'),
  authorityRole: role.authorityRoleName ?? role.authorityRole ?? '',
}));

const slice = createSlice({
  name: 'role',
  initialState: {
    employeeRows: [], customerRows: [], isLoading: false, error: '',
    authorityRoleOptions: [], authorityRolesLoading: false, authorityRolesError: '',
    permissionCatalog: {}, catalogLoading: false, catalogError: '',
    saving: false, createError: '', createdRole: null,
  },
  reducers: {
    setEmployeeRows(state, action) { state.employeeRows = action.payload; },
    setCustomerRows(state, action) { state.customerRows = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRoles.pending, (state, action) => { state.isLoading = true; state.error = ''; state.requestId = action.meta.requestId; })
      .addCase(getRoles.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.isLoading = false;
        const roleKind = action.meta.arg ?? 'EMPLOYEE';
        const roles = mapRoles(action.payload, roleKind);
        if (roleKind === 'CUSTOMER') {
          state.customerRows = roles;
        } else {
          state.employeeRows = roles;
        }
      })
      .addCase(getRoles.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(getAuthorityRoleOptions.pending, (state, action) => {
        state.authorityRoleOptions = [];
        state.authorityRolesLoading = true;
        state.authorityRolesError = '';
        state.authorityRolesRequestId = action.meta.requestId;
      })
      .addCase(getAuthorityRoleOptions.fulfilled, (state, action) => {
        if (state.authorityRolesRequestId !== action.meta.requestId) return;
        state.authorityRolesLoading = false;
        state.authorityRoleOptions = action.payload;
      })
      .addCase(getAuthorityRoleOptions.rejected, (state, action) => {
        if (state.authorityRolesRequestId !== action.meta.requestId) return;
        state.authorityRolesLoading = false;
        state.authorityRolesError = action.payload || action.error.message;
      })
      .addCase(getPermissionCatalog.pending, (state, action) => {
        state.catalogLoading = true;
        state.catalogError = '';
        state.permissionCatalog = {};
        state.catalogRequestId = action.meta.requestId;
      })
      .addCase(getPermissionCatalog.fulfilled, (state, action) => {
        if (state.catalogRequestId !== action.meta.requestId) return;
        state.catalogLoading = false;
        state.permissionCatalog = action.payload;
      })
      .addCase(getPermissionCatalog.rejected, (state, action) => {
        if (state.catalogRequestId !== action.meta.requestId) return;
        state.catalogLoading = false;
        state.catalogError = action.payload || action.error.message;
      })
      .addCase(deleteRole.fulfilled, (state, { meta: { arg: roleId } }) => {
        state.employeeRows = state.employeeRows.filter((role) => role.id !== roleId);
        state.customerRows = state.customerRows.filter((role) => role.id !== roleId);
      })
      .addCase(createRole.pending, (state) => {
        state.saving = true;
        state.createError = '';
        state.createdRole = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.saving = false;
        state.createdRole = action.payload ?? null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.saving = false;
        state.createError = action.payload || action.error.message;
      });
  },
});

export const { setEmployeeRows, setCustomerRows } = slice.actions;
export default slice.reducer;

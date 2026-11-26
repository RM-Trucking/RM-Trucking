import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

const errorMessage = (error) => error?.message || error?.error || (typeof error === 'string' ? error : 'Unable to complete the request.');

export const getRoles = createAsyncThunk('role/getRoles', async ({ roleKind = 'EMPLOYEE', roleName, page, pageSize } = {}, { rejectWithValue }) => {
  try {
    const { data } = await axios.get('/authorization/roles', { params: { roleKind, roleName: roleName || undefined, page, pageSize } });
    const payload = data?.data ?? data;
    const roles = Array.isArray(payload) ? payload : payload?.roles;
    if (data?.success === false || !Array.isArray(roles)) throw new Error(data?.message || 'Unable to load roles.');
    return { roles, pagination: data?.pagination ?? payload?.pagination, roleCounts: data?.roleCounts ?? payload?.roleCounts };
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

export const getRoleDetails = createAsyncThunk('role/getRoleDetails', async (roleId, { rejectWithValue }) => {
  try {
    const { data } = await axios.get(`/authorization/roles/${encodeURIComponent(roleId)}`);
    if (data?.success === false || !Array.isArray(data?.data?.permissions)) {
      throw new Error(data?.message || 'Unable to load role details.');
    }
    return data.data;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const getPermissionCatalog = createAsyncThunk('role/getPermissionCatalog', async (roleKind, { rejectWithValue }) => {
  try {
    const { data } = await axios.get('/authorization/permissions/catalog', { params: { roleKind } });
    if (data?.success !== true || !data.data || typeof data.data !== 'object') throw new Error('Unable to load the permissions catalog.');
    return data.data;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
}, {
  condition: (roleKind, { getState }) => !getState().roledata.permissionCatalogs[roleKind]?.requestId,
});

export const createRole = createAsyncThunk('role/createRole', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axios.post('/authorization/roles', payload);
    if (data?.success === false) throw new Error(data.message || 'Unable to create role.');
    return data?.data;
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const updateRole = createAsyncThunk('role/updateRole', async ({ roleId, payload }, { rejectWithValue }) => {
  try {
    const { data } = await axios.put(`/authorization/roles/${encodeURIComponent(roleId)}`, payload);
    if (data?.success === false) throw new Error(data.message || 'Unable to update role.');
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const deleteRole = createAsyncThunk('role/deleteRole', async (roleId, { rejectWithValue }) => {
  try {
    const { data } = await axios.delete(`/authorization/roles/${encodeURIComponent(roleId)}`);
    if (data?.success === false) throw new Error(data.message || 'Unable to delete role.');
  } catch (error) { return rejectWithValue(errorMessage(error)); }
});

const mapRoles = (items, roleKind) => items.map((role) => ({
  ...role,
  id: role.roleId ?? role.ROLEID ?? role.ROLE_ID ?? role.id ?? role.value,
  role: role.roleName ?? role.ROLENAME ?? role.ROLE_NAME ?? role.name ?? role.NAME ?? role.label ?? '',
  roleKind: String(role.roleKind ?? role.ROLEKIND ?? role.ROLE_KIND ?? roleKind).toUpperCase(),
  assignedCount: String(role.assignedCount ?? role.employeeCount ?? role.customerCount ?? '').trim(),
  authorityRole: Array.isArray(role.authorityRoles)
    ? role.authorityRoles.map((authorityRole) => authorityRole.name).filter(Boolean).join(', ')
    : role.authorityRoleName ?? role.authorityRole ?? '',
}));

const slice = createSlice({
  name: 'role',
  initialState: {
    employeeRows: [], customerRows: [], isLoading: false, error: '',
    roleCounts: {}, rolePagination: {},
    authorityRolesByKind: {},
    permissionCatalogs: {},
    saving: false, createError: '', createdRole: null,
  },
  reducers: {
    clearPermissionCatalog(state) {
      state.permissionCatalogs = {};
    },
    setEmployeeRows(state, action) { state.employeeRows = action.payload; },
    setCustomerRows(state, action) { state.customerRows = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRoles.pending, (state, action) => { state.isLoading = true; state.error = ''; state.requestId = action.meta.requestId; })
      .addCase(getRoles.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.isLoading = false;
        const roleKind = action.meta.arg?.roleKind ?? 'EMPLOYEE';
        const { roles: items, pagination, roleCounts } = action.payload;
        const roles = mapRoles(items, roleKind);
        state.rolePagination[roleKind] = pagination ?? { totalCount: items.length };
        if (roleCounts) Object.assign(state.roleCounts, roleCounts);
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
        state.authorityRolesByKind[action.meta.arg] = {
          options: [], loading: true, error: '', requestId: action.meta.requestId,
        };
      })
      .addCase(getAuthorityRoleOptions.fulfilled, (state, action) => {
        const entry = state.authorityRolesByKind[action.meta.arg];
        if (entry?.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.options = action.payload;
      })
      .addCase(getAuthorityRoleOptions.rejected, (state, action) => {
        const entry = state.authorityRolesByKind[action.meta.arg];
        if (entry?.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.error = action.payload || action.error.message;
      })
      .addCase(getPermissionCatalog.pending, (state, action) => {
        state.permissionCatalogs[action.meta.arg] = { loading: true, requestId: action.meta.requestId };
      })
      .addCase(getPermissionCatalog.fulfilled, (state, action) => {
        const catalog = state.permissionCatalogs[action.meta.arg];
        if (catalog?.requestId !== action.meta.requestId) return;
        catalog.loading = false;
        catalog.data = action.payload;
      })
      .addCase(getPermissionCatalog.rejected, (state, action) => {
        const catalog = state.permissionCatalogs[action.meta.arg];
        if (catalog?.requestId !== action.meta.requestId) return;
        catalog.loading = false;
        catalog.error = action.payload || action.error.message;
        catalog.requestId = null;
      })
      .addCase(deleteRole.fulfilled, (state, { meta: { arg: roleId } }) => {
        state.employeeRows = state.employeeRows.filter((role) => role.id !== roleId);
        state.customerRows = state.customerRows.filter((role) => role.id !== roleId);
      })
      .addCase(updateRole.pending, (state) => { state.saving = true; })
      .addCase(updateRole.fulfilled, (state) => { state.saving = false; })
      .addCase(updateRole.rejected, (state) => { state.saving = false; })
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

export const { clearPermissionCatalog, setEmployeeRows, setCustomerRows } = slice.actions;
const emptyAuthorityRoles = { options: [], loading: false, error: '' };
export const selectAuthorityRoles = (state, roleKind) => state.roledata.authorityRolesByKind[roleKind] ?? emptyAuthorityRoles;
export default slice.reducer;

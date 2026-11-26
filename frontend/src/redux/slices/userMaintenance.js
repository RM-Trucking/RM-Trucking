import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export const getUsers = createAsyncThunk(
  'userMaintenance/getUsers',
  async ({ userType, page, pageSize, search, activeStatus }, { signal }) => {
    const { data } = await axios.get('/authorization/users', {
      params: { userType, page, pageSize, search, activeStatus },
      signal,
    });
    if (data?.success === false || !Array.isArray(data?.data) || !Number.isSafeInteger(data?.pagination?.totalCount)) {
      throw new Error(data?.message || 'Unable to load users.');
    }
    return {
      totalCount: data.pagination.totalCount,
      rows: data.data.map((user, index) => ({
        id: user.userId,
        serialNumber: String((page - 1) * pageSize + index + 1).padStart(2, '0'),
        name: user.userName,
        loginName: user.loginUserName,
        email: user.email,
        companyName: user.companyName ?? '',
        stationList: user.stations?.map(({ stationName }) => stationName) ?? [],
        role: user.roles?.map(({ name }) => name).join(', ') ?? '',
        createdDate: user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
        createdBy: user.createdBy == null ? '' : String(user.createdBy),
        status: user.activeStatus === 'Y' ? 'Active' : 'Inactive',
      })),
    };
  },
);

export const createUser = (user) => async () => {
  try {
    const { data } = await axios.post('/authorization/users', user);
    if (data?.success === false) throw new Error(data.message || 'Unable to create user.');
    return data.data;
  } catch (error) {
    throw new Error(error?.message || error?.error || (typeof error === 'string' ? error : 'Unable to create user.'));
  }
};

export const getCustomerOptions = createAsyncThunk(
  'userMaintenance/getCustomerOptions',
  async () => {
    const { data } = await axios.get('/maintenance/customer/customer-dropdown');
    if (data?.success === false || !Array.isArray(data?.data)) {
      throw new Error(data?.message || 'Unable to load customers.');
    }
    return data.data;
  },
  { condition: (_, { getState }) => !getState().userMaintenance.customerOptionsLoading },
);

export const getStationOptions = createAsyncThunk(
  'userMaintenance/getStationOptions',
  async (customerId) => {
    const { data } = await axios.get('/maintenance/customer/station-dropdown', { params: { customerId } });
    if (data?.success === false || !Array.isArray(data?.data)) {
      throw new Error(data?.message || 'Unable to load stations.');
    }
    return data.data;
  },
);

const emptyUserPage = { rows: [], totalCount: 0, loading: false, error: '' };

const slice = createSlice({
  name: 'userMaintenance',
  initialState: {
    usersByType: {},
    customerOptions: [], customerOptionsLoading: false, customerOptionsError: '',
    stationOptions: [], stationOptionsLoading: false, stationOptionsError: '',
  },
  reducers: {
    updateUserRow(state, { payload: { userType, changes } }) {
      const row = state.usersByType[userType]?.rows.find(({ id }) => id === changes.id);
      if (row) Object.assign(row, changes);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state, { meta }) => {
        const { userType } = meta.arg;
        state.usersByType[userType] = {
          ...emptyUserPage,
          totalCount: state.usersByType[userType]?.totalCount ?? 0,
          requestId: meta.requestId,
          loading: true,
        };
      })
      .addCase(getUsers.fulfilled, (state, { meta, payload }) => {
        const page = state.usersByType[meta.arg.userType];
        if (page?.requestId !== meta.requestId) return;
        Object.assign(page, payload, { loading: false });
      })
      .addCase(getUsers.rejected, (state, { meta, error }) => {
        const page = state.usersByType[meta.arg.userType];
        if (page?.requestId !== meta.requestId) return;
        page.loading = false;
        if (!meta.aborted) page.error = error.message || 'Unable to load users.';
      })
      .addCase(getCustomerOptions.pending, (state) => {
        state.customerOptions = [];
        state.customerOptionsLoading = true;
        state.customerOptionsError = '';
      })
      .addCase(getCustomerOptions.fulfilled, (state, { payload }) => {
        state.customerOptions = payload;
        state.customerOptionsLoading = false;
      })
      .addCase(getCustomerOptions.rejected, (state, { error }) => {
        state.customerOptionsLoading = false;
        state.customerOptionsError = error.message || 'Unable to load customers.';
      })
      .addCase(getStationOptions.pending, (state, { meta }) => {
        state.stationOptionsRequestId = meta.requestId;
        state.stationOptions = [];
        state.stationOptionsLoading = true;
        state.stationOptionsError = '';
      })
      .addCase(getStationOptions.fulfilled, (state, { meta, payload }) => {
        if (state.stationOptionsRequestId !== meta.requestId) return;
        state.stationOptions = payload;
        state.stationOptionsLoading = false;
      })
      .addCase(getStationOptions.rejected, (state, { meta, error }) => {
        if (state.stationOptionsRequestId !== meta.requestId) return;
        state.stationOptionsLoading = false;
        state.stationOptionsError = error.message || 'Unable to load stations.';
      });
  },
});

export const { updateUserRow } = slice.actions;
export const selectUserPage = (state, userType) => state.userMaintenance.usersByType[userType] ?? emptyUserPage;
export default slice.reducer;

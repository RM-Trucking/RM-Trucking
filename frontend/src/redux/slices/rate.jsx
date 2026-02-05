import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    rateSuccess: false,
    rateTableData: [],
    rateSearchObj: {},
    selectedCurrentRateRow: {},
    currentRateTab: 'warehouse',
    rateFieldChargeData: [],
    rateFieldChargeDataWarehouse: [],
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
    operationalMessage: '',
};

const slice = createSlice({
    name: 'rate',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.rateSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        getRateDashboarddataSuccess(state, action) {
            state.isLoading = false;
            state.rateSuccess = true;
            state.rateTableData = action.payload.rates;
            state.pagination.page = action.payload.page;
            state.pagination.pageSize = action.payload.pageSize;
            state.pagination.totalRecords = action.payload.total;
        },
        postRateDashboarddataSuccess(state, action) {
            state.isLoading = false;
            state.rateSuccess = true;
            state.operationalMessage = "Rate added successfully";
            // update table data by adding new record at the start
            state.rateTableData.unshift(action.payload.data);
            state.pagination.totalRecords = action.payload.total + 1 || state.pagination.totalRecords + 1;
        },
        putRateDashboarddataSuccess(state, action) {
            state.isLoading = false;
            state.rateSuccess = true;
            state.operationalMessage = "Rate updated successfully";
            // update table data by updating record
            const index = state.rateTableData.findIndex((row) => row.rateId === action.payload?.data?.rateId);
            if (index === 0 || index > 0) {
                state.rateTableData.splice(index, 1, action.payload.data);
            }
        },
        deleteRateDashboarddataSuccess(state, action) {
            state.isLoading = false;
            state.rateSuccess = true;
            state.operationalMessage = "Rate deleted successfully";
        },
        getRateChargeDataSuccess(state, action) {
            state.isLoading = false;
            state.rateFieldChargeData = [];
        },
        setRateSearchObj(state, action) {
            state.rateSearchObj = action.payload;
        },
        setCurrentRateTab(state, action) {
            state.currentRateTab = action.payload;
        },
        setSelectedCurrentRateRow(state, action) {
            state.selectedCurrentRateRow = action.payload;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setWarehouseRatesFieldChargeData(state, action) {
            state.rateFieldChargeDataWarehouse = action.payload;
        },
    },
});

export const {
    setWarehouseRatesFieldChargeData,
    setOperationalMessage,
    setRateSearchObj,
    setCurrentRateTab,
    setSelectedCurrentRateRow,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getRateDashboardData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer-rate/warehouse-rate?${searchStr ? `search=${searchStr}&` : ''}&page=${pageNo}&pageSize=${pageSize}`);
            dispatch(slice.actions.getRateDashboarddataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function postWarehouseRate(obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`maintenance/customer-rate/warehouse-rate`, obj);
            dispatch(slice.actions.postRateDashboarddataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function putWarehouseRate(id, obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.put(`maintenance/customer-rate/warehouse-rate/${id}`, obj);
            dispatch(slice.actions.putRateDashboarddataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function deleteWarehouseRate(id) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.delete(`maintenance/customer-rate/warehouse-rate/${id}`);
            dispatch(slice.actions.deleteRateDashboarddataSuccess({
                id, message: response.data
            }));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getRateChargeData() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            //   const response = await axios.get('/ratechargedata');
            dispatch(slice.actions.getRateChargeDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
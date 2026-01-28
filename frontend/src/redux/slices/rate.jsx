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
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
    operationalMessage: '',
};

const slice = createSlice({
    name: 'rate',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = 'error';
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.rateSuccess = false;
            state.error = null;
        },
        getRateDashboarddataSuccess(state, action) {
            state.isLoading = false;
            state.rateSuccess = true;
            state.rateTableData = action.payload.rates;
            state.pagination.page = action.payload.page;
            state.pagination.pageSize = action.payload.pageSize;
            state.pagination.totalRecords = action.payload.total;

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

    },
});

export const {
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
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
    currentRateTab: 'transportation',
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
            state.rateTableData = [
                {
                    id: 1,
                    rateID: "RID10001",
                    origin: "ORD",
                    originZipCode: "10001, 10002",
                    destination: "Los Angeles",
                    destinationZipCode: "90001, 90002",
                    status: "Active",
                    min: '140.00',
                    rate100: '.29 per lb',
                    rate1000: '.24 per lb',
                    rate3000: '.21 per lb',
                    rate5000: '.19 per lb',
                    rate10000: '.17 per lb',
                    max: '1755.00',
                    expiryDate: "01-30-2026"
                },
                {
                    id: 2,
                    rateID: "RID10003",
                    origin: "ORD",
                    originZipCode: "10001, 10002",
                    destination: "Los Angeles",
                    destinationZipCode: "90001, 90002",
                    status: "Active",
                    min: '140.00',
                    rate100: '.29 per lb',
                    rate1000: '.24 per lb',
                    rate3000: '.21 per lb',
                    rate5000: '.19 per lb',
                    rate10000: '.17 per lb',
                    max: '1755.00',
                    expiryDate: "01-30-2026"
                },
                {
                    id: 3,
                    rateID: "RID10004",
                    origin: "ORD",
                    originZipCode: "10001, 10002",
                    destination: "Los Angeles",
                    destinationZipCode: "90001, 90002",
                    status: "Active",
                    min: '140.00',
                    rate100: '.29 per lb',
                    rate1000: '.24 per lb',
                    rate3000: '.21 per lb',
                    rate5000: '.19 per lb',
                    rate10000: '.17 per lb',
                    max: '1755.00',
                    expiryDate: "01-30-2026"
                },                
            ];
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
export function getRateDashboardData() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            //   const response = await axios.get('/ratedashboarddata');
            dispatch(slice.actions.getRateDashboarddataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
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
                    '100': '.29 per lb',
                    '1000': '.24 per lb',
                    '3000': '.21 per lb',
                    '5000': '.19 per lb',
                    '10000': '.17 per lb',
                    max: '1755.00',
                    effectiveDate: "01-30-2024",
                    expiryDate: "01-30-2026"
                }
            ];
        },
        setRateSearchObj(state, action) {
            state.rateSearchObj = action.payload;
        },

    },
});

export const {
    setRateSearchObj,
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
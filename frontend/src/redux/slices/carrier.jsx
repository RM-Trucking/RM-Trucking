import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    carrierSuccess: false,
    carrierData: [],
    carrierSearchStr: '',
    operationalMessage: '',
    selectedCarrierRowDetails: {},
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
};

const slice = createSlice({
    name: 'carrier',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.carrierSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },
        setCarrierSearchStr(state, action) {
            state.carrierSearchStr = action.payload;
        },
        // zone row details
        setSelectedCarrierRowDetails(state, action) {
            state.selectedCarrierRowDetails = action.payload;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },

    },
});

export const {
    setOperationalMessage,
    setPaginationObject,
    setCarrierSearchStr,
    setSelectedCarrierRowDetails,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------



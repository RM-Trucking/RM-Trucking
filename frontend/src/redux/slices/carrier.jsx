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
    currentCarrierTab : 'active',
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
        // carrier row details
        setSelectedCarrierRowDetails(state, action) {
            state.selectedCarrierRowDetails = action.payload;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setCurrentCarrierTab(state, action){
            state.currentCarrierTab = action.payload;
        },
        getCarrierDataSuccess(state,action){
            state.isLoading = false;
            state.carrierSuccess = true;
            state.carrierData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page || state.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize || state.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total || state.pagination?.totalRecords || state.carrierData.length,
            };
        }

    },
});

export const {
    setOperationalMessage,
    setPaginationObject,
    setCarrierSearchStr,
    setSelectedCarrierRowDetails,
    setCurrentCarrierTab,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getCarrierData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getCarrierDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}


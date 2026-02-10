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
    currentCarrierTab: 'active',
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
        setCurrentCarrierTab(state, action) {
            state.currentCarrierTab = action.payload;
        },
        getCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            // state.carrierData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page || state.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize || state.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total || state.pagination?.totalRecords || state.carrierData.length,
            };
            if (state.currentCarrierTab === 'active') {
                state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'Y',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'Y',
                        notes: 'notes'
                    }
                ];
            }
            if (state.currentCarrierTab === 'inactive') {
                  state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    }
                ];
            }
            if (state.currentCarrierTab === 'incomplete') {
                state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    }
                ];
            }
        },
        deleteCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.operationalMessage = `Carrier deleted successfully.`;
        },

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
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            // dispatch(slice.actions.getCarrierDataSuccess(response.data));
            dispatch(slice.actions.getCarrierDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function deleteCarrier(id, callback) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.delete(`maintenance/carrier/${id}`);
            dispatch(slice.actions.deleteCarrierDataSuccess({
                id, message: response.data
            }));
            callback();
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}

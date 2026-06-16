import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    fuelSuccess: false,
    fuelSurchargeData: [],
    fuelSurchargeSearchStr: '',
    operationalMessage: '',
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
    currentFuelSurchargeTab: 'active',
    selectedFuelSurchargeRowDetails: {},
    customerList: [],
    stationList: [],
};

const slice = createSlice({
    name: 'fuel',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.operationalMessage = '';
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.fuelSuccess = false;
            state.error = null;
        },
        // set search string
        setFuelSurchargeSearchStr(state, action) {
            state.fuelSurchargeSearchStr = action.payload;
        },
        // set current tab on fuel
        setCurrentFuelSurchargeTab(state, action) {
            state.currentFuelSurchargeTab = action.payload;
        },
        // set table row details
        setSelectedFuelSurchargeRowDetails(state, action) {
            state.selectedFuelSurchargeRowDetails = action.payload;
        },
        // get call
        getFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.fuelSurchargeData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total,
            };
        },
        getCustomerFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.fuelSurchargeData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total,
            };
        },
        postFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = `Fuel surcharge created successfully.`;
            state.fuelSurchargeData.unshift(action.payload.data);
            state.pagination.totalRecords = action.payload?.total + 1 || state.pagination.totalRecords + 1;
        },
        postCustomerFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = `Customer fuel surcharge created successfully.`;
            state.fuelSurchargeData.unshift(action.payload.data);
            state.pagination.totalRecords = action.payload?.total + 1 || state.pagination.totalRecords + 1;
        },
        putFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = "Fuel surcharge updated successfully";
            // update table data by updating record
            const index = state.fuelSurchargeData.findIndex((row) => row.fuelSurchargeId === action.payload?.data?.fuelSurchargeId);
            if (index === 0 || index > 0) {
                state.fuelSurchargeData.splice(index, 1, action.payload.data);
            }
        },
        putCustomerFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = "Customer fuel surcharge updated successfully";
            // update table data by updating record
            const index = state.fuelSurchargeData.findIndex((row) => row.customerFuelSurchargeId === action.payload?.data?.customerFuelSurchargeId);
            if (index === 0 || index > 0) {
                state.fuelSurchargeData.splice(index, 1, action.payload.data);
            }
        },
        deleteFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = `Fuel surcharge deleted successfully.`;
        },
        deleteCustomerFuelSurchargeDataSuccess(state, action) {
            state.isLoading = false;
            state.fuelSuccess = true;
            state.operationalMessage = `Customer fuel surcharge deleted successfully.`;
        },
        getCustomerListSuccess(state, action) {
            state.isLoading = false;
            state.customerList = action.payload.data || [];
        },
        getStationListSuccess(state, action) {
            state.isLoading = false;
            state.stationList = action.payload.data || [];
        },
        setStationList(state,action){
            state.stationList = action.payload;
        },
        clearFuelSurchargeData(state) {
            state.fuelSurchargeData = [];
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setError(state) {
            state.error = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },

    },
});

export const {
    setFuelSurchargeSearchStr,
    clearFuelSurchargeData,
    setCurrentFuelSurchargeTab,
    setSelectedFuelSurchargeRowDetails,
    setOperationalMessage,
    setError,
    setPaginationObject,
    setStationList,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------

export function getFuelSurchargeData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/general-fuel-surcharge?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function postFuelSurchargeData(obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`maintenance/general-fuel-surcharge`, obj);
            dispatch(slice.actions.postFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}
export function putFuelSurchargeData(id, obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.put(`maintenance/general-fuel-surcharge/${id}`, obj);
            dispatch(slice.actions.putFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}
export function deleteFuelSurcharge(id) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.delete(`maintenance/general-fuel-surcharge/${id}`);
            dispatch(slice.actions.deleteFuelSurchargeDataSuccess({
                id, message: response.data
            }));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}

// customer fuel surcharge related api calls

export function getCustomerFuelSurchargeData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer-fuel-surcharge?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getCustomerFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function postCustomerFuelSurchargeData(obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`maintenance/customer-fuel-surcharge`, obj);
            dispatch(slice.actions.postCustomerFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}
export function putCustomerFuelSurchargeData(id, obj) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.put(`maintenance/customer-fuel-surcharge/${id}`, obj);
            dispatch(slice.actions.putCustomerFuelSurchargeDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}
export function deleteCustomerFuelSurcharge(id) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.delete(`maintenance/customer-fuel-surcharge/${id}`);
            dispatch(slice.actions.deleteCustomerFuelSurchargeDataSuccess({
                id, message: response.data
            }));
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}

export function getCustomerList(searchStr) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer/customer-dropdown?${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getCustomerListSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getStationList(customerId, searchStr) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer/station-dropdown?customerId=${customerId}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getStationListSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

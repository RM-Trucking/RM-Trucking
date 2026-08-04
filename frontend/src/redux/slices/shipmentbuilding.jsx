import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    shipmentBuildSuccess: false,
    shipmentData: [],
    customerStationDropdown: [],
    carrierTerminalDropdown: [],
    shipmentBuildSearchStr: '',
    shipmentBuildPagination: { page: 1, pageSize: 10, totalRecords: 0 },
    shipmentViewData: [],
    operationalMessage: '',
    selectedShipmentBuildObj : {},
};

const slice = createSlice({
    name: 'shipmentbuilding',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
            state.shipmentViewData = [];
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.shipmentBuildSuccess = false;
            state.error = null;
        },

        getCustomerStationDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentBuildSuccess = true;
            state.customerStationDropdown = action.payload.data.data;
        },
        searchCustomerStationDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentBuildSuccess = true;
            state.customerStationDropdown = action.payload.data.data;
        },
        getCarrierTerminalDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentBuildSuccess = true;
            state.carrierTerminalDropdown = action.payload.data.data;
        },
        setError(state) {
            state.error = '';
        },
        setOperationalMessage(state, action) {
            state.operationalMessage = action.payload;
        },
        setShipmentBuildSearchStr(state, action) {
            state.shipmentBuildSearchStr = action.payload;
        },
        setShipmentBuildPaginationObject(state, action) {
            state.shipmentBuildPagination = action.payload;
        },
        getShipmentBuildDataSuccess(state, action) {
            state.isLoading = false;
            state.shipmentBuildSuccess = true;
            state.shipmentViewData = action.payload.data;
            state.shipmentBuildPagination.page = action.payload.pagination.page;
            state.shipmentBuildPagination.pageSize = action.payload.pagination.limit;
            state.shipmentBuildPagination.totalRecords = action.payload.pagination.totalItems;
        },
        setSelectedShipmentBuildObj(state,action){
            state.selectedShipmentBuildObj = action.payload;
        },

    },
});

export const {
    setError,
    setShipmentBuildSearchStr,
    setShipmentBuildPaginationObject,
    setOperationalMessage,
    setSelectedShipmentBuildObj,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------

export function getShipmentBuildData({ pageNo, pageSize }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`network-shipment?page=${pageNo}&limit=${pageSize}`);
            dispatch(slice.actions.getShipmentBuildDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getCustomerStationDropdown() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get('maintenance/customer/dropdown');
            dispatch(slice.actions.getCustomerStationDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function searchCustomerStationDropdown(searchValue) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer/dropdown?search=${searchValue}`);
            dispatch(slice.actions.searchCustomerStationDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getCarrierTerminalDropdown(searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier/dropdown${searchTerm ? `?search=${searchTerm}` : ''}`);
            dispatch(slice.actions.getCarrierTerminalDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

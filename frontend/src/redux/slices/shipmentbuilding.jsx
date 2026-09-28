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
    selectedShipmentBuildObj: {},
    carrierList: [
        {
            carrierId: 1,
            carrierName: 'Carrier 1',
        },
        {
            carrierId: 2,
            carrierName: 'Carrier 2',
        }
    ],
    selectedShipments: [],
    selectedDelRowObj: {},
    selectedDelName: {},
    addToQueueData: [
        {
            id: 1,
            shipmentPro: 'PRO9289280209',
            isLocked: true,
            customer: 'Oliver',
            origin: 'Brooklyn, New York',
            destination: 'Austin, Texas',
            serviceLevel: 'Level 1',
            totalWt: 500,
            hazmat: 'Yes',
            pickupAgent: 'Cal Sierra',
            linehaulCarrier: 'Cal Sierra',
            deliveryAgent: 'Cal Sierra',
            user: 'Ross',
        },
        {
            id: 2,
            shipmentPro: 'PRO9289280209',
            isLocked: false,
            customer: 'Oliver',
            origin: 'Austin, Texas',
            destination: 'Seattle, Washington',
            serviceLevel: 'Level 2',
            totalWt: 2000,
            hazmat: 'No',
            pickupAgent: 'First Mile',
            linehaulCarrier: 'First Mile',
            deliveryAgent: 'First Mile',
            user: 'Wills',
        },
        {
            id: 3,
            shipmentPro: 'PRO9289280209',
            isLocked: true,
            customer: 'Liam',
            origin: 'Seattle, Washington',
            destination: 'Miami, Florida',
            serviceLevel: 'Level 3',
            totalWt: 4000,
            hazmat: 'Yes',
            pickupAgent: 'Cal Sierra',
            linehaulCarrier: 'Cal Sierra',
            deliveryAgent: 'Cal Sierra',
            user: 'Daniel',
        },
        {
            id: 4,
            shipmentPro: 'PRO9289280209',
            isLocked: true,
            customer: 'Liam',
            origin: 'Miami, Florida',
            destination: 'Miami, Florida',
            serviceLevel: 'Level 4',
            totalWt: 6000,
            hazmat: 'No',
            pickupAgent: 'First Mile',
            linehaulCarrier: 'First Mile',
            deliveryAgent: 'First Mile',
            user: 'Mike',
        },
    ],
    addToQueueSuccess: false,
    addToQueueError: null,
    addToQueueLoading: false,
    addToQueuePagination: { page: 1, pageSize: 10, totalRecords: 0 },
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
        setSelectedShipmentBuildObj(state, action) {
            state.selectedShipmentBuildObj = action.payload;
        },
        setSelectedShipments(state, action) {
            state.selectedShipments = action.payload;
        },
        setSelectedDelRowObj(state, action) {
            state.selectedDelRowObj = action.payload;
        },
        setSelectedDelName(state, action) {
            state.selectedDelName = action.payload;
        }
    },
});

export const {
    setError,
    setShipmentBuildSearchStr,
    setShipmentBuildPaginationObject,
    setOperationalMessage,
    setSelectedShipmentBuildObj,
    setSelectedShipments,
    setSelectedDelRowObj,
    setSelectedDelName,
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

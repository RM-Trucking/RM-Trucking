import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  shipmentSuccess: false,
  shipmentData: [],
  customerStationDropdown: [],
  carrierTerminalDropdown: [],
  shipperDropdown: [],
  consigneeDropdown: [],
};

const slice = createSlice({
  name: 'shipment',
  initialState,
  reducers: {
    hasError(state, action) {
      state.isLoading = false;
      state.error = 'error';
    },
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
      state.shipmentSuccess = false;
      state.error = null;
    },

    postStep1Success(state, action) {
      state.isLoading = false;
      state.shipmentSuccess = true;
    },
    getCustomerStationDropdownSuccess(state, action) {
      state.isLoading = false;
      state.customerStationDropdown = action.payload.data.data;
    },
    searchCustomerStationDropdownSuccess(state, action) {
      state.isLoading = false;
      state.customerStationDropdown = action.payload.data.data;
    },
    getCarrierTerminalDropdownSuccess(state, action) {
      state.isLoading = false;
      state.carrierTerminalDropdown = [{
        id: '1',
        terminalId: '1',
        terminalName: 'Terminal 1',
        carrierId: '1',
        carrierName: 'Carrier 1',
        addressLine1: 'Address Line 1 - 1',
        addressLine2: 'Address Line 2 - 1',
        city: 'City - 1',
        state: 'State - 1',
        zip: '99999',
      }, {
        id: '2',
        terminalId: '2',
        terminalName: 'Terminal 2',
        carrierId: '2',
        carrierName: 'Carrier 2',
        addressLine1: 'Address Line 1 - 2',
        addressLine2: 'Address Line 2 - 2',
        city: 'City - 2',
        state: 'State - 2',
        zip: '99999',
      }];
    },
    getShipperDropdownSuccess(state, action) {
      state.isLoading = false;
      state.shipperDropdown = [
        { shipperId: null, shipperName: 'Shipper 1', airlineId: null, airlineName: 'Airline 1', airlineNumber: '678', airlineCode: 'AA', addressLine1: 'Address Line 1 - 1', addressLine2: 'Address Line 2 - 1', city: 'City - 1', state: 'State - 1', zip: '99999' },
        { shipperId: null, shipperName: 'Shipper 2', airlineId: null, airlineName: 'Airline 2', airlineNumber: '724', airlineCode: 'BA', addressLine1: 'Address Line 1 - 2', addressLine2: 'Address Line 2 - 2', city: 'City - 2', state: 'State - 2', zip: '99999' },
        { shipperId: null, shipperName: 'Shipper 3', airlineId: null, airlineName: 'Airline 3', airlineNumber: '558', airlineCode: 'CA', addressLine1: 'Address Line 1 - 3', addressLine2: 'Address Line 2 - 3', city: 'City - 3', state: 'State - 3', zip: '99999' },
      ];
    },

    setCustomerStationDropdown(state, action) {
      state.customerStationDropdown = action.payload;
    },
    setCarrierTerminalDropdown(state, action) {
      state.carrierTerminalDropdown = action.payload;
    },
    getConsigneeDropdownSuccess(state, action) {
      state.isLoading = false;
      state.consigneeDropdown = [
        { consigneeId: null, consigneeName: 'Consignee 1', airlineId: null, airlineName: 'Airline 1', airlineNumber: '678', airlineCode: 'AA', addressLine1: 'Address Line 1 - 1', addressLine2: 'Address Line 2 - 1', city: 'City - 1', state: 'State - 1', zip: '99999' },
        { consigneeId: null, consigneeName: 'Consignee 2', airlineId: null, airlineName: 'Airline 2', airlineNumber: '724', airlineCode: 'BA', addressLine1: 'Address Line 1 - 2', addressLine2: 'Address Line 2 - 2', city: 'City - 2', state: 'State - 2', zip: '99999' },
        { consigneeId: null, consigneeName: 'Consignee 3', airlineId: null, airlineName: 'Airline 3', airlineNumber: '558', airlineCode: 'CA', addressLine1: 'Address Line 1 - 3', addressLine2: 'Address Line 2 - 3', city: 'City - 3', state: 'State - 3', zip: '99999' },
      ];
    },
  },
});

export const {
  setDashboardSearchStr,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function postStep1(obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post('network-shipment', obj);
      dispatch(slice.actions.postStep1Success(response));
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
export function getCarrierTerminalDropdown() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('maintenance/carrier/dropdown');
      // dispatch(slice.actions.getCarrierTerminalDropdownSuccess(response));
      dispatch(slice.actions.getCarrierTerminalDropdownSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getShipperDropdown() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.getShipperDropdownSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getConsigneeDropdown() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.getConsigneeDropdownSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
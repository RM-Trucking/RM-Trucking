import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error : null,
  shipmentSuccess : false,
  shipmentData : [],
  customerStationDropdown : [],
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
    
    postStep1Success(state,action){
        state.isLoading = false;
        state.shipmentSuccess = true;
    },
    getCustomerStationDropdownSuccess(state,action){
        state.isLoading = false;
        state.customerStationDropdown = action.payload.data.data;
    },
    setCustomerStationDropdown(state,action){
        state.customerStationDropdown = action.payload;
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
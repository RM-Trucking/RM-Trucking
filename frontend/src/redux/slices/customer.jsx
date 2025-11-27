import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error : null,
  customerSuccess : false,
  customerData : [],
  customerSearchStr : "",
};

const slice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    hasError(state, action) {
      state.isLoading = false;
      state.error = 'error';
    },
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
      state.customerSuccess = false;
      state.error = null;
    },
    getCustomerdataSuccess(state, action) {
        state.isLoading = false;
        state.customerData = [];
    },
    setCustomerSearchStr(state, action) {
      state.customerSearchStr = action.payload;
    },
     
  },
});

export const {
  setCustomerSearchStr,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getCustomerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get('/customerdata');
      dispatch(slice.actions.getCustomerdataSuccess(response));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
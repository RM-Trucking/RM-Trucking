import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  customerSuccess: false,
  customerRows: [],
  customerSearchStr: "",
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
      state.customerRows = [{
        'customerName': 'Oliver',
        'rmAccountNo': 'RM1239289280',
        'customerPhNo': '(112) 555-0199',
        'customerWebsite': 'example1.com',
        'status': 'Active',
        'notes': "At example2.com, we prioritize our customers' shipping needs. Our platform offers a seamless experience for tracking shipments, managing delivery preferences, and accessing real-time updates View more",
      }];
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
      // const response = await axios.get('/customerdata');
      dispatch(slice.actions.getCustomerdataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error : null,
  rateSuccess: false,
  rateTableData: [],
  rateSearchObj: {},
};

const slice = createSlice({
  name: 'rate',
  initialState,
  reducers: {
    hasError(state, action) {
      state.isLoading = false;
      state.error = 'error';
    },
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
      state.rateSuccess = false;
      state.error = null;
    },
    getRateDashboarddataSuccess(state, action) {
        state.isLoading = false;
        state.rateTableData = [];
    },
    setRateSearchObj(state, action) {
      state.rateSearchObj = action.payload;
    },
     
  },
});

export const {
  setRateSearchObj,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getRateDashboardData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
    //   const response = await axios.get('/ratedashboarddata');
      dispatch(slice.actions.getRateDashboarddataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
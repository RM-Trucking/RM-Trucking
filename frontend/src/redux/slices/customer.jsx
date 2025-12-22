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
  selectedCustomerRowDetails: {},
  selectedCustomerStationDetails : {},
  stationRows: [],
  tableWhichBeingViewed : '',
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
    getCustomerStationDataSuccess(state, action) {
      state.isLoading = false;
      state.stationRows = [
        {
          stationName : 'Station Level 1',
          rmAccountNo : 'RM5675765',
          airportCode : 'JFK',
          address     : '123 Liberty Ave...', 
          city        : 'New York City',
          state       : 'New York', 
          zipCode     : '11201', 
          zip4Code    : '11201',
          phoneNo     : '(733) 555-0123',
          faxNo       : '',
          openTime    : '12:00',
          closeTime   : '07:00',
          hrs         : '5',
          warehouse   : 'Warehouse' 
        }
      ];
    },
    setCustomerSearchStr(state, action) {
      state.customerSearchStr = action.payload;
    },
    setSelectedCustomerRowDetails(state, action) {
      state.selectedCustomerRowDetails = action.payload;
    },
    setSelectedCustomerStationRowDetails(state, action) {
      state.selectedCustomerStationDetails = action.payload;
    },
    setTableBeingViewed(state, action) {
      state.tableWhichBeingViewed = action.payload;
    },

  },
});

export const {
  setCustomerSearchStr,
  setSelectedCustomerRowDetails,
  setSelectedCustomerStationRowDetails,
  setTableBeingViewed,
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
export function getCustomerStationData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('/stationdata');
      dispatch(slice.actions.getCustomerStationDataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
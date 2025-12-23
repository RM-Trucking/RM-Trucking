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
  selectedCustomerStationDetails: {},
  selectedStationTabRowDetails: {},
  stationRows: [],
  tableWhichBeingViewed: '',
  stationCurrentTab: 'department',
  stationTabTableData: [],
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
          stationName: 'Station Level 1',
          rmAccountNo: 'RM5675765',
          airportCode: 'JFK',
          address: '123 Liberty Ave...',
          city: 'New York City',
          state: 'New York',
          zipCode: '11201',
          zip4Code: '11201',
          phoneNo: '(733) 555-0123',
          faxNo: '',
          openTime: '12:00',
          closeTime: '07:00',
          hrs: '5',
          warehouse: 'Warehouse'
        }
      ];
    },
    // station tabs data
    getStationDepartmentDataSuccess(state, action) {
      state.isLoading = false;
      state.stationTabTableData = [
        {
          id:1,
          stationName: 'Station Level 1',
          departmentName: 'Department A',
          email: 'departmentA@example.com',
          phoneNo: '(733) 555-0123',
          notes: 'Handles logistics and coordination.'
        }
      ]
    },
    getStationPersonnelDataSuccess(state, action) {
      state.isLoading = false;
      state.stationTabTableData = [
        {
          id:1,
          personnelName: 'Personnel A',
          departmentName: 'Department A',
          email: 'personnelA@example.com',
          officePhoneNo: '(733) 555-0123',
          cellPhoneNo: '(733) 555-0124',
          notes: 'Handles logistics and coordination.'
        }
      ]
    },
    getStationRateDataSuccess(state, action) {
      state.isLoading = false;
      state.stationTabTableData = [
        {
          id:1,
          rateID : "RID10002",
          origin: "ORD",
          originZipCode: "10001, 10002",
          destination: "Los Angeles",
          destinationZipCode: "90001, 90002",
          minRate: "$25.50",
          rateLB: "$25.50",
          maxRate: "$25.50",
          expiryDate: "01-30-2026"
        }
      ]
    },
      // customer search string on customer page
    setCustomerSearchStr(state, action) {
      state.customerSearchStr = action.payload;
    },
    // customer row details
    setSelectedCustomerRowDetails(state, action) {
      state.selectedCustomerRowDetails = action.payload;
    },
    // station row details
    setSelectedCustomerStationRowDetails(state, action) {
      state.selectedCustomerStationDetails = action.payload;
    },
    // station tab row details
    setSelectedStationTabRowDetails(state, action) {
      state.selectedStationTabRowDetails = action.payload;
    },
    setTableBeingViewed(state, action) {
      state.tableWhichBeingViewed = action.payload;
    },
    setStationCurrentTab(state, action) {
      state.stationCurrentTab = action.payload;
      state.tableWhichBeingViewed = action.payload;
    },

  },
});

export const {
  setCustomerSearchStr,
  setSelectedCustomerRowDetails,
  setSelectedCustomerStationRowDetails,
  setTableBeingViewed,
  setStationCurrentTab,
  setSelectedStationTabRowDetails,
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
export function getStationDepartmentData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('/station/department');
      dispatch(slice.actions.getStationDepartmentDataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getStationPersonnelData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('/station/personnel');
      dispatch(slice.actions.getStationPersonnelDataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getStationRateData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('/station/rate');
      dispatch(slice.actions.getStationRateDataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
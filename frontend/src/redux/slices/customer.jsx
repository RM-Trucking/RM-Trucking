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
  checkedRates: [],
  pagination: { page: 1, pageSize: 10, totalRecords: 0 },
  operationalMessage : '',
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
      state.stationTabTableData = [];
    },
    // set pagination object of the current table
    setPaginationObject(state, action) {
      state.pagination = action.payload;
    },
    getCustomerdataSuccess(state, action) {
      state.isLoading = false;
      state.customerSuccess = true;
      state.customerRows = action.payload.data;
      state.pagination.page = action.payload.pagination.page;
      state.pagination.pageSize = action.payload.pagination.pageSize;
      state.pagination.totalRecords = action.payload.pagination.total;
    },
    postCustomerdataSuccess(state, action) {
      state.isLoading = false;
      state.customerSuccess = true;
      state.operationalMessage = action.payload.message;
      console.log("customer post payload", action.payload.data.customer);
      state.customerRows.unshift(action.payload.data.customer);
    },
    putCustomerdataSuccess(state, action) {
      state.isLoading = false;
      console.log("customer put payload", action.payload.data);
      state.customerSuccess = true;
      state.operationalMessage = action.payload.message;
      const index = state.customerRows.findIndex((row) => row.customerId === action.payload?.data?.customerId);
      if (index === 0 || index > 0) {
        state.customerRows.splice(index, 1, action.payload.data);
      }
    },
    deleteCustomerdataSuccess(state, action) {
      state.isLoading = false;
      state.customerSuccess = true;
      state.operationalMessage = action.payload.message.message;
      console.log("customer delete payload", action.payload);
      const index = state.customerRows.findIndex((row) => row.customerId === action.payload.id);
      if (index === 0 || index > 0) {
        state.customerRows.splice(index, 1);
      }
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
          id: 1,
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
          id: 1,
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
          rateID: "RID10002",
          origin: "ORD",
          originZipCode: "10001, 10002",
          destination: "Los Angeles",
          destinationZipCode: "90001, 90002",
          minRate: "$25.50",
          rateLB: "$25.50",
          maxRate: "$25.50",
          expiryDate: "01-30-2026"
        },
        {
          rateID: "RID10005",
          origin: "ORD",
          originZipCode: "10001, 10002",
          destination: "Los Angeles",
          destinationZipCode: "90001, 90002",
          minRate: "$25.50",
          rateLB: "$25.50",
          maxRate: "$25.50",
          expiryDate: "01-30-2026"
        },
      ];
      for (let i = 0; i < state.checkedRates.length; i++) {
        state.stationTabTableData.push(state.checkedRates[i]);
      }
    },
    setStationRateData(state, action) {
      console.log('Setting station rate data in customer slice:', action.payload);
      if (action.payload.checked) {
        state.checkedRates.push({
          rateID: action.payload.row.rateID,
          origin: action.payload.row.origin,
          originZipCode: action.payload.row.originZipCode,
          destination: action.payload.row.destination,
          destinationZipCode: action.payload.row.destinationZipCode,
          minRate: action.payload.row.min,
          rateLB: "",
          maxRate: action.payload.row.max,
          expiryDate: action.payload.row.expiryDate
        });
      }
      else {
        const filteredRates = state.checkedRates.filter(rate => rate.rateID !== action.payload.row.rateID);
        console.log('Filtered Rates:', filteredRates);
        state.checkedRates = filteredRates;
      }
    },
    getStationAccessorialDataSuccess(state, action) {
      state.isLoading = false;
      state.stationTabTableData = [
        {
          id: 1,
          accessorialName: "Residential",
          chargeType: "Flat",
          charges: "$25.50",
          notes: "Residential delivery charges."
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
  setStationRateData,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getCustomerData({ pageNo, pageSize, searchStr }) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`maintenance/customer?${searchStr ? `search=${searchStr}&` : ''}page=${pageNo}&pageSize=${pageSize}`);
      dispatch(slice.actions.getCustomerdataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function postCustomerData(obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`maintenance/customer`, obj);
      dispatch(slice.actions.postCustomerdataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function putCustomerData(obj, id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`maintenance/customer/${id}`, obj);
      dispatch(slice.actions.putCustomerdataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function deleteCustomer(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`maintenance/customer/${id}`);
      dispatch(slice.actions.deleteCustomerdataSuccess({
        id, message: response.data
      }));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
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
export function getStationAccessorialData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get('/station/accessorial');
      dispatch(slice.actions.getStationAccessorialDataSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
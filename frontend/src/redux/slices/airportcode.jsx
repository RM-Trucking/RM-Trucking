import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    airportSuccess: false,
    airportData: [],
    airportSearchStr: '',
    operationalMessage: '',
    selectedAirportRowDetails: {},
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
};

const slice = createSlice({
    name: 'airport',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.airportSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },
        setAirportSearchStr(state, action) {
            state.airportSearchStr = action.payload;
        },
        // airport row details
        setSelectedAirportRowDetails(state, action) {
            state.selectedAirportRowDetails = action.payload;
        },
        getAirportDataSuccess(state, action) {
            state.isLoading = false;
            state.airportSuccess = true;
            state.airportData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total,
            };
        },
        postAirportDataSuccess(state,action){
            state.isLoading = false;
            state.airportSuccess = true;
            state.operationalMessage = `Airport added successfully.`;
            state.airportData.unshift(action.payload.data);
            state.pagination.totalRecords = action.payload?.total + 1 || state.pagination.totalRecords + 1;
        },
        putAirportDataSuccess(state, action) {
            state.isLoading = false;
            state.airportSuccess = true;
            state.operationalMessage = "Airport updated successfully";
            // update table data by updating record
            const index = state.airportData.findIndex((row) => row.airportId === action.payload?.data?.airportId);
            if (index === 0 || index > 0) {
                state.airportData.splice(index, 1, action.payload.data);
            }
        },
        deleteAirportDataSuccess(state, action) {
            state.isLoading = false;
            state.airportSuccess = true;
            state.operationalMessage = `Airport deleted successfully.`;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setError(state) {
            state.error = '';
        },
        setAirportData(state, action) {
            state.airportData = action.payload;
        },

    },
});

export const {
    setOperationalMessage,
    setAirportData,
    setPaginationObject,
    setAirportSearchStr,
    setSelectedAirportRowDetails,
    setError,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getAirportData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/airport?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getAirportDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function postAirportData(obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`maintenance/airport`, obj);
      dispatch(slice.actions.postAirportDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function putAirportData(id, obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`maintenance/airport/${id}`, obj);
      dispatch(slice.actions.putAirportDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function deleteAirport(id, callback) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`maintenance/airport/${id}`);
      dispatch(slice.actions.deleteAirportDataSuccess({
        id, message: response.data
      }));
      callback();
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}


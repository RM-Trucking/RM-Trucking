import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    airlineSuccess: false,
    airlineData: [
        {
            airlineId : 1,
            airlineName : "American Airlines",
            iataCode : "AA",
            airlineCode : "004"
        },
        {
            airlineId : 2,
            airlineName : "Delta Airlines",
            iataCode : "DL",
            airlineCode : "005"
        }
    ],
    airlineSearchStr: '',
    operationalMessage: '',
    selectedAirlineRowDetails: {},
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
};

const slice = createSlice({
    name: 'airline',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.airlineSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },
        setAirlineSearchStr(state, action) {
            state.airlineSearchStr = action.payload;
        },
        // airline row details
        setSelectedAirlineRowDetails(state, action) {
            state.selectedAirlineRowDetails = action.payload;
        },
        getAirlineDataSuccess(state, action) {
            state.isLoading = false;
            state.airlineSuccess = true;
            state.airlineData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total,
            };
        },
        postAirlineDataSuccess(state,action){
            state.isLoading = false;
            state.airlineSuccess = true;
            state.operationalMessage = `Airline added successfully.`;
            state.airlineData.unshift(action.payload.data);
            state.pagination.totalRecords = action.payload?.total + 1 || state.pagination.totalRecords + 1;
        },
        putAirlineDataSuccess(state, action) {
            state.isLoading = false;
            state.airlineSuccess = true;
            state.operationalMessage = "Airline updated successfully";
            // update table data by updating record
            const index = state.airlineData.findIndex((row) => row.airlineId === action.payload?.data?.airlineId);
            if (index === 0 || index > 0) {
                state.airlineData.splice(index, 1, action.payload.data);
            }
        },
        deleteAirlineDataSuccess(state, action) {
            state.isLoading = false;
            state.airlineSuccess = true;
            state.operationalMessage = `Airline deleted successfully.`;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setError(state) {
            state.error = '';
        },
        setAirlineData(state, action) {
            state.airlineData = action.payload;
        },

    },
});

export const {
    setOperationalMessage,
    setAirlineData,
    setPaginationObject,
    setAirlineSearchStr,
    setSelectedAirlineRowDetails,
    setError,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getAirlineData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/airline?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getAirlineDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function postAirlineData(obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`maintenance/airline`, obj);
      dispatch(slice.actions.postAirlineDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function putAirlineData(id, obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`maintenance/airline/${id}`, obj);
      dispatch(slice.actions.putAirlineDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function deleteAirline(id, callback) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`maintenance/airline/${id}`);
      dispatch(slice.actions.deleteAirlineDataSuccess({
        id, message: response.data
      }));
      callback();
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}


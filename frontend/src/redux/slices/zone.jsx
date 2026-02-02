import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    zoneSuccess: false,
    zoneData: [],
    zoneSearchStr: '',
    operationalMessage: '',
    selectedZoneRowDetails: {},
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
};

const slice = createSlice({
    name: 'zone',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.zoneSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },
        setZoneSearchStr(state, action) {
            state.zoneSearchStr = action.payload;
        },
        // zone row details
        setSelectedZoneRowDetails(state, action) {
            state.selectedZoneRowDetails = action.payload;
        },
        getZoneDataSuccess(state, action) {
            state.isLoading = false;
            state.zoneSuccess = true;
            state.zoneData = action.payload.data;
            state.pagination = {
                page: action.payload.page,
                pageSize: action.payload.pageSize,
                totalRecords: action.payload.total,
            };
        }

    },
});

export const {
    setPaginationObject,
    setZoneSearchStr,
    setSelectedZoneRowDetails,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getZoneData({ pageNo, pageSize, searchStr }) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`maintenance/zone?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
      dispatch(slice.actions.getZoneDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


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
  zoneZipCodeCheckData: [],
  zoneSearchStr: '',
  operationalMessage: '',
  selectedZoneRowDetails: {},
  pagination: { page: 1, pageSize: 10, totalRecords: 0 },
  zoneZipCodeToCheck:'',
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
        page: action.payload.pagination.page,
        pageSize: action.payload.pagination.pageSize,
        totalRecords: action.payload.pagination.total,
      };
    },
    postZoneDataSuccess(state, action) {
      state.isLoading = false;
      state.zoneSuccess = true;
      state.operationalMessage = `Zone added successfully.`;
      state.zoneData.unshift(action.payload.data);
      state.pagination.totalRecords = action.payload?.total + 1 || state.pagination.totalRecords + 1;
    },
    putZoneDataSuccess(state, action) {
      state.isLoading = false;
      state.zoneSuccess = true;
      state.operationalMessage = "Zone updated successfully";
      // update table data by updating record
      const index = state.zoneData.findIndex((row) => row.zoneId === action.payload?.data?.zoneId);
      if (index === 0 || index > 0) {
        state.zoneData.splice(index, 1, action.payload.data);
      }
    },
    getZoneByIdSuccess(state, action) {
      state.isLoading = false;
      state.zoneSuccess = true;
      state.selectedZoneRowDetails = action.payload.data;
    },
    deleteZoneDataSuccess(state, action) {
      state.isLoading = false;
      state.zoneSuccess = true;
      state.operationalMessage = `Zone deleted successfully.`;
    },
    checkZipCodeSuccess(state, action) {
      state.isLoading = false;
      state.zoneSuccess = true;
      state.zoneZipCodeCheckData = [
        {
          "zoneId": 9,
          "noteThreadId": 300,
          "entityId": 287,
          "zoneName": "check zone 1602 1",
          "zipCodes": [
            "52525"
          ],
          "ranges": [
            "52525-52526"
          ],
          "notes": [],
          "activeStatus": "Y",
          "createdAt": "2026-02-16 12:04:48.356630",
          "createdBy": "Admin",
          "updatedAt": "2026-02-16 12:14:46.654313",
          "updatedBy": "Admin",
          "rateCount": 0
        },
        {
          "zoneId": 8,
          "noteThreadId": 299,
          "entityId": 286,
          "zoneName": "check zone 1602",
          "zipCodes": [
            "52525"
          ],
          "ranges": [],
          "notes": [],
          "activeStatus": "Y",
          "createdAt": "2026-02-16 12:03:24.874377",
          "createdBy": "Admin",
          "updatedAt": "2026-02-16 12:11:32.678284",
          "updatedBy": "Admin",
          "rateCount": 0
        },
        {
          "zoneId": 7,
          "noteThreadId": 298,
          "entityId": 285,
          "zoneName": "check zone 56",
          "zipCodes": [
            "45455",
            "45455",
            "54545",
            "45555"
          ],
          "ranges": [
            "54554-54558",
            "45445-45447"
          ],
          "notes": [],
          "activeStatus": "Y",
          "createdAt": "2026-02-10 16:40:26.486976",
          "createdBy": "Admin",
          "updatedAt": "2026-02-10 10:40:26.655917",
          "rateCount": 0
        }];
        state.pagination = {
        page: 1,
        pageSize: 10,
        totalRecords: state.zoneZipCodeCheckData.length,
      };
    },
    setOperationalMessage(state) {
      state.operationalMessage = '';
    },
    setZoneZipCodeToCheck(state, action) {
      state.zoneZipCodeToCheck = action.payload;
    },

  },
});

export const {
  setOperationalMessage,
  setPaginationObject,
  setZoneSearchStr,
  setSelectedZoneRowDetails,
  setZoneZipCodeToCheck,
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
export function postZoneData(obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`maintenance/zone`, obj);
      dispatch(slice.actions.postZoneDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function putZoneData(id, obj) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`maintenance/zone/${id}`, obj);
      dispatch(slice.actions.putZoneDataSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function deleteZone(id, callback) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`maintenance/zone/${id}`);
      dispatch(slice.actions.deleteZoneDataSuccess({
        id, message: response.data
      }));
      callback();
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function getZoneById(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`maintenance/zone/${id}`);
      dispatch(slice.actions.getZoneByIdSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
export function checkZipCode(zipCode) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // const response = await axios.get(`maintenance/zone/check-zip?zipCode=${zipCode}`);
      dispatch(slice.actions.checkZipCodeSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error))
    }
  };
}
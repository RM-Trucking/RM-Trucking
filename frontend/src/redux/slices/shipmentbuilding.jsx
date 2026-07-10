import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    shipmentSuccess: false,
    shipmentData: [],
    customerStationDropdown: [],
    carrierTerminalDropdown: [],
    shipperDropdown: [],
    consigneeDropdown: [],
    shipperAirlineDropdown: [],
    consigneeAirlineDropdown: [],
    pickupAccessorials: [],
    linehaulAccessorials: [],
    deliveryAccessorials: [],
    accessorialDropdown: [],
    stationAccessorialData: [],
    zipToZipCarrierPickupRate: null,
    zipToZipCarrierLinehaulRate: null,
    zipToZipCarrierDeliveryRate: null,
    shipmentBuildSearchStr: '',
    shipmentBuildPagination: { page: 1, pageSize: 10, totalRecords: 0 },
    shipmentViewData: [],
    operationalMessage : '',
};

const slice = createSlice({
    name: 'shipmentbuilding',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action?.payload;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.shipmentSuccess = false;
            state.error = null;
        },

        postStep1Success(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
        },
        getCustomerStationDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.customerStationDropdown = action.payload.data.data;
        },
        searchCustomerStationDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.customerStationDropdown = action.payload.data.data;
        },
        getCarrierTerminalDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.carrierTerminalDropdown = action.payload.data.data;
        },
        getShipperDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.shipperDropdown = action.payload.data;
        },

        setCustomerStationDropdown(state, action) {
            state.customerStationDropdown = action.payload;
        },
        setCarrierTerminalDropdown(state, action) {
            state.carrierTerminalDropdown = action.payload;
        },
        getConsigneeDropdownSuccess(state, action) {
            state.isLoading = false;
            state.consigneeDropdown = action.payload.data;
        },
        getShipperAirlineDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipperAirlineDropdown = action.payload.data;
        },
        getConsigneeAirlineDropdownSuccess(state, action) {
            state.isLoading = false;
            state.consigneeAirlineDropdown = action.payload.data;
        },
        getPickupAccessorialsSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.pickupAccessorials = action.payload.data;
        },
        setPickupAccessorials(state, action) {
            state.pickupAccessorials = action.payload;
        },
        getLinehaulAccessorialsSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.linehaulAccessorials = action.payload.data;
        },
        setLinehaulAccessorials(state, action) {
            state.pickupAccessorials = action.payload;
        },
        getDeliveryAccessorialsSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.deliveryAccessorials = action.payload.data;
        },
        setDeliveryAccessorials(state, action) {
            state.pickupAccessorials = action.payload;
        },
        getAccessorialDropdownSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.accessorialDropdown = action.payload.data;
        },
        setAccessorialDropdown(state, action) {
            state.accessorialDropdown = action.payload;
        },
        getStationAccessorialDataSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.stationAccessorialData = action.payload.data;
        },
        getZipToZipCarrierPickupRateSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.zipToZipCarrierPickupRate = action.payload.data;
        },
        getZipToZipCarrierLinehaulRateSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.zipToZipCarrierLinehaulRate = action.payload.data;
        },
        getZipToZipCarrierDeliveryRateSuccess(state, action) {
            state.isLoading = false;
            state.shipmentSuccess = true;
            state.zipToZipCarrierDeliveryRate = action.payload.data;
        },
        setError(state) {
            state.error = '';
        },
        setOperationalMessage(state, action) {
            state.operationalMessage = action.payload;
        },
        setShipmentBuildSearchStr(state, action) {
            state.shipmentBuildSearchStr = action.payload;
        },
        setShipmentBuildPaginationObject(state, action) {
            state.shipmentBuildPagination = action.payload;
        },
        getShipmentBuildDataSuccess(state,action){
            state.isLoading = false;
            state.shipmentSuccess = true;
            // state.shipmentViewData = action.payload.data;
            state.shipmentViewData = [
                {
                    shipmentId: 1,
                    shipmentPRONo : 'PRO9289280209',
                    customerName : 'Oliver',
                    origin : 'Brooklyn, New York',
                    destination : 'Los Angeles, California',
                    serviceLevel : 'Level 1',
                    pickupAgent : 'Cal Sierra',
                    pickupRouting : 'pending',
                    linehaulRouting : 'pending',
                    deliveryRouting : 'pending',
                    status : 'To be Routed',
                    delChecked : 'N',
                    delCarrier : '',

                }
            ];
        },

    },
});

export const {
    setError,
    setShipmentBuildSearchStr,
    setShipmentBuildPaginationObject,
    setPickupAccessorials,
    setLinehaulAccessorials,
    setDeliveryAccessorials,
    setAccessorialDropdown,
    setOperationalMessage,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------

export function getShipmentBuildData({pageNo, pageSize}) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            //   const response = await axios.get('maintenance/customer/dropdown');
            //   dispatch(slice.actions.getShipmentBuildDataSuccess(response));
            dispatch(slice.actions.getShipmentBuildDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getCustomerStationDropdown() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get('maintenance/customer/dropdown');
            dispatch(slice.actions.getCustomerStationDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function searchCustomerStationDropdown(searchValue) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/customer/dropdown?search=${searchValue}`);
            dispatch(slice.actions.searchCustomerStationDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getCarrierTerminalDropdown(searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier/dropdown${searchTerm ? `?search=${searchTerm}` : ''}`);
            dispatch(slice.actions.getCarrierTerminalDropdownSuccess(response));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getShipperDropdown(searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/shipper/dropdown${searchTerm ? `?searchTerm=${searchTerm}` : ''}`);
            dispatch(slice.actions.getShipperDropdownSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getConsigneeDropdown(searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/consignee/dropdown${searchTerm ? `?searchTerm=${searchTerm}` : ''}`);
            dispatch(slice.actions.getConsigneeDropdownSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getShipperAirlineDropdown(airportCode, searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/airline/dropdown?airportCode=${airportCode}${searchTerm ? `&searchTerm=${searchTerm}` : ''}`);
            dispatch(slice.actions.getShipperAirlineDropdownSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getConsigneeAirlineDropdown(airportCode, searchTerm) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/airline/dropdown?airportCode=${airportCode}${searchTerm ? `&searchTerm=${searchTerm}` : ''}`);
            dispatch(slice.actions.getConsigneeAirlineDropdownSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
// accessorial dropdown details
export function getPickupAccessorials(entityId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/entity-accessorial/${entityId}?checkCarrierType=true`);
            dispatch(slice.actions.getPickupAccessorialsSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getLinehaulAccessorials(entityId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/entity-accessorial/${entityId}?checkCarrierType=true`);
            dispatch(slice.actions.getLinehaulAccessorialsSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getDeliveryAccessorials(entityId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/entity-accessorial/${entityId}?checkCarrierType=true`);
            dispatch(slice.actions.getDeliveryAccessorialsSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getAccessorialDropdown() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get('/maintenance/accessorial/dropdown');
            dispatch(slice.actions.getAccessorialDropdownSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
// customer accessorials
export function getStationAccessorialData(entityId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/entity-accessorial/${entityId}`);
            dispatch(slice.actions.getStationAccessorialDataSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
}
export function getZipToZipCarrierPickupRate(originZip, destinationZip, weight, terminalId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier-rate/transport-rate/quote?originZip=${originZip}&destinationZip=${destinationZip}&weight=${weight}&terminalId=${terminalId}`);
            dispatch(slice.actions.getZipToZipCarrierPickupRateSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
}
export function getZipToZipCarrierLinehaulRate(originZip, destinationZip, weight, terminalId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier-rate/transport-rate/quote?originZip=${originZip}&destinationZip=${destinationZip}&weight=${weight}&terminalId=${terminalId}`);
            dispatch(slice.actions.getZipToZipCarrierLinehaulRateSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
}
export function getZipToZipCarrierDeliveryRate(originZip, destinationZip, weight, terminalId) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`maintenance/carrier-rate/transport-rate/quote?originZip=${originZip}&destinationZip=${destinationZip}&weight=${weight}&terminalId=${terminalId}`);
            dispatch(slice.actions.getZipToZipCarrierDeliveryRateSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
}
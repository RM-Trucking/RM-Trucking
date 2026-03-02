import { createSlice, current } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';


// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    carrierSuccess: false,
    carrierData: [],
    carrierSearchStr: '',
    operationalMessage: '',
    selectedCarrierRowDetails: {},
    pagination: { page: 1, pageSize: 10, totalRecords: 0 },
    // carrier tab details
    currentCarrierTab: 'active',
    currentCarrierViewTab: 'terminal',
    // terminal details and accessorial data are mapped to this array
    carrierViewTabData: [],
    selectedCarrierTabRowDetails: {},
    selectedRowCarrierType: '',
    // terminal tab details
    terminalViewTabData: [],
    selectedTerminalTabRowDetails: {},
    currentTerminalTab: 'personnel',
};

const slice = createSlice({
    name: 'carrier',
    initialState,
    reducers: {
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload || action.payload.error;
        },
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
            state.carrierSuccess = false;
            state.error = null;
            state.operationalMessage = '';
        },
        setPaginationObject(state, action) {
            state.pagination = action.payload;
        },
        setCarrierSearchStr(state, action) {
            state.carrierSearchStr = action.payload;
        },
        // carrier row details
        setSelectedCarrierRowDetails(state, action) {
            state.selectedCarrierRowDetails = action.payload;
        },
        setOperationalMessage(state) {
            state.operationalMessage = '';
        },
        setCurrentCarrierTab(state, action) {
            state.currentCarrierTab = action.payload;
        },
        setCurrentCarrierViewTab(state, action) {
            state.currentCarrierViewTab = action.payload;
        },
        getCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            // state.carrierData = action.payload.data;
            state.pagination = {
                page: action.payload?.pagination?.page || state.pagination?.page,
                pageSize: action.payload?.pagination?.pageSize || state.pagination?.pageSize,
                totalRecords: action.payload?.pagination?.total || state.pagination?.totalRecords || state.carrierData.length,
            };
            if (state.currentCarrierTab === 'active') {
                state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'Y',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'Y',
                        notes: 'notes'
                    }
                ];
            }
            if (state.currentCarrierTab === 'inactive') {
                state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    }
                ];
            }
            if (state.currentCarrierTab === 'incomplete') {
                state.carrierData = [
                    {
                        carrierId: 'CID10001',
                        carrierName: 'FedEx',
                        website: 'example1.com',
                        tsa: 'Y',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    },
                    {
                        carrierId: 'CID10002',
                        carrierName: 'UPS',
                        website: 'example2.com',
                        tsa: 'N',
                        insuranceExpiryDate: '05/25/2025',
                        status: 'N',
                        notes: 'notes'
                    }
                ];
            }
        },
        deleteCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.operationalMessage = `Carrier deleted successfully.`;
        },
        // on view tab table details
        getTerminalCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            if (state.currentCarrierViewTab === 'terminal') {
                state.carrierViewTabData = [
                    {
                        terminalId: 1,
                        terminalName: 'Terminal 1',
                        rmAccountNumber: 'RM5675765',
                        airportCode: 'JFK',
                        totalShipments: 100,
                        onTimePercentage: '95%',
                        lateShipments: 5,
                        address: '123 Main Street',
                        city: 'New York',
                        state: 'NY',
                        zipCodes: ['10001', '10002'],
                        phoneNumber: '123-456-7890',
                        faxNumber: '123-456-7891',
                        openTime: '08:00',
                        closeTime: '17:00',
                        status: 'Y',
                        hours: '8'
                    },
                    {
                        terminalId: 2,
                        terminalName: 'Terminal 2',
                        rmAccountNumber: 'RM5675766',
                        airportCode: 'LAX',
                        totalShipments: 150,
                        onTimePercentage: '90%',
                        lateShipments: 5,
                        address: '123 Main Street',
                        city: 'New York',
                        state: 'NY',
                        zipCodes: ['10001', '10002'],
                        phoneNumber: '123-456-7890',
                        faxNumber: '123-456-7891',
                        openTime: '08:00',
                        closeTime: '17:00',
                        status: 'N',
                        hours: '5'
                    },
                ];
            }
        },
        getAccessorialCarrierDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            if (state.currentCarrierViewTab === 'accessorial') {
                state.carrierViewTabData = [
                    {
                        accessorialId: 1,
                        accessorialName: 'Accessorial 1',
                        chargeType: 'Flat Fee',
                        chargeValue: '1100',
                        notes: 'This is a sample accessorial note.'
                    },
                    {
                        accessorialId: 2,
                        accessorialName: 'Accessorial 2',
                        chargeType: 'Flat Fee',
                        chargeValue: '1100',
                        notes: 'This is a sample accessorial note.'
                    }
                ];
            }
        },
        setSelectedRowCarrierType(state, action) {
            state.selectedRowCarrierType = action.payload;
        },
        // carrier view tab row details
        setSelectedCarrierTabRowDetails(state, action) {
            state.selectedCarrierTabRowDetails = action.payload;
        },
        // terminal view row details
        setSelectedTeminalTabRowDetails(state, action) {
            state.selectedTerminalTabRowDetails = action.payload;
        },
        setCurrentTerminalTab(state, action) {
            state.currentTerminalTab = action.payload;
        },
        // terminal tab success slices
        getPersonnelTerminalDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.terminalViewTabData = [
                {
                    personnelId: 1,
                    personnelName: 'Bravo',
                    personType: 'Warehouse',
                    email: 'email1@gmail.com',
                    officePhoneNo: '8569999954',
                    cellPhoneNo: '8569999955',
                    notes: 'Sample notes for personnel.'
                },
                {
                    personnelId: 2,
                    personnelName: 'Charlie',
                    personType: 'Sales',
                    email: 'email2@gmail.com',
                    officePhoneNo: '8569999954',
                    cellPhoneNo: '8569999955',
                    notes: 'Sample notes for personnel.'
                }
            ]
        },
        getAccessorialTerminalDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.terminalViewTabData = [
                {
                    accessorialId: 1,
                    serviceNotOffered: true,
                    accessorialName: 'Accessorial 1',
                    chargeType: 'Flat Fee',
                    chargeValue: '1100',
                    notes: 'This is a sample accessorial note.'
                },
                {
                    accessorialId: 2,
                    serviceNotOffered: false,
                    accessorialName: 'Accessorial 2',
                    chargeType: 'Flat Fee',
                    chargeValue: '1100',
                    notes: 'This is a sample accessorial note.'
                }
            ];
        },
        getQualityTerminalDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.terminalViewTabData = [
                {
                    qualityId: 1,
                    totalShipments: '05',
                    onTimePercentage: '95%',
                    lateShipment: '02',
                },
                {
                    qualityId: 2,
                    totalShipments: '100',
                    onTimePercentage: '55%',
                    lateShipment: '92',
                },
            ]
        },
        getRateTerminalDataSuccess(state, action) {
            state.isLoading = false;
            state.carrierSuccess = true;
            state.terminalViewTabData = [
                {
                    rateId: 1,
                    origin: 'ORD',
                    originZipCode: '60501',
                    destination: 'Ankeny',
                    destinationZipCode: '50007',
                    customers: 26,
                    status: 'Y',
                    min: '100',
                    rate100: '100',
                    rate1000: '1000',
                    rate3000: '3000',
                    rate5000: '5000',
                    rate10000: '10000',
                    max: '10000',
                    expiryDate: '12-30-2026',
                },
                {
                    rateId: 2,
                    origin: 'ORD',
                    originZipCode: '60501',
                    destination: 'Ankeny',
                    destinationZipCode: '50007',
                    customers: 26,
                    status: 'Y',
                    min: '100',
                    rate100: '100',
                    rate1000: '1000',
                    rate3000: '3000',
                    rate5000: '5000',
                    rate10000: '10000',
                    max: '10000',
                    expiryDate: '12-30-2026',
                },
                {
                    rateId: 3,
                    origin: 'ORD',
                    originZipCode: '60501',
                    destination: 'Ankeny',
                    destinationZipCode: '50007',
                    customers: 26,
                    status: 'Y',
                    min: '100',
                    rate100: '100',
                    rate1000: '1000',
                    rate3000: '3000',
                    rate5000: '5000',
                    rate10000: '10000',
                    max: '10000',
                    expiryDate: '12-30-2026',
                },
            ];
        },
    },
});

export const {
    setOperationalMessage,
    setPaginationObject,
    setCarrierSearchStr,
    setSelectedCarrierRowDetails,
    setCurrentCarrierTab,
    setCurrentCarrierViewTab,
    setSelectedRowCarrierType,
    setSelectedCarrierTabRowDetails,
    setSelectedTeminalTabRowDetails,
    setCurrentTerminalTab, setCarrierViewTabData,
} = slice.actions;
export default slice.reducer;


// Actions

// ----------------------------------------------------------------------
export function getCarrierData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            // dispatch(slice.actions.getCarrierDataSuccess(response.data));
            dispatch(slice.actions.getCarrierDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function deleteCarrier(id, callback) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.delete(`maintenance/carrier/${id}`);
            dispatch(slice.actions.deleteCarrierDataSuccess({
                id, message: response.data
            }));
            callback();
        } catch (error) {
            dispatch(slice.actions.hasError(error))
        }
    };
}
export function getTerminalCarrierData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getTerminalCarrierDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function getAccessorialCarrierData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getAccessorialCarrierDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
// Terminal tab calls
export function getPersonnelTerminalData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getPersonnelTerminalDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
};
export function getAccessorialTerminalData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getAccessorialTerminalDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
};
export function getQualityTerminalData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getQualityTerminalDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
};
export function getRateTerminalData({ pageNo, pageSize, searchStr }) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            // const response = await axios.get(`maintenance/carrier?page=${pageNo}&pageSize=${pageSize}${searchStr ? `&search=${searchStr}` : ''}`);
            dispatch(slice.actions.getRateTerminalDataSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    }
};
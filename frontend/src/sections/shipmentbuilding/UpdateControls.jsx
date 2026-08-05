export const updateControls = (setValue, selectedObj,
    customerStationDropdown, shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown,
) => {
    console.log('update controls');
    const shipmentDetails = selectedObj?.shipmentDetails;
    const customerDetails = selectedObj?.customerDetails;
    const commodityDetails = selectedObj.commodityDetails;
    const pickupDetails = selectedObj?.carrierDetails?.pickupDetails;
    const linehaulDetails = selectedObj?.carrierDetails?.linehaulDetails;
    const deliveryDetails = selectedObj?.carrierDetails?.deliveryDetails;
    const carrierRateDetails = selectedObj?.shipmentRateDetails?.carrierRateDetails;
    const customerRateDetails = selectedObj?.shipmentRateDetails?.customerRateDetails;

    // step 1
    if (shipmentDetails && Object.keys(shipmentDetails).length > 0) {
        setValue('shipmentType', shipmentDetails?.typeOfShipment);
        setValue('serviceLevel', shipmentDetails?.serviceLevel);
        setValue('date', shipmentDetails?.shipmentDate);
        setValue('time', shipmentDetails?.shipmentTime);
    }
    // step 2
    if (customerDetails && Object.keys(customerDetails).length > 0) {
        const selectedStation = customerStationDropdown?.find(
            (item) => item?.customerId === customerDetails?.customerId && item?.stationId === customerDetails?.stationId
        ) || null;
        setValue('billingCustomer', selectedStation);
        setValue('airportPickupService', customerDetails?.airportPickupService === 'Y' ? true : false);
        setValue('originAirport', customerDetails?.originAirportCode);
        setValue('airportDeliveryService', customerDetails?.airportDeliveryService === 'Y' ? true : false);
        setValue('destinationAirport', customerDetails?.destinationAirportCode);
        setValue('referenceTableRows', (customerDetails?.customerReferenceNumbers || []).map((row, index) => ({
            id: Date.now() + index,
            ...row
        })), {
            shouldValidate: true,
            shouldDirty: true
        });
        if (customerDetails?.airportPickupService === 'Y') {
            const selectedAirline = shipperAirlineDropdown?.find(
                (item) => item?.airlineId === customerDetails?.pickupAirlineDetails?.airlineId
            ) || null;
            setValue('shipperName', selectedAirline);
            setValue('shipperAddr1', customerDetails?.pickupAirlineDetails?.addressLine1);
            setValue('shipperAddr2', customerDetails?.pickupAirlineDetails?.addressLine2);
            setValue('shipperCity', customerDetails?.pickupAirlineDetails?.city);
            setValue('shipperState', customerDetails?.pickupAirlineDetails?.state);
            setValue('shipperZip', customerDetails?.pickupAirlineDetails?.zipCode);
            setValue('shipperContact', customerDetails?.pickupAirlineDetails?.contactPersonName);
            setValue('shipperPhone', customerDetails?.pickupAirlineDetails?.phoneNumber);
        }
        else if (customerDetails?.airportPickupService === 'N') {
            const selectedShipper = shipperDropdown?.find(
                (item) => item?.shipperId === customerDetails?.shipperDetails?.shipperId
            ) || null;
            setValue('shipperName', selectedShipper);
            setValue('shipperAddr1', customerDetails?.shipperDetails?.addressLine1);
            setValue('shipperAddr2', customerDetails?.shipperDetails?.addressLine2);
            setValue('shipperCity', customerDetails?.shipperDetails?.city);
            setValue('shipperState', customerDetails?.shipperDetails?.state);
            setValue('shipperZip', customerDetails?.shipperDetails?.zipCode);
            setValue('shipperContact', customerDetails?.shipperDetails?.contactPersonName);
            setValue('shipperPhone', customerDetails?.shipperDetails?.phoneNumber);
        }
        if (customerDetails?.airportDeliveryService === 'Y') {
            const selectedAirline = consigneeAirlineDropdown?.find(
                (item) => item?.airlineId === customerDetails?.deliveryAirlineDetails?.airlineId
            ) || null;
            setValue('consigneeName', selectedAirline);
            setValue('consigneeAddr1', customerDetails?.deliveryAirlineDetails?.addressLine1);
            setValue('consigneeAddr2', customerDetails?.deliveryAirlineDetails?.addressLine2);
            setValue('consigneeCity', customerDetails?.deliveryAirlineDetails?.city);
            setValue('consigneeState', customerDetails?.deliveryAirlineDetails?.state);
            setValue('consigneeZip', customerDetails?.deliveryAirlineDetails?.zipCode);
            setValue('consigneeContact', customerDetails?.deliveryAirlineDetails?.contactPersonName);
            setValue('consigneePhone', customerDetails?.deliveryAirlineDetails?.phoneNumber);
        }
        else if (customerDetails?.airportDeliveryService === 'N') {
            const selectedConsignee = consigneeDropdown?.find(
                (item) => item?.consigneeId === customerDetails?.consigneeDetails?.consigneeId
            ) || null;
            setValue('consigneeName', selectedConsignee);
            setValue('consigneeAddr1', customerDetails?.consigneeDetails?.addressLine1);
            setValue('consigneeAddr2', customerDetails?.consigneeDetails?.addressLine2);
            setValue('consigneeCity', customerDetails?.consigneeDetails?.city);
            setValue('consigneeState', customerDetails?.consigneeDetails?.state);
            setValue('consigneeZip', customerDetails?.consigneeDetails?.zipCode);
            setValue('consigneeContact', customerDetails?.consigneeDetails?.contactPersonName);
            setValue('consigneePhone', customerDetails?.consigneeDetails?.phoneNumber);
        }
    }
};
export const updateStep2Controls = (setValue, selectedObj,
    customerStationDropdown, shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown,
) => {
    const customerDetails = selectedObj?.customerDetails;
    // step 2
    if (customerDetails && Object.keys(customerDetails).length > 0) {
        const selectedStation = customerStationDropdown?.find(
            (item) => item?.customerId === customerDetails?.customerId && item?.stationId === customerDetails?.stationId
        ) || null;
        setValue('billingCustomer', selectedStation);
        
        if (customerDetails?.airportPickupService === 'Y') {
            const selectedAirline = shipperAirlineDropdown?.find(
                (item) => item?.airlineId === customerDetails?.pickupAirlineDetails?.airlineId
            ) || null;
            setValue('shipperName', selectedAirline);
            
        }
        else if (customerDetails?.airportPickupService === 'N') {
            const selectedShipper = shipperDropdown?.find(
                (item) => item?.shipperId === customerDetails?.shipperDetails?.shipperId
            ) || null;
            setValue('shipperName', selectedShipper);
           
        }
        if (customerDetails?.airportDeliveryService === 'Y') {
            const selectedAirline = consigneeAirlineDropdown?.find(
                (item) => item?.airlineId === customerDetails?.deliveryAirlineDetails?.airlineId
            ) || null;
            setValue('consigneeName', selectedAirline);
            
        }
        else if (customerDetails?.airportDeliveryService === 'N') {
            const selectedConsignee = consigneeDropdown?.find(
                (item) => item?.consigneeId === customerDetails?.consigneeDetails?.consigneeId
            ) || null;
            setValue('consigneeName', selectedConsignee);
           
        }
    }
};


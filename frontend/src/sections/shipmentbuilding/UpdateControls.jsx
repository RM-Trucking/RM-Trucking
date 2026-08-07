import {
    getPickupAccessorials,
    getLinehaulAccessorials,
    getDeliveryAccessorials,
    getAccessorialDropdown,
    getStationAccessorialData,
    getZipToZipCarrierPickupRate,
    getZipToZipCarrierLinehaulRate,
    getZipToZipCarrierDeliveryRate, setError, setOperationalMessage,

} from '../../redux/slices/shipment';

export const updateControls = (dispatch, setValue, selectedObj,
    customerStationDropdown, shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown,
    carrierTerminalDropdown,
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
    // step 3
    if (commodityDetails && Object.keys(commodityDetails).length > 0) {
        setValue('emergencyContactName', commodityDetails?.emergencyContactName);
        setValue('emergencyContactPhone', commodityDetails?.emergencyContactPhone);
        setValue('emergencyContactPhone', commodityDetails?.emergencyContactPhone);
        const mappedHandlingUnits = (commodityDetails?.handlingUnits || []).map((hu, huIndex) => ({
            id: Date.now() + huIndex, // Added unique ID for key tracking
            uom: hu.handlingUnitUOM || '',
            unitsCount: hu.handlingUnits || '',
            unit: hu.unit || 'in',
            length: hu.handlingLength || '',
            width: hu.handlingWidth || '',
            height: hu.handlingHeight || '',
            weight: hu.handlingWeight || '',
            weightUnit: (hu.handlingWeightUnit).toLowerCase() === 'lb' ? 'lbs' : (hu.handlingWeightUnit).toLowerCase() === 'kg' ? 'kgs' : '',
            class: hu.class || '',
            calculatedFC: '',
            freightClass: ['50', '55', '60', '65', '70', '85', '92.5', '100', '125', '175', '250', '300', '400'],
            items: (hu.palletDetails || []).map((pallet, pIndex) => ({
                id: Date.now() + huIndex + pIndex + 1000, // Added unique ID for nested items
                pieces: pallet.pieces || '',
                piecesUom: pallet.piecesUOM || '',
                description: pallet.description || '',
                hazmatInfo: pallet.hazmat === 'Y',
                // Optional: spread hazmatDetails if your form schema tracks them at this level
                hazmatData: (pallet.hazmatDetails && {
                    unNumber: pallet.hazmatDetails.unNumber || '',
                    shippingName: pallet.hazmatDetails.properShippingName || '',
                    hazmatClass: pallet.hazmatDetails.hazardClass || '',
                    packagingGroup: pallet.hazmatDetails.packingGroup || '',
                    weight: pallet.hazmatDetails.weight || '',
                    weightUnit: pallet.hazmatDetails.weightUnit || 'lbs',
                    technicalName: pallet.hazmatDetails.technicalName || '',
                    contactPhone: pallet.hazmatDetails.contactPhoneNumber || '',
                    description: pallet.hazmatDetails.hazmatDescription || '',
                    limitedQuality: pallet.hazmatDetails.limitedQuantity === 'Y',
                    marinePollutant: pallet.hazmatDetails.marinePollutant === 'Y',
                    residueLastContained: pallet.hazmatDetails.residueLastContained === 'Y',
                    reportableQuantity: pallet.hazmatDetails.reportableQuantity === 'Y',
                    dotExemption: pallet.hazmatDetails.dotExemption === 'Y'
                })
            }))
        }));

        setValue('handlingUnits', mappedHandlingUnits, {
            shouldValidate: true,
            shouldDirty: true
        });

    }
    // step 4
    if (pickupDetails && Object.keys(pickupDetails).length > 0) {
        setValue('carrierInfo.orderReceivedPending', shipmentDetails?.orderReceivedPickupPending === 'Y');
        setValue('carrierInfo.airportTransfer', pickupDetails?.airportTransfer === 'Y');
        setValue('carrierInfo.pickupAgentTerminal', pickupDetails?.pickupAgentTerminal === 'Y');
        setValue('carrierInfo.toLocationType', pickupDetails?.pickupAgentTerminalDetails?.toLocationType);
        setValue('carrierInfo.addPickupAccessorial', pickupDetails?.pickupAccessorial === 'Y');
        setValue('carrierInfo.pickupAlert', pickupDetails?.pickupAlert === 'Y');
        setValue('carrierInfo.selectRouting', pickupDetails?.pickupRouting === 'PICKUP_ONLY' ? 'pickup_only' : pickupDetails?.pickupRouting === 'PICKUP_LINE_HAUL' ? 'pickup_linehaul' : 'pickup_linehaul_delivery');
        const updatedAccessorials = (pickupDetails?.pickupAccessorialDetails?.accessorials || []).map((item) => ({
            ...item,
            isManual: false,
            selected: true
        }));

        setValue('carrierInfo.pickupAccessorials', updatedAccessorials);
        setValue('carrierInfo.pickupAlertDetails.pickupNotes', pickupDetails?.pickupAlertDetails?.inboundNotes);
        setValue('carrierInfo.pickupAlertDetails.primaryEmail', pickupDetails?.pickupAlertDetails?.emailInfo?.primaryEmail);
        setValue('carrierInfo.pickupAlertDetails.additionalEmailsArray', pickupDetails?.pickupAlertDetails?.emailInfo?.additionalEmails);
        setValue('carrierInfo.manualToAddress.line1', pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails?.addressLine1);
        setValue('carrierInfo.manualToAddress.line2', pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails?.addressLine2);
        setValue('carrierInfo.manualToAddress.city', pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails?.city);
        setValue('carrierInfo.manualToAddress.state', pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails?.state);
        setValue('carrierInfo.manualToAddress.zip', pickupDetails?.pickupAgentTerminalDetails?.editToLocationDetails?.zipCode);
    }
    if (linehaulDetails && Object.keys(linehaulDetails).length > 0) {
        setValue('carrierInfo.lineHaul.selectRouting', linehaulDetails?.linehaulPrimaryInfo?.linehaulRouting?.toLowerCase() === 'line_haul_only' ? 'linehaul_only' : 'linehaul_delivery');
        setValue('carrierInfo.lineHaul.billNumber', linehaulDetails?.linehaulPrimaryInfo?.carrierBillNumber);
        setValue('carrierInfo.lineHaul.toLocationType', linehaulDetails?.linehaulPrimaryInfo?.toLocationType);
        setValue('carrierInfo.lineHaul.fromLocation', linehaulDetails?.linehaulPrimaryInfo?.fromLocationType);
        setValue('carrierInfo.lineHaul.etaDate', linehaulDetails?.linehaulPrimaryInfo?.etaDate);
        setValue('carrierInfo.lineHaul.etaTime', linehaulDetails?.linehaulPrimaryInfo?.etaTime);
        setValue('carrierInfo.lineHaul.pcs', linehaulDetails?.linehaulPrimaryInfo?.pieces);
        setValue('carrierInfo.lineHaul.weight', linehaulDetails?.linehaulPrimaryInfo?.weight);
        setValue('carrierInfo.lineHaul.linehaulAddAcc', linehaulDetails?.linehaulCommonInfo?.linehaulAccessorial === 'Y');
        const updatedAccessorials = (linehaulDetails?.linehaulCommonInfo?.linehaulAccessorialDetails?.accessorials || []).map((item) => ({
            ...item,
            isManual: false,
            selected: true
        }));
        setValue('carrierInfo.lineHaul.linehaulAccessorials', updatedAccessorials);
        setValue('carrierInfo.lineHaul.lineHaulNotes', linehaulDetails?.linehaulCommonInfo?.linehaulNotes);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.line1', linehaulDetails?.linehaulPrimaryInfo?.editFromLocationDetails?.addressLine1);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.line2', linehaulDetails?.linehaulPrimaryInfo?.editFromLocationDetails?.line2);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.city', linehaulDetails?.linehaulPrimaryInfo?.editFromLocationDetails?.city);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.state', linehaulDetails?.linehaulPrimaryInfo?.editFromLocationDetails?.state);
        setValue('carrierInfo.lineHaul.manualFromLocationDetails.zip', linehaulDetails?.linehaulPrimaryInfo?.editFromLocationDetails?.zipCode);

        setValue('carrierInfo.lineHaul.manualToLocationDetails.line1', linehaulDetails?.linehaulPrimaryInfo?.editToLocationDetails?.addressLine1);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.line2', linehaulDetails?.linehaulPrimaryInfo?.editToLocationDetails?.line2);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.city', linehaulDetails?.linehaulPrimaryInfo?.editToLocationDetails?.city);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.state', linehaulDetails?.linehaulPrimaryInfo?.editToLocationDetails?.state);
        setValue('carrierInfo.lineHaul.manualToLocationDetails.zip', linehaulDetails?.linehaulPrimaryInfo?.editToLocationDetails?.zipCode);
    }
    if (deliveryDetails && Object.keys(deliveryDetails).length > 0) {
        setValue('carrierInfo.deliveryDetails.billNumber', deliveryDetails?.deliveryPrimaryInfo?.carrierBillNumber);
        setValue('carrierInfo.deliveryDetails.toLocationType', deliveryDetails?.deliveryPrimaryInfo?.toLocationType);
        setValue('carrierInfo.deliveryDetails.fromLocation', deliveryDetails?.deliveryPrimaryInfo?.fromLocationType);
        setValue('carrierInfo.deliveryDetails.etaDate', deliveryDetails?.deliveryPrimaryInfo?.etaDate);
        setValue('carrierInfo.deliveryDetails.etaTime', deliveryDetails?.deliveryPrimaryInfo?.etaTime);
        setValue('carrierInfo.deliveryDetails.pcs', deliveryDetails?.deliveryPrimaryInfo?.pieces);
        setValue('carrierInfo.deliveryDetails.weight', deliveryDetails?.deliveryPrimaryInfo?.weight);
        setValue('carrierInfo.deliveryDetails.deliveryAddAcc', deliveryDetails?.deliveryCommonInfo?.deliveryAccessorial === 'Y');
        setValue('carrierInfo.deliveryDetails.deliveryAlert', deliveryDetails?.deliveryCommonInfo?.deliveryAlert === 'Y');
        const updatedAccessorials = (deliveryDetails?.deliveryCommonInfo?.deliveryAccessorialDetails?.accessorials || []).map((item) => ({
            ...item,
            isManual: false,
            selected: true
        }));
        setValue('carrierInfo.deliveryDetails.deliveryAccessorials', updatedAccessorials);
        setValue('carrierInfo.deliveryDetails.lineHaulNotes', deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.linehaulNotes);
        setValue('carrierInfo.deliveryDetails.deliveryNotes', deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.deliveryNotes);
        setValue('carrierInfo.deliveryDetails.primaryEmail', deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.emailInfo?.primaryEmail);
        setValue('carrierInfo.deliveryDetails.additionalEmail', deliveryDetails?.deliveryCommonInfo?.deliveryAlertDetails?.emailInfo?.additionalEmails);
        setValue('carrierInfo.deliveryDetails.airportTransfer', deliveryDetails?.deliveryCommonInfo?.airportTransfer);

        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line1', deliveryDetails?.deliveryPrimaryInfo?.editFromLocationDetails?.addressLine1);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.line2', deliveryDetails?.deliveryPrimaryInfo?.editFromLocationDetails?.line2);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.city', deliveryDetails?.deliveryPrimaryInfo?.editFromLocationDetails?.city);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.state', deliveryDetails?.deliveryPrimaryInfo?.editFromLocationDetails?.state);
        setValue('carrierInfo.deliveryDetails.manualFromLocationDetails.zip', deliveryDetails?.deliveryPrimaryInfo?.editFromLocationDetails?.zipCode);

        setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line1', deliveryDetails?.deliveryPrimaryInfo?.editToLocationDetails?.addressLine1);
        setValue('carrierInfo.deliveryDetails.manualToLocationDetails.line2', deliveryDetails?.deliveryPrimaryInfo?.editToLocationDetails?.line2);
        setValue('carrierInfo.deliveryDetails.manualToLocationDetails.city', deliveryDetails?.deliveryPrimaryInfo?.editToLocationDetails?.city);
        setValue('carrierInfo.deliveryDetails.manualToLocationDetails.state', deliveryDetails?.deliveryPrimaryInfo?.editToLocationDetails?.state);
        setValue('carrierInfo.deliveryDetails.manualToLocationDetails.zip', deliveryDetails?.deliveryPrimaryInfo?.editToLocationDetails?.zipCode);
    }
    // step 5
    if (carrierRateDetails && Object.keys(carrierRateDetails).length > 0) {
        setValue('carrierRates.pickUp.pickUpCarrier', pickupDetails?.carrierName);
        setValue('carrierRates.lineHaul.lineHaulCarrier', linehaulDetails?.linehaulPrimaryInfo?.carrierName);
        setValue('carrierRates.delivery.deliveryCarrier', deliveryDetails?.deliveryPrimaryInfo?.carrierName);

        setValue('carrierRates.pickUp.invoiceNo', carrierRateDetails?.pickupRateDetails?.invoiceNumber);
        setValue('carrierRates.lineHaul.invoiceNo', carrierRateDetails?.linehaulRateDetails?.invoiceNumber);
        setValue('carrierRates.delivery.invoiceNo', carrierRateDetails?.deliveryRateDetails?.invoiceNumber);

        // rate details
        const updatedPickupRates = (carrierRateDetails?.pickupRateDetails?.rateDetails || []).map((item) => ({
            ...item,
            chargeType: item.rateType,
            chargeValue: item.rateValue,
            apiCharges: item.rateValue,
            input: item.multiplicationFactor,
            isManual: false,
            selected: true,
        }));
        const targetPickupZiptozipRate = updatedPickupRates.find((item) => item?.rateType === 'Zip to Zip') || null;
        const filteredPickupRates = updatedPickupRates.filter((item) => item?.rateType !== 'Zip to Zip');
        setValue('carrierRates.pickUp.pickUpRate', targetPickupZiptozipRate?.rateValue);
        setValue('carrierRates.pickUp.pickupAccessorials', filteredPickupRates);

        const updatedLinehaulRates = (carrierRateDetails?.linehaulRateDetails?.rateDetails || []).map((item) => ({
            ...item,
            chargeType: item.rateType,
            chargeValue: item.rateValue,
            apiCharges: item.rateValue,
            input: item.multiplicationFactor,
            isManual: false,
            selected: true,
        }));
        const targetLinehaulZiptozipRate = updatedLinehaulRates.find((item) => item?.rateType === 'Zip to Zip') || null;
        const filteredLinehaulRates = updatedLinehaulRates.filter((item) => item?.rateType !== 'Zip to Zip');
        setValue('carrierRates.lineHaul.lineHaulRate', targetLinehaulZiptozipRate?.rateValue);
        setValue('carrierRates.lineHaul.lineHaulAccessorials', filteredLinehaulRates);

        const updatedDeliveryRates = (carrierRateDetails?.deliveryRateDetails?.rateDetails || []).map((item) => ({
            ...item,
            chargeType: item.rateType,
            chargeValue: item.rateValue,
            apiCharges: item.rateValue,
            input: item.multiplicationFactor,
            isManual: false,
            selected: true,
        }));
        const targetDeliveryZiptozipRate = updatedDeliveryRates.find((item) => item?.rateType === 'Zip to Zip') || null;
        const filteredDeliveryRates = updatedDeliveryRates.filter((item) => item?.rateType !== 'Zip to Zip');
        setValue('carrierRates.delivery.deliveryRate', targetDeliveryZiptozipRate?.rateValue);
        setValue('carrierRates.delivery.deliveryAccessorials', filteredDeliveryRates);

    }
    if (customerRateDetails && Object.keys(customerRateDetails).length > 0) {
        // rate detials
        const updatedCustomerRates = (customerRateDetails?.rateDetails || []).map((item) => ({
            ...item,
            chargeType: item.rateType,
            chargeValue: item.rateValue,
            apiCharges: item.rateValue,
            input: item.multiplicationFactor,
            isManual: false,
            selected: true,
        }));
        const targetCustomerRate = updatedCustomerRates.find((item) => item?.rateType === 'Rate') || null;
        const targetCustomerFuelRate = updatedCustomerRates.find((item) => item?.rateType === 'Fuel Surcharge (35% charge)') || null;
        const filteredCustomerRates = updatedCustomerRates.filter((item) => (item?.rateType !== 'Rate' && item?.rateType !== 'Fuel Surcharge (35% charge)'));
        setValue('customerRate.rate', targetCustomerRate?.rateValue);
        setValue('customerRate.fuelSurchargeRate', targetCustomerFuelRate?.rateValue);
        setValue('customerRate.customerAccessorials', filteredCustomerRates);
    }

};
export const updateStep2Controls = (dispatch, setValue, selectedObj,
    customerStationDropdown, shipperDropdown, shipperAirlineDropdown, consigneeDropdown, consigneeAirlineDropdown,
    carrierTerminalDropdown
) => {
    const customerDetails = selectedObj?.customerDetails;
    const pickupDetails = selectedObj?.carrierDetails?.pickupDetails;
    const linehaulDetails = selectedObj?.carrierDetails?.linehaulDetails;
    const deliveryDetails = selectedObj?.carrierDetails?.deliveryDetails;
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
    // step 4
    if (carrierTerminalDropdown?.length > 0) {
        const selectedPickupFromTerminal = carrierTerminalDropdown?.find(
            (item) => item?.carrierId === pickupDetails?.carrierId && item?.terminalId === pickupDetails?.terminalId
        ) || null;
        // have to call api for accessorials, call for rates (taken care on handle next)
        if (selectedPickupFromTerminal?.terminalEntityId) {
            dispatch(getPickupAccessorials(selectedPickupFromTerminal?.terminalEntityId));
        }
        setValue('carrierInfo.selectCarrier', `${selectedPickupFromTerminal?.terminalId}-${selectedPickupFromTerminal?.carrierId}`);
        const selectedPickupToTerminal = carrierTerminalDropdown?.find(
            (item) => item?.terminalEntityId === pickupDetails?.toLocationEntityId
        ) || null;
        setValue('carrierInfo.toLocation', `${selectedPickupToTerminal?.terminalId}-${selectedPickupToTerminal?.carrierId}`);

        // linehaul
        const selectedLinehaulFromTerminal = carrierTerminalDropdown?.find(
            (item) => item?.carrierId === linehaulDetails?.linehaulPrimaryInfo?.carrierId && item?.terminalId === linehaulDetails?.linehaulPrimaryInfo?.terminalId
        ) || null;
        if (selectedLinehaulFromTerminal?.terminalEntityId) {
            dispatch(getLinehaulAccessorials(selectedLinehaulFromTerminal?.terminalEntityId));
        }
        setValue('carrierInfo.lineHaul.carrier', `${selectedLinehaulFromTerminal?.terminalId}-${selectedLinehaulFromTerminal?.carrierId}`);
        const selectedLinehaulToTerminal = carrierTerminalDropdown?.find(
            (item) => item?.terminalEntityId === linehaulDetails?.linehaulPrimaryInfo?.toLocationEntityId
        ) || null;
        setValue('carrierInfo.lineHaul.toLocation', `${selectedLinehaulToTerminal?.terminalId}-${selectedLinehaulToTerminal?.carrierId}`);

        // delivery
        const selectedDeliveryFromTerminal = carrierTerminalDropdown?.find(
            (item) => item?.carrierId === deliveryDetails?.deliveryPrimaryInfo?.carrierId && item?.terminalId === deliveryDetails?.deliveryPrimaryInfo?.terminalId
        ) || null;
        if (selectedDeliveryFromTerminal?.terminalEntityId) {
            dispatch(getDeliveryAccessorials(selectedDeliveryFromTerminal?.terminalEntityId));
        }
        setValue('carrierInfo.deliveryDetails.carrier', `${selectedDeliveryFromTerminal?.terminalId}-${selectedDeliveryFromTerminal?.carrierId}`);
        const selectedDeliveryToTerminal = carrierTerminalDropdown?.find(
            (item) => item?.terminalEntityId === deliveryDetails?.deliveryPrimaryInfo?.toLocationEntityId
        ) || null;
        setValue('carrierInfo.deliveryDetails.toLocation', `${selectedDeliveryToTerminal?.terminalId}-${selectedDeliveryToTerminal?.carrierId}`);
    }
};


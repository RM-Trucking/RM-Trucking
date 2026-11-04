export const handleConsolidatedNext = async (dispatch, setValue, getValues, trigger, errors,
    activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
    selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
    carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
    setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, totals,
    watchedLinehaulAddAcc, type, selectedShipmentBuildObj, patchNetworkShipment, getZipToZipCustomerRate, consolidatedFilterObj, replaceSelectedLinehaulDetailsList,
    watchedCRLinehaulAccessorials, totalConsolWeight, selectedShipmentObjects, selectedLinehaulDetailsList
) => {

    setActiveStep((prev) => prev + 1);
};
// Helper 1: Extract routing fields logic for step 3
const getRoutingFields = (routing, linehaulRouting) => {
    const base = ['carrierInfo.selectCarrier', 'carrierInfo.fromLocation', 'carrierInfo.billNumber'];

    if (routing === 'pickup_only' && linehaulRouting === 'linehaul_only') {
        return [
            ...base,
            'carrierInfo.lineHaul.carrier', 'carrierInfo.lineHaul.billNumber',
            'carrierInfo.lineHaul.toLocationType', 'carrierInfo.lineHaul.toLocation',
            'carrierInfo.deliveryDetails.carrier', 'carrierInfo.deliveryDetails.billNumber',
            'carrierInfo.deliveryDetails.toLocationType',
        ];
    }
    if (routing === 'pickup_only' && linehaulRouting === 'linehaul_delivery') {
        return [
            ...base,
            'carrierInfo.lineHaul.carrier', 'carrierInfo.lineHaul.billNumber',
            'carrierInfo.lineHaul.toLocationType', 'carrierInfo.lineHaul.toLocation',
        ];
    }
    if (routing === 'pickup_linehaul') {
        return [
            ...base,
            'carrierInfo.deliveryDetails.carrier', 'carrierInfo.deliveryDetails.billNumber',
            'carrierInfo.deliveryDetails.toLocationType',
        ];
    }
    return base;
};

// Helper 2: Validate handling units array structure for step 2
// Helper 2: Validate handling units array structure for step 2
const validateHandlingUnits = (units) => {
    if (!Array.isArray(units) || units.length === 0) {
        return { isValid: false, reason: 'Handling Units - Array Empty' };
    }

    for (const unit of units) {
        // 1. Top-Level Unit Field Checks
        if (!unit?.uom?.trim()) {
            return { isValid: false, reason: 'Handling Units - UOM' };
        }
        if (!unit?.unitsCount?.toString().trim()) {
            return { isValid: false, reason: 'Handling Units - Units' };
        }

        if (!Array.isArray(unit?.items) || unit.items.length === 0) {
            return { isValid: false, reason: 'Handling Unit Items - Array Empty' };
        }

        for (const item of unit.items) {
            // 2. Base Item Field Checks
            if (!item?.pieces?.toString().trim()) {
                return { isValid: false, reason: 'Handling Unit Items - Pieces' };
            }
            if (!item?.piecesUom?.trim()) {
                return { isValid: false, reason: 'Handling Unit Items - Pieces Uom' };
            }
            if (!item?.description?.trim()) {
                return { isValid: false, reason: 'Handling Unit Items - Description' };
            }

            // 3. Hazmat Sub-Field Checks
            if (item?.hazmatInfo === true) {
                const hazmat = item?.hazmatData;

                if (!hazmat?.unNumber?.trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - UN Number' };
                }
                if (!hazmat?.shippingName?.trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - Shipping Name' };
                }
                if (!hazmat?.packagingGroup?.trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - Packaging Group' };
                }
                if (!hazmat?.hazmatClass?.trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - Hazmat Class' };
                }
                if (!hazmat?.weight?.toString().trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - Weight' };
                }
                if (!hazmat?.contactPhone?.trim()) {
                    return { isValid: false, reason: 'Hazmat Info Details - Contact Phone' };
                }
            }
        }
    }
    return { isValid: true, reason: null };
};

export const hasInitialData = (getValues) => {
    const values = getValues();

    // Check if contact info is filled
    const hasContactInfo = !!(values.emergencyContactName || values.emergencyContactPhone);

    // Check if handling units have been modified (e.g., checking if description exists)
    // or simply if the array is not empty/has more than 1 item
    const hasHandlingData = values.handlingUnits?.some(unit =>
        unit.items?.[0]?.description !== '' || // user changed default
        unit.weight !== ''
    );

    return hasContactInfo || hasHandlingData;
};

export const getValidReferenceNumbers = (rows) => {
    return rows
        ?.filter(obj =>
            !Object.values(obj).some(val => typeof val === 'string' ? val.trim() === '' : val === '')
        )
        ?.map(({ id, ...rest }) => rest) || [];
};

export const onFormEditSubmit = async (dispatch, setValue, getValues, trigger, errors,
    activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
    selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
    carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
    setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending,
    selectedShipmentBuildObj, patchNetworkShipment) => {
    // Your API call here
    const currentValues = getValues();
    const missingRequiredFields = [];
    let valid = false;
    const obj = {};
    // adding to object - step 0
    obj.shipmentDetails = {
        "shipmentId": selectedShipmentBuildObj?.shipmentId,
        "typeOfShipment": currentValues.shipmentType,
        "serviceLevel": currentValues.serviceLevel,
        "shipmentDate": currentValues.date
            ? new Date(currentValues.date).toLocaleDateString('en-CA')
            : "",
        "shipmentTime": currentValues.time
            ? new Date(currentValues.time).toLocaleTimeString('en-US', { hour12: false })
            : "",
        "orderReceivedPickupPending": currentValues?.carrierInfo?.orderReceivedPending ? "Y" : "N",
        "status": currentValues?.carrierInfo?.orderReceivedPending ? "ORDER_RECEIVED_PICKUP_PENDING" : "ORDER_RECEIVED_PICKUP_SETUP",
    };
    // step 1
    obj.customerDetails = {
        "customerInfoId": selectedShipmentBuildObj?.customerDetails?.customerInfoId,
        "customerId": currentValues.billingCustomer.customerId,
        "stationId": currentValues.billingCustomer.stationId,
        "airportPickupService": watchedAirportPickupService ? "Y" : "N",
        "airportDeliveryService": watchedAirportDeliveryService ? "Y" : "N",
        "originAirportCode": currentValues.originAirport,
        "destinationAirportCode": currentValues.destinationAirport,
        // we have to update address when we select shipper details
        "shipperDetails": {
            'shipperId': currentValues?.shipperName?.shipperId || null,
            "shipperName": currentValues?.shipperName?.shipperName,
            "addressLine1": currentValues.shipperAddr1,
            "addressLine2": currentValues.shipperAddr2,
            "city": currentValues.shipperCity,
            "state": currentValues.shipperState,
            "zipCode": currentValues.shipperZip,
            "contactPersonName": currentValues.shipperContact,
            "phoneNumber": currentValues.shipperPhone,
            'entityId': currentValues?.shipperName?.entityId || null,
        },
        "pickupAirlineDetails": {
            "airlineId": currentValues?.shipperName?.shipperId || currentValues?.shipperName?.airlineId || null,
            "airlineNumber": Number(currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.shipperName?.airlineNumber) || null,
            "airlineCode": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.shipperName?.airlineCode || '',
            "airportCode": currentValues?.shipperName?.airportCode || watchedOriginAirport,
            "airlineName": currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.shipperName?.airlineName || '',
            "addressLine1": currentValues?.shipperAddr1,
            "addressLine2": currentValues?.shipperAddr2,
            "city": currentValues.shipperCity,
            "state": currentValues.shipperState,
            "zipCode": currentValues.shipperZip,
            "contactPersonName": currentValues?.shipperContact,
            "phoneNumber": currentValues.shipperPhone,
            "handler": '',
            'entityId': currentValues?.shipperName?.entityId || null,
            "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
        },
        "consigneeDetails": {
            "consigneeId": currentValues?.consigneeName?.consigneeId || null,
            "consigneeName": currentValues?.consigneeName?.consigneeName,
            "addressLine1": currentValues.consigneeAddr1,
            "addressLine2": currentValues.consigneeAddr2,
            "city": currentValues.consigneeCity,
            "state": currentValues.consigneeState,
            "zipCode": currentValues.consigneeZip,
            "contactPersonName": currentValues.consigneeContact,
            "phoneNumber": currentValues.consigneePhone,
            'entityId': currentValues?.consigneeName?.entityId || null,
        },
        "deliveryAirlineDetails": {
            "airlineId": currentValues?.consigneeName?.consigneeId || currentValues?.consigneeName?.airlineId || null,
            "airlineNumber": Number(currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[0]) || Number(currentValues?.consigneeName?.airlineNumber) || '',
            "airlineCode": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[1] || currentValues?.consigneeName?.airlineCode || '',
            "airportCode": currentValues?.consigneeName?.airportCode || watchedDestinationAirport,
            "airlineName": currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "addressLine1": currentValues.consigneeAddr1,
            "addressLine2": currentValues.consigneeAddr2,
            "city": currentValues.consigneeCity,
            "state": currentValues.consigneeState,
            "zipCode": currentValues.consigneeZip,
            "contactPersonName": currentValues?.consigneeContact,
            "phoneNumber": currentValues.consigneePhone,
            "handler": '',
            'entityId': currentValues?.consigneeName?.entityId || null,
            "scenarioType": (currentValues?.shipmentType?.includes('IMPORT') || currentValues?.shipmentType?.includes('DOMESTIC')) ? 'IMPORT' : (currentValues?.shipmentType?.includes('EXPORT') || currentValues?.shipmentType?.includes('NON_FORWARDER_DOMESTIC')) ? 'EXPORT' : "",
        },
        "customerReferenceNumbers": getValidReferenceNumbers(currentValues?.referenceTableRows),
    };
    if (watchedAirportPickupService) {
        delete obj.customerDetails.shipperDetails;
    } else {
        delete obj.customerDetails.pickupAirlineDetails;
    }

    if (watchedAirportDeliveryService) {
        delete obj.customerDetails.consigneeDetails;
    } else {
        delete obj.customerDetails.deliveryAirlineDetails;
    }

    // step 2
    if (currentValues?.handlingUnits?.length > 0 && currentValues?.handlingUnits[0]?.uom) {
        obj.commodityDetails = {
            emergencyContactName: isHazmatSelected ? currentValues?.emergencyContactName : '',
            emergencyContactPhone: isHazmatSelected ? currentValues?.emergencyContactPhone : '',
            handlingUnits: currentValues?.handlingUnits.map(hu => ({
                handlingUnitUOM: hu.uom,
                handlingUnits: Number(hu.unitsCount) || 0, // Ensures it maps to a number
                unit: hu.unit,
                handlingLength: Number(hu.length) || 0,
                handlingWidth: Number(hu.width) || 0,
                handlingHeight: Number(hu.height) || 0,
                handlingWeight: Number(hu.weight) || 0,
                handlingWeightUnit: hu.weightUnit === 'lbs' ? 'LB' : hu.weightUnit === 'kgs' ? 'KG' : '', // Standardizes 'lbs' to 'LB'
                class: hu.class ? `Class ${hu.class}` : '', // Formats class number to "Class X"
                palletDetails: hu?.items?.map(item => ({
                    pieces: Number(item?.pieces) || 0,
                    piecesUOM: item?.piecesUom,
                    description: item?.description,
                    hazmat: item?.hazmatInfo ? 'Y' : 'N',
                    hazmatDetails: item?.hazmatInfo ? {
                        unNumber: item?.hazmatData?.unNumber,
                        properShippingName: item?.hazmatData?.shippingName,
                        hazardClass: `Class ${item?.hazmatData?.hazmatClass}`,
                        packingGroup: `${item?.hazmatData?.packagingGroup}`,
                        weight: Number(item?.hazmatData?.weight) || 0,
                        weightUnit: item?.hazmatData?.weightUnit,
                        technicalName: item?.hazmatData?.technicalName,
                        contactPhoneNumber: item?.hazmatData?.contactPhone,
                        hazmatDescription: item?.hazmatData?.description,
                        // Converts boolean values to API's expected "Y" / "N" string flags
                        limitedQuantity: item?.hazmatData?.limitedQuality ? "Y" : "N",
                        marinePollutant: item?.hazmatData?.marinePollutant ? "Y" : "N",
                        residueLastContained: item?.hazmatData?.residueLastContained ? "Y" : "N",
                        reportableQuantity: item?.hazmatData?.reportableQuantity ? "Y" : "N",
                        dotExemption: item?.hazmatData?.dotExemption ? "Y" : "N"
                    } : null
                }))
            }))
        };
    }

    // step 3
    console.log(selectedRouting, watchedLinehaulSelectRouting);
    const [pickupTerminalId, pickupCarrierId] = watchedSelectedPickupCarrier.split('-');
    const [pickupToLocTerminalId, pickupToLocCarrierId] = watchedToLocation.split('-');
    // From Location
    const selectedPickupCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(pickupTerminalId) && item.carrierId === Number(pickupCarrierId)
    );
    // To Location
    const selectedPickupToCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(pickupToLocTerminalId) && item.carrierId === Number(pickupToLocCarrierId)
    );
    if (isPickupPending) {
        setIsSubmitting(true);
        try {
            // 2. Execute your API call
            // await dispatch(postStep1(obj));
            await dispatch(patchNetworkShipment(selectedShipmentBuildObj?.shipmentId, obj));
        } catch (error) {
            console.error("Submission failed:", error);
            setIsSubmitting(false);
        }
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === '' && watchedSelectedPickupCarrier && !isPickupPending) {
        if (selectedPickupCarrierObject === undefined) {
            valid = false;
            missingRequiredFields.push('Pickup Select Carrier');
        } else {
            valid = true;
        }
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
            if (currentValues?.carrierInfo?.toLocationType && currentValues?.carrierInfo.toLocation) {
                valid = true;
            } else {
                valid = false;
                missingRequiredFields.push('Pickup Location Type', 'Pickup To Location');
            }
        }
        if (currentValues?.carrierInfo?.billNumber) {
            valid = true;
        } else {
            valid = false;
            missingRequiredFields.push('Pickup Bill Number');
        }
        if (currentValues?.carrierInfo?.pickupAlert) {
            if (currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes && currentValues?.carrierInfo?.pickupAlertDetails?.primaryEmail) {
                valid = true;
            } else {
                valid = false;
                missingRequiredFields.push('Pickup Notes', 'Pickup Primary Email');
            }
        }
        if (currentValues?.carrierInfo?.addPickupAccessorial && currentValues?.carrierInfo?.pickupAccessorials?.length === 0) {
            valid = false;
            missingRequiredFields.push('Pickup Accessorials');
        } else {
            valid = true;
        }
        if (valid && missingRequiredFields.length === 0) {
            setErrorVisible(false);
            obj.carrierDetails = {

                "pickupDetails": {
                    "pickupRouting": "PICKUP_ONLY",
                    "fromLocationType": "Shipper",
                    "fromLocation": currentValues?.carrierInfo?.fromLocation,
                    "carrierBillNumber": currentValues?.carrierInfo?.billNumber,
                    "fromLocationEntityId": currentValues?.shipperName?.entityId || null,
                    "airportTransfer": currentValues?.carrierInfo?.airportTransfer ? 'Y' : 'N',
                    "carrierId": Number(pickupCarrierId),
                    "terminalId": Number(pickupTerminalId),
                    "editFromLocation": currentValues?.carrierInfo?.isManualFromLocation ? "Y" : 'N',
                    "editFromLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.manualAddress?.line1,
                        "addressLine2": currentValues?.carrierInfo?.manualAddress?.line2,
                        "city": currentValues?.carrierInfo?.manualAddress?.city,
                        "state": currentValues?.carrierInfo?.manualAddress?.state,
                        "zipCode": currentValues?.carrierInfo?.manualAddress?.zip
                    },
                    "pickupAgentTerminal": currentValues?.carrierInfo?.pickupAgentTerminal ? "Y" : "N",
                    "pickupAgentTerminalDetails": {
                        "toLocationType": "Carrier",
                        "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject.carrierName : selectedPickupToCarrierObject.carrierName,
                        "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
                        "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
                        "editToLocationDetails": {
                            "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1 || selectedPickupCarrierObject?.address?.addressLine1,
                            "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2 || selectedPickupCarrierObject?.address?.addressLine2,
                            "city": currentValues?.carrierInfo?.manualToAddress?.city || selectedPickupCarrierObject?.address?.city,
                            "state": currentValues?.carrierInfo?.manualToAddress?.state || selectedPickupCarrierObject?.address?.state,
                            "zipCode": currentValues?.carrierInfo?.manualToAddress?.zip || selectedPickupCarrierObject?.address?.zipCode,
                        }
                    },
                    "pickupAccessorial": currentValues?.carrierInfo?.addPickupAccessorial ? "Y" : "N",
                    "pickupAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.pickupAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                            ...rest,
                            notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
                        })),
                    },
                    "pickupAlert": currentValues?.carrierInfo?.pickupAlert ? "Y" : 'N',
                    "pickupAlertDetails": {
                        "inboundNotes": currentValues?.carrierInfo?.pickupAlertDetails?.pickupNotes,
                        "emailInfo": {
                            "primaryEmail": currentValues?.carrierInfo?.pickupAlertDetails?.primaryEmail,
                            "additionalEmails": currentValues?.carrierInfo?.pickupAlertDetails?.additionalEmail,
                        }
                    }
                },
            }
            setIsSubmitting(true);
            try {
                // 2. Execute your API call
                // await dispatch(postStep1(obj));
                await dispatch(patchNetworkShipment(selectedShipmentBuildObj?.shipmentId, obj));
            } catch (error) {
                console.error("Submission failed:", error);
                setIsSubmitting(false);
            }
        } else {
            setErrorVisible(true);
            setErrorVisibleFields(missingRequiredFields);
        }
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting !== "") {
        setValue('carrierInfoSubmit', true);
    }
};
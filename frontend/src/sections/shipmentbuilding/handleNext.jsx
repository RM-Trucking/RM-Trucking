export const handleNext = async (dispatch, setValue, getValues, trigger, errors,
    activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
    selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
    carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
    setIsSubmittingFinal, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, totals,
    watchedLinehaulAddAcc, type
) => {
    const currentValues = getValues();
    let fieldsToValidate = [];
    let validReferenceTable = true;
    let validAccessorials = true;
    let obj = {};

    // Array to collect missing or invalid fields at the very end
    const missingRequiredFields = [];

    // 1. Step-based validation fields mapping
    if (activeStep === 0) {
        fieldsToValidate = ['shipmentType', 'serviceLevel'];
        if (watchedServiceLevel?.includes('(Date Specific)')) {
            fieldsToValidate.push('date', 'time');
        }
    } else if (activeStep === 1) {
        fieldsToValidate = [
            'billingCustomer', 'consigneeName', 'shipperName', 'shipperAddr1', 'shipperAddr2', 'shipperCity', 'shipperState',
            'shipperZip', 'shipperContact', 'shipperPhone', 'consigneeAddr1', 'consigneeAddr2', 'consigneeCity', 'consigneeState',
            'consigneeZip', 'consigneeContact', 'consigneePhone'];
        if (watchedAirportPickupService) {
            fieldsToValidate.push('originAirport');
        }
        if (watchedAirportDeliveryService) {
            fieldsToValidate.push('destinationAirport');
        }
        // check for reference number table with no values
        if (currentValues?.referenceTableRows?.length > 1) {
            const hasEmptyValue = currentValues?.referenceTableRows?.some(obj =>
                Object.values(obj).some(value => typeof value === 'string' ? value.trim() === '' : value === '')
            ) || false;
            if (hasEmptyValue) {
                validReferenceTable = false;
                fieldsToValidate.push('referenceTableRows');
                missingRequiredFields.push('Fill both Reference type and number');
            }
        }

    } else if (activeStep === 2 && isHazmatSelected) {
        fieldsToValidate = ['emergencyContactName', 'emergencyContactPhone'];
    } else if (activeStep === 3) {
        fieldsToValidate = getRoutingFields(selectedRouting, watchedLinehaulSelectRouting);

        // Add common carrier conditional fields
        const { carrierInfo } = currentValues || {};
        if (!carrierInfo?.pickupAgentTerminal) {
            fieldsToValidate.push('carrierInfo.toLocationType', 'carrierInfo.toLocation');
        }
        if (carrierInfo?.pickupAlert) {
            const isSpecialRouting = selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery';
            const prefix = isSpecialRouting ? 'carrierInfo.' : 'carrierInfo.pickupAlertDetails.';
            fieldsToValidate.push(`${prefix}pickupNotes`, `${prefix}primaryEmail`);
        }
        if (carrierInfo?.deliveryDetails?.carrier && carrierInfo?.deliveryDetails?.deliveryAlert && type !== 'View') {
            fieldsToValidate.push(
                'carrierInfo.deliveryDetails.lineHaulNotes',
                'carrierInfo.deliveryDetails.deliveryNotes',
                'carrierInfo.deliveryDetails.primaryEmail'
            );
        }

        // Accessorials cross-checking & manual error tracking
        if (carrierInfo?.addPickupAccessorial && carrierInfo?.pickupAccessorials?.length === 0) {
            validAccessorials = false;
            missingRequiredFields.push('Pickup Accessorials');
        }
        if (carrierInfo?.lineHaul?.linehaulAddAcc && carrierInfo?.lineHaul?.linehaulAccessorials?.length === 0) {
            validAccessorials = false;
            missingRequiredFields.push('Linehaul Accessorials');
        }
        if (carrierInfo?.deliveryDetails?.deliveryAddAcc && carrierInfo?.deliveryDetails?.deliveryAccessorials?.length === 0) {
            validAccessorials = false;
            missingRequiredFields.push('Delivery Accessorials');
        }
    }

    // 2. Validate handling units structure (Step 2 specific)

    const validationResult = validateHandlingUnits(getValues('handlingUnits'));

    if (activeStep === 2 && !validationResult.isValid) {
        missingRequiredFields.push(validationResult.reason);
        // This will push "Handling Units" OR "Hazmat Info Details" automatically
    }

    // 3. Form control execution block
    const isValid = await trigger(fieldsToValidate);

    // 4. Collect React Hook Form native errors if validation failed
    if (!isValid) {
        fieldsToValidate.forEach(fieldPath => {
            const hasError = fieldPath.split('.').reduce((obj, key) => obj?.[key], errors);
            const actualValue = getValues(fieldPath);

            // If RHF says it's invalid OR the value is blank/missing
            if (hasError || actualValue === undefined || actualValue === "" || actualValue === null) {
                const lastWord = fieldPath.split('.').pop();

                // 1. Format the field name (e.g., "billNumber" -> "Bill Number")
                const formattedWord = lastWord
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                // 2. Determine the contextual location prefix
                let prefix = "Pickup "; // Default fallback
                if (fieldPath.includes("carrierInfo.lineHaul.")) {
                    prefix = "Linehaul ";
                } else if (fieldPath.includes("carrierInfo.deliveryDetails.")) {
                    prefix = "Delivery ";
                }
                const finalPrefix = activeStep === 3 ? prefix : '';
                const readableWord = `${finalPrefix}${formattedWord}`;

                if (!missingRequiredFields.includes(readableWord)) {
                    missingRequiredFields.push(readableWord);
                }
            }
        });

    }

    // 5. Final evaluation block
    if (isValid && validAccessorials && validReferenceTable && (activeStep !== 2 || validationResult.isValid)) {
        setErrorVisible(false);
        if (activeStep < 4) {
            setActiveStep((prev) => prev + 1);
        }
    } else {
        setErrorVisible(true);

        // Output array containing all final required fields that failed
        console.log("Required fields missing or invalid:", missingRequiredFields);
        setErrorVisibleFields(missingRequiredFields);

        // Optional: Save this to a component state if you need to print it on screen
        // setFailedFields(missingRequiredFields);
    }
    // setting carrierInfoSubmit
    setValue('carrierInfoSubmit', false)

    // adding to object
    // step 0
    obj.shipmentDetails = {
        "typeOfShipment": currentValues?.shipmentType,
        "serviceLevel": currentValues?.serviceLevel,
        "shipmentDate": currentValues?.date
            ? new Date(currentValues.date).toLocaleDateString('en-CA')
            : "",
        "shipmentTime": currentValues.time,
        "orderReceivedPickupPending": currentValues?.carrierInfo?.orderReceivedPending ? "Y" : "N",
        "status": currentValues?.carrierInfo?.orderReceivedPending ? "ORDER_RECEIVED_PICKUP_PENDING" : "ORDER_RECEIVED_PICKUP_SETUP",
    };
    // step 1
    obj.customerDetails = {
        "customerId": currentValues.billingCustomer?.customerId,
        "stationId": currentValues.billingCustomer?.stationId,
        "airportPickupService": watchedAirportPickupService ? "Y" : "N",
        "airportDeliveryService": watchedAirportDeliveryService ? "Y" : "N",
        "originAirportCode": currentValues?.originAirport,
        "destinationAirportCode": currentValues?.destinationAirport,
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
                        hazardClass: `${item?.hazmatData?.hazmatClass}`,
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

    const [pickupTerminalId, pickupCarrierId] = typeof watchedSelectedPickupCarrier === 'string' ? watchedSelectedPickupCarrier.split('-') : [];
    const [linehaulTerminalId, linehaulCarrierId] = typeof watchedSelectedLineHaulCarrier === 'string' ? watchedSelectedLineHaulCarrier.split('-') : [];
    const [deliveryTerminalId, deliveryCarrierId] = typeof watchedSelectedDeliveryCarrier === 'string' ? watchedSelectedDeliveryCarrier.split('-') : [];

    const [pickupToLocTerminalId, pickupToLocCarrierId] = typeof watchedToLocation === 'string' ? watchedToLocation.split('-') : [];
    const [linehaulToLocTerminalId, linehaulToLocCarrierId] = typeof watchedLinehaulToLocation === 'string' ? watchedLinehaulToLocation.split('-') : [];
    const [deliveryToLocTerminalId, deliveryToLocCarrierId] = typeof watchedDeliveryToLocation === 'string' ? watchedDeliveryToLocation.split('-') : [];


    // From Location
    const selectedPickupCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(pickupTerminalId) && item.carrierId === Number(pickupCarrierId)
    );
    const selectedLinehaulCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(linehaulTerminalId) && item.carrierId === Number(linehaulCarrierId)
    );
    const selectedDeliveryCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(deliveryTerminalId) && item.carrierId === Number(deliveryCarrierId)
    );
    // To Location
    const selectedPickupToCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(pickupToLocTerminalId) && item.carrierId === Number(pickupToLocCarrierId)
    );
    const selectedLinehaulToCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(linehaulToLocTerminalId) && item.carrierId === Number(linehaulToLocCarrierId)
    );
    const selectedDeliveryToCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(deliveryToLocTerminalId) && item.carrierId === Number(deliveryToLocCarrierId)
    );

    if ((activeStep === 3 && isValid)) {
        const pickupFromZip = currentValues?.carrierInfo?.manualAddress?.zip;
        let pickupToZip = '';
        if (currentValues?.carrierInfo?.pickupAgentTerminal) {
            pickupToZip = selectedPickupCarrierObject?.address?.zipCode;
        } else {
            pickupToZip = currentValues?.carrierInfo?.manualToAddress?.zip
        }
        dispatch(getZipToZipCarrierPickupRate(pickupFromZip, pickupToZip, Number(totals.totalWeight), selectedPickupCarrierObject?.terminalId));

        const linehaulFromZip = currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip;
        const linehaulToZip = currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zip;
        dispatch(getZipToZipCarrierLinehaulRate(linehaulFromZip, linehaulToZip, Number(totals.totalWeight), selectedLinehaulCarrierObject?.terminalId))

        const deliveryFromZip = currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zip;
        const deliveryToZip = currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zip;
        dispatch(getZipToZipCarrierDeliveryRate(deliveryFromZip, deliveryToZip, Number(totals.totalWeight), selectedDeliveryCarrierObject?.terminalId));
    }

    if (selectedRouting === 'pickup_only') {
        // obj to send
        // when pickupAgentTerminal is Y no need of pickupAgentTerminalDetails
        obj.carrierDetails = {
            "pickupDetails": {
                "pickupRouting": "PICKUP_ONLY",
                "fromLocationType": "Shipper",
                "fromLocation": currentValues?.carrierInfo?.fromLocation,
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
                    "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
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
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only') {
        // obj to send
        // when pickupAgentTerminal is Y no need of pickupAgentTerminalDetails
        obj.carrierDetails = {

            "pickupDetails": {
                "pickupRouting": "PICKUP_ONLY",
                "fromLocationType": "Shipper",
                "fromLocation": currentValues?.carrierInfo?.fromLocation,
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
                    "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
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
            "linehaulDetails": {
                "linehaulPrimaryInfo": {
                    "linehaulRouting": "LINE_HAUL_ONLY",
                    "carrierId": Number(linehaulCarrierId),
                    "terminalId": Number(linehaulTerminalId),
                    "carrierBillNumber": currentValues?.carrierInfo?.lineHaul?.billNumber,
                    "fromLocationType": "Carrier",
                    "fromLocation": currentValues?.carrierInfo?.lineHaul?.fromLocation,
                    "fromLocationEntityId": selectedLinehaulCarrierObject?.terminalEntityId || null,
                    "toLocationType": "Carrier",
                    "toLocation": currentValues?.carrierInfo?.lineHaul?.toLocation,
                    // still to get
                    "toLocationEntityId": selectedLinehaulToCarrierObject?.terminalEntityId || null,
                    "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
                    "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
                    "pieces": Number(currentValues?.carrierInfo?.lineHaul?.pcs) || null,
                    'weight': Number(currentValues?.carrierInfo?.lineHaul?.weight) || null,
                    "editFromLocation": currentValues?.carrierInfo?.lineHaul?.manualFromLocation ? "Y" : "N",
                    "editFromLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip
                    },
                    "editToLocation": currentValues?.carrierInfo?.lineHaul?.manualToLocation ? 'Y' : 'N',
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zip
                    }
                },
                "linehaulCommonInfo": {
                    "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
                    "linehaulAccessorial": watchedLinehaulAddAcc ? 'Y' : 'N',
                    "linehaulAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                            ...rest,
                            notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
                        })),
                    }
                }
            },
            "deliveryDetails": {
                "deliveryPrimaryInfo": {
                    "carrierId": Number(deliveryCarrierId),
                    "terminalId": Number(deliveryTerminalId),
                    "carrierBillNumber": currentValues?.carrierInfo?.deliveryDetails?.billNumber,
                    "fromLocationType": "Carrier",
                    "fromLocation": currentValues?.carrierInfo?.deliveryDetails?.fromLocation,
                    "fromLocationEntityId": selectedDeliveryCarrierObject?.terminalEntityId || null,
                    "toLocationType": "Consignee",
                    "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
                    "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
                    "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
                    "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
                    "pieces": Number(currentValues?.carrierInfo?.deliveryDetails?.pcs) || null,
                    'weight': Number(currentValues?.carrierInfo?.deliveryDetails?.weight) || null,
                    "editFromLocation": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocation ? "Y" : 'N',
                    "editFromLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zip
                    },
                    "editToLocation": currentValues?.carrierInfo?.deliveryDetails?.manualToLocation ? "Y" : "N",
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zip
                    }
                },
                "deliveryCommonInfo": {
                    "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
                    "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
                    "deliveryAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials?.map(({ id, selected, notes, ...rest }) => ({
                            ...rest,
                            notes: notes?.map(({ noteMessageId, ...noteRest }) => noteRest)
                        })),
                    },
                    "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
                    "deliveryAlertDetails": {
                        "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
                        "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
                        "emailInfo": {
                            "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                            "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
                        }
                    }
                }
            }

        }
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery') {
        obj.carrierDetails = {

            "pickupDetails": {
                "pickupRouting": "PICKUP_ONLY",
                "fromLocationType": "Shipper",
                "fromLocation": currentValues?.carrierInfo?.fromLocation,
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
                    "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
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
            "linehaulDetails": {
                "linehaulPrimaryInfo": {
                    "linehaulRouting": "LINE_HAUL_DELIVERY",
                    "carrierId": Number(linehaulCarrierId),
                    "terminalId": Number(linehaulTerminalId),
                    "carrierBillNumber": currentValues?.carrierInfo?.lineHaul?.billNumber,
                    "fromLocationType": "Carrier",
                    "fromLocation": currentValues?.carrierInfo?.lineHaul?.fromLocation,
                    "fromLocationEntityId": selectedLinehaulCarrierObject?.terminalEntityId || null,
                    "toLocationType": "Consignee",
                    "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
                    "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
                    "etaDate": currentValues?.carrierInfo?.lineHaul?.etaDate,
                    "etaTime": currentValues?.carrierInfo?.lineHaul?.etaTime,
                    "pieces": Number(currentValues?.carrierInfo?.lineHaul?.pcs) || null,
                    'weight': Number(currentValues?.carrierInfo?.lineHaul?.weight) || null,
                    "editFromLocation": currentValues?.carrierInfo?.lineHaul?.manualFromLocation ? "Y" : "N",
                    "editFromLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip
                    },
                    "editToLocation": currentValues?.carrierInfo?.lineHaul?.manualToLocation ? 'Y' : 'N',
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zip
                    }
                },
                "linehaulCommonInfo": {
                    "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
                    "linehaulAccessorial": watchedLinehaulAddAcc ? 'Y' : 'N',
                    "linehaulAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
                    }
                }
            },
            "deliveryDetails": {

                "deliveryCommonInfo": {
                    "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
                    "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
                    "deliveryAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
                    },
                    "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
                    "deliveryAlertDetails": {
                        "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
                        "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
                        "emailInfo": {
                            "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                            "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
                        }
                    }
                }
            }

        }
    }
    if (selectedRouting === 'pickup_linehaul') {
        obj.carrierDetails = {

            "pickupDetails": {
                "pickupRouting": "PICKUP_LINE_HAUL",
                "fromLocationType": "Shipper",
                "fromLocation": currentValues?.carrierInfo?.fromLocation,
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
                    "toLocation": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
                    "toLocationEntityId": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.terminalEntityId || null : selectedPickupToCarrierObject?.terminalEntityId || null,
                    "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
                        "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
                        "city": currentValues?.carrierInfo?.manualToAddress?.city,
                        "state": currentValues?.carrierInfo?.manualToAddress?.state,
                        "zipCode": currentValues?.carrierInfo?.manualToAddress?.zip
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
            "linehaulDetails": {
                "linehaulCommonInfo": {
                    "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
                    "linehaulAccessorial": watchedLinehaulAddAcc ? 'Y' : 'N',
                    "linehaulAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
                    }
                }
            },
            "deliveryDetails": {
                "deliveryPrimaryInfo": {
                    "carrierId": Number(deliveryCarrierId),
                    "terminalId": Number(deliveryTerminalId),
                    "carrierBillNumber": currentValues?.carrierInfo?.deliveryDetails?.billNumber,
                    "fromLocationType": "Carrier",
                    "fromLocation": currentValues?.carrierInfo?.deliveryDetails?.fromLocation,
                    "fromLocationEntityId": selectedDeliveryCarrierObject?.terminalEntityId || null,
                    "toLocationType": "Consignee",
                    "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
                    "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
                    "etaDate": currentValues?.carrierInfo?.deliveryDetails?.etaDate,
                    "etaTime": currentValues?.carrierInfo?.deliveryDetails?.etaTime,
                    "pieces": Number(currentValues?.carrierInfo?.deliveryDetails?.pcs) || null,
                    'weight': Number(currentValues?.carrierInfo?.deliveryDetails?.weight) || null,
                    "editFromLocation": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocation ? "Y" : 'N',
                    "editFromLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zip
                    },
                    "editToLocation": currentValues?.carrierInfo?.deliveryDetails?.manualToLocation ? "Y" : "N",
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line1,
                        "line2": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.line2,
                        "city": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.city,
                        "state": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.state,
                        "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualToLocationDetails?.zip
                    }
                },
                "deliveryCommonInfo": {
                    "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
                    "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
                    "deliveryAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
                    },
                    "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
                    "deliveryAlertDetails": {
                        "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
                        "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
                        "emailInfo": {
                            "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                            "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
                        }
                    }
                }
            }

        }
    }
    if (selectedRouting === 'pickup_linehaul_delivery') {
        obj.carrierDetails = {

            "pickupDetails": {
                "pickupRouting": "PICKUP_LINE_HAUL_DELIVERY",
                "fromLocationType": "Shipper",
                "fromLocation": currentValues?.carrierInfo?.fromLocation,
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
                    "toLocationType": "Consignee",
                    "toLocation": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
                    "toLocationEntityId": currentValues?.consigneeName?.entityId || null,
                    "editToLocation": currentValues?.carrierInfo?.isManualToLocation ? "Y" : "N",
                    "editToLocationDetails": {
                        "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1,
                        "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2,
                        "city": currentValues?.carrierInfo?.manualToAddress?.city,
                        "state": currentValues?.carrierInfo?.manualToAddress?.state,
                        "zipCode": currentValues?.carrierInfo?.manualToAddress?.zip
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
            "linehaulDetails": {
                "linehaulCommonInfo": {
                    "linehaulNotes": currentValues?.carrierInfo?.lineHaul?.lineHaulNotes,
                    "linehaulAccessorial": watchedLinehaulAddAcc ? 'Y' : 'N',
                    "linehaulAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.lineHaul?.linehaulAccessorials
                    }
                }
            },
            "deliveryDetails": {
                "deliveryCommonInfo": {
                    "airportTransfer": currentValues?.carrierInfo?.deliveryDetails?.airportTransfer ? "Y" : "N",
                    "deliveryAccessorial": currentValues?.carrierInfo?.deliveryDetails?.deliveryAddAcc ? "Y" : "N",
                    "deliveryAccessorialDetails": {
                        "accessorials": currentValues?.carrierInfo?.deliveryDetails?.deliveryAccessorials,
                    },
                    "deliveryAlert": currentValues?.carrierInfo?.deliveryDetails?.deliveryAlert ? "Y" : "N",
                    "deliveryAlertDetails": {
                        "linehaulNotes": currentValues?.carrierInfo?.deliveryDetails?.lineHaulNotes ? "Y" : "N",
                        "deliveryNotes": currentValues?.carrierInfo?.deliveryDetails?.deliveryNotes,
                        "emailInfo": {
                            "primaryEmail": currentValues?.carrierInfo?.deliveryDetails?.primaryEmail,
                            "additionalEmails": currentValues?.carrierInfo?.deliveryDetails?.additionalEmail
                        }
                    }
                }
            }

        }
    }

    // step 4
    // push zip to zip
    const transformedPickupArray = currentValues?.carrierRates?.pickUp?.pickupAccessorials?.map(item => {
        // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
        const factor = item.input && !isNaN(parseFloat(item.input)) ? parseFloat(item.input) : null;
        const value = Number(item.chargeValue) || 0;

        return {
            rateType: item.accessorialName,
            multiplicationFactor: factor,
            multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '', // 
            rateValue: value,
            // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
            totalRate: Number((factor === null || factor === 0 ? value : factor * value).toFixed(2))
        };
    });
    if (currentValues?.carrierRates?.pickUp?.pickUpRate) {
        transformedPickupArray.push({
            rateType: 'Zip to Zip',
            multiplicationFactor: null,
            multiplicationFactorUOM: '',
            rateValue: Number(currentValues?.carrierRates?.pickUp?.pickUpRate),
            totalRate: Number(currentValues?.carrierRates?.pickUp?.pickUpRate).toFixed(2),
        });
    }
    const transformedLinehaulArray = currentValues?.carrierRates?.lineHaul?.lineHaulAccessorials?.map(item => {
        // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
        const factor = item.input && !isNaN(parseFloat(item.input)) ? parseFloat(item.input) : null;
        const value = Number(item.chargeValue) || 0;

        return {
            rateType: item.chargeType,
            multiplicationFactor: factor,
            multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '',
            rateValue: value,
            // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
            totalRate: Number((factor === null || factor === 0 ? value : factor * value).toFixed(2))
        };
    });
    if (currentValues?.carrierRates?.lineHaul?.lineHaulRate) {
        transformedLinehaulArray.push({
            rateType: 'Zip to Zip',
            multiplicationFactor: null,
            multiplicationFactorUOM: '',
            rateValue: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate),
            totalRate: Number(currentValues?.carrierRates?.lineHaul?.lineHaulRate).toFixed(2),
        });
    }
    const transformedDeliveryArray = currentValues?.carrierRates?.delivery?.deliveryAccessorials?.map(item => {
        // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
        const factor = item.input && !isNaN(parseFloat(item.input)) ? parseFloat(item.input) : null;
        const value = Number(item.chargeValue) || 0;

        return {
            rateType: item.chargeType,
            multiplicationFactor: factor,
            multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '', // 
            rateValue: value,
            // Condition: If factor is 0, totalRate is value. Otherwise, factor * value.
            totalRate: Number((factor === null || factor === 0 ? value : factor * value).toFixed(2))
        };
    });
    if (currentValues?.carrierRates?.delivery?.deliveryRate) {
        transformedDeliveryArray.push({
            rateType: 'Zip to Zip',
            multiplicationFactor: null,
            multiplicationFactorUOM: '',
            rateValue: Number(currentValues?.carrierRates?.delivery?.deliveryRate),
            totalRate: Number(currentValues?.carrierRates?.delivery?.deliveryRate).toFixed(2),
        });
    }
    const pickupSubTotalRate = transformedPickupArray.reduce((accumulator, item) => {
        // Force convert totalRate to a number safely, falling back to 0 if null/undefined
        const currentRate = Number(item.totalRate) || 0;
        return accumulator + currentRate;
    }, 0);
    const linehaulSubTotalRate = transformedLinehaulArray.reduce((accumulator, item) => {
        // Force convert totalRate to a number safely, falling back to 0 if null/undefined
        const currentRate = Number(item.totalRate) || 0;
        return accumulator + currentRate;
    }, 0);
    const deliverySubTotalRate = transformedDeliveryArray.reduce((accumulator, item) => {
        // Force convert totalRate to a number safely, falling back to 0 if null/undefined
        const currentRate = Number(item.totalRate) || 0;
        return accumulator + currentRate;
    }, 0);
    const transformedCustomerArray = currentValues?.customerRate?.customerAccessorials?.map(item => {
        // Convert input and chargeValue to numbers safely, falling back to 0 if invalid
        const factor = Number(item.input) || 0;
        const value = Number(item.chargeValue) || 0;

        // 1. Calculate raw totalRate based on your factor condition
        const rawTotal = factor === 0 ? value : factor * value;

        return {
            rateType: item.accessorialName,
            multiplicationFactor: factor,
            multiplicationFactorUOM: item.chargeType.toLowerCase() === 'per_pound' ? 'LB' : item.chargeType.toLowerCase() === 'hourly' ? 'HRS' : '',

            // 2. Format both outputs to exactly 2 decimal precision numbers
            rateValue: Number(value.toFixed(2)),
            totalRate: Number(rawTotal.toFixed(2))
        };
    });

    if (currentValues?.customerRate?.rate) {
        const formattedRate = Number(
            Number(currentValues?.customerRate?.rate).toFixed(2)
        );
        transformedCustomerArray.push({
            rateType: 'Rate',
            multiplicationFactor: null,
            multiplicationFactorUOM: '',
            rateValue: formattedRate,
            totalRate: formattedRate,
        });
    }
    if (currentValues?.customerRate?.fuelSurchargeRate) {
        // 1. Convert to number, force exactly 2 decimal precision, and parse back safely
        const formattedRate = Number(
            Number(currentValues.customerRate.fuelSurchargeRate).toFixed(2)
        );

        transformedCustomerArray.push({
            rateType: 'Fuel Surcharge (35% charge)',
            multiplicationFactor: null,
            multiplicationFactorUOM: '',
            // 2. Assign the safely bounded decimal numbers to your data objects
            rateValue: formattedRate,
            totalRate: formattedRate,
        });
    }

    obj.shipmentRateDetails = {
        "carrierRateDetails": {
            "pickupRateDetails": {
                "invoiceNumber": currentValues?.carrierRates?.pickUp?.invoiceNo,
                "rateDetails": transformedPickupArray,
                "pickupSubTotalRate": pickupSubTotalRate.toFixed(2),
                "invoiceApprovalStatus": "N"
            },
            "linehaulRateDetails": {
                "invoiceNumber": currentValues?.carrierRates?.lineHaul?.invoiceNo,
                "rateDetails": transformedLinehaulArray,
                "linehaulSubTotalRate": linehaulSubTotalRate.toFixed(2),
                "invoiceApprovalStatus": "N"
            },
            "deliveryRateDetails": {
                "invoiceNumber": currentValues?.carrierRates?.delivery?.invoiceNo,
                "rateDetails": transformedDeliveryArray,
                "deliverySubTotalRate": deliverySubTotalRate.toFixed(2),
                "invoiceApprovalStatus": "N"
            },
            "totalCarrierRate": Number((pickupSubTotalRate + linehaulSubTotalRate + deliverySubTotalRate).toFixed(2)),
        },
        "customerRateDetails": {
            "rateDetails": transformedCustomerArray,
            "totalCustomerRate": Number(
                transformedCustomerArray.reduce((sum, item) => sum + Number(item.totalRate || 0), 0).toFixed(2)
            ),
        }
    }
    if (transformedPickupArray && transformedPickupArray.length === 0) {
        delete obj.shipmentRateDetails.carrierRateDetails.pickupRateDetails;
    }
    if (transformedLinehaulArray && transformedLinehaulArray.length === 0) {
        delete obj.shipmentRateDetails.carrierRateDetails.linehaulRateDetails;
    }
    if (transformedDeliveryArray && transformedDeliveryArray.length === 0) {
        delete obj.shipmentRateDetails.carrierRateDetails.deliveryRateDetails;
    }

    if (transformedPickupArray && transformedPickupArray.length === 0 && transformedLinehaulArray && transformedLinehaulArray.length === 0 && transformedDeliveryArray && transformedDeliveryArray.length === 0) {
        delete obj.shipmentRateDetails.carrierRateDetails;
    }

    if (transformedCustomerArray && transformedCustomerArray.length === 0) {
        delete obj.shipmentRateDetails.customerRateDetails;
    }

    if (transformedPickupArray && transformedPickupArray.length === 0 && transformedLinehaulArray && transformedLinehaulArray.length === 0 && transformedDeliveryArray && transformedDeliveryArray.length === 0 && transformedCustomerArray && transformedCustomerArray.length === 0) {
        delete obj.shipmentRateDetails;
    }
    if (activeStep === 4) {
        setIsSubmittingFinal(true);
        try {
            // 2. Trigger your API call
            // dispatch(postStep1(obj));
            dispatch(postNetworkShipment(obj));
        } catch (error) {
            console.error("Submission failed:", error);
            // 4. Unlock button if API fails so they can retry
            setIsSubmittingFinal(false);
        }
    }
    if (activeStep === 2 && hasInitialData(getValues)) {
        setValue('doDetails.handlingUnits', currentValues.handlingUnits);
        setValue('doDetails.emergencyContactName', currentValues.emergencyContactName);
        setValue('doDetails.emergencyContactPhone', currentValues.emergencyContactPhone);
    }
};
// Helper 1: Extract routing fields logic for step 3
const getRoutingFields = (routing, linehaulRouting) => {
    const base = ['carrierInfo.selectCarrier', 'carrierInfo.fromLocation'];

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

export const onFormSubmit = async (dispatch, setValue, getValues, trigger, errors,
    activeStep, watchedServiceLevel, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
    selectedRouting, watchedLinehaulSelectRouting, setErrorVisible, setErrorVisibleFields, watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
    carrierTerminalDropdown, getZipToZipCarrierPickupRate, getZipToZipCarrierLinehaulRate, getZipToZipCarrierDeliveryRate,
    setIsSubmitting, postStep1, postNetworkShipment, watchedOriginAirport, watchedDestinationAirport, setActiveStep, isPickupPending) => {
    // Your API call here
    const currentValues = getValues();
    const missingRequiredFields = [];
    let valid = false;
    const obj = {};
    // adding to object - step 0
    obj.shipmentDetails = {
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
            await dispatch(postNetworkShipment(obj));
        } catch (error) {
            console.error("Submission failed:", error);
            setIsSubmitting(false);
        }
    }
    if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === '' && watchedSelectedPickupCarrier && !isPickupPending) {
        if (!currentValues?.carrierInfo?.pickupAgentTerminal) {
            if (currentValues?.carrierInfo?.toLocationType && currentValues?.carrierInfo.toLocation) {
                valid = true;
            } else {
                valid = false;
                missingRequiredFields.push('Pickup Location Type', 'Pickup To Location');
            }
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
                await dispatch(postNetworkShipment(obj));
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
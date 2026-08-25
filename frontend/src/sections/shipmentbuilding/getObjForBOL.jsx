export const getObjectForBOL = (getValues, watchedAirportPickupService, watchedAirportDeliveryService, isHazmatSelected,
    selectedRouting, watchedLinehaulSelectRouting, watchedSelectedPickupCarrier,
    watchedSelectedLineHaulCarrier, watchedSelectedDeliveryCarrier, watchedToLocation, watchedLinehaulToLocation, watchedDeliveryToLocation,
    carrierTerminalDropdown, watchedOriginAirport, watchedDestinationAirport,
    watchedLinehaulAddAcc, subModal, selectedShipmentBuildObj,
) => {
    const currentValues = getValues();
    let obj = {};
    obj.subModalType = subModal.type;
    obj.shipmentId = selectedShipmentBuildObj?.shipmentId;
    obj.selectedRouting = selectedRouting;
    obj.watchedLinehaulSelectRouting = watchedLinehaulSelectRouting;
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
            "shipperName": currentValues?.shipperName?.shipperName || currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.shipperName?.airlineName || '',
            "addressLine1": currentValues.shipperAddr1,
            "addressLine2": currentValues.shipperAddr2,
            "city": currentValues.shipperCity,
            "state": currentValues.shipperState,
            "zipCode": currentValues.shipperZip,
            "contactPersonName": currentValues.shipperContact,
            "phoneNumber": currentValues.shipperPhone,
        },

        "consigneeDetails": {
            "consigneeName": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "addressLine1": currentValues.consigneeAddr1,
            "addressLine2": currentValues.consigneeAddr2,
            "city": currentValues.consigneeCity,
            "state": currentValues.consigneeState,
            "zipCode": currentValues.consigneeZip,
            "contactPersonName": currentValues.consigneeContact,
            "phoneNumber": currentValues.consigneePhone,
        },
        "customerReferenceNumbers": subModal?.type === 'pickup' ? currentValues.printablePickupReferenceRows : subModal?.type === 'linehaul' ? currentValues.printableLinehaulReferenceRows : currentValues.printableDeliveryReferenceRows,
    };

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
                "pickupCarrier" : selectedPickupCarrierObject?.carrierName,
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
                    "fromCarrierName": selectedLinehaulCarrierObject?.carrierName,
                    "toCarrierName": selectedLinehaulToCarrierObject?.carrierName,
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
                    "fromCarrierName": selectedDeliveryCarrierObject?.carrierName,
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
        };
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
                "pickupCarrier" : selectedPickupCarrierObject?.carrierName,
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
                    "fromCarrierName": selectedLinehaulCarrierObject?.carrierName,
                    "toCarrierName": selectedLinehaulToCarrierObject?.carrierName,
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
                "pickupCarrier" : selectedPickupCarrierObject?.carrierName,
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
                "pickupCarrier" : selectedPickupCarrierObject?.carrierName,
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

    if (subModal.type === 'pickup') {
        if (selectedRouting === 'pickup_only' || selectedRouting === 'pickup_linehaul') {
            obj.customerDetails.shipperDetails = {
                "shipperName": currentValues?.shipperName?.shipperName || currentValues?.shipperName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.shipperName?.airlineName || '',
                "addressLine1": currentValues.shipperAddr1,
                "addressLine2": currentValues.shipperAddr2,
                "city": currentValues.shipperCity,
                "state": currentValues.shipperState,
                "zipCode": currentValues.shipperZip,
                "contactPersonName": currentValues.shipperContact,
                "phoneNumber": currentValues.shipperPhone,
            };
            obj.customerDetails.consigneeDetails = {
                "consigneeName": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1 || selectedPickupCarrierObject?.address?.addressLine1,
                "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2 || selectedPickupCarrierObject?.address?.addressLine2,
                "city": currentValues?.carrierInfo?.manualToAddress?.city || selectedPickupCarrierObject?.address?.city,
                "state": currentValues?.carrierInfo?.manualToAddress?.state || selectedPickupCarrierObject?.address?.state,
                "zipCode": currentValues?.carrierInfo?.manualToAddress?.zip || selectedPickupCarrierObject?.address?.zipCode,
                "contactPersonName": "",
                "phoneNumber": "",
            };
        }
    }
    if (subModal.type === 'linehaul') {
        if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only') {
            obj.customerDetails.shipperDetails = {
                "shipperName": selectedLinehaulCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
                "addressLine2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
                "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
                "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
                "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip,
                "contactPersonName": '',
                "phoneNumber": "",
            };

            obj.customerDetails.consigneeDetails = {
                "consigneeName": selectedLinehaulToCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line1,
                "addressLine2": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.line2,
                "city": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.city,
                "state": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.state,
                "zipCode": currentValues?.carrierInfo?.lineHaul?.manualToLocationDetails?.zip,
                "contactPersonName": '',
                "phoneNumber": '',
            }
        }
        if (selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_delivery') {
            obj.customerDetails.shipperDetails = {
                "shipperName": selectedLinehaulCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line1,
                "addressLine2": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.line2,
                "city": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.city,
                "state": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.state,
                "zipCode": currentValues?.carrierInfo?.lineHaul?.manualFromLocationDetails?.zip,
                "contactPersonName": '',
                "phoneNumber": "",
            };
            obj.customerDetails.consigneeDetails = {
                "consigneeName": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
                "addressLine1": currentValues.consigneeAddr1,
                "addressLine2": currentValues.consigneeAddr2,
                "city": currentValues.consigneeCity,
                "state": currentValues.consigneeState,
                "zipCode": currentValues.consigneeZip,
                "contactPersonName": currentValues.consigneeContact,
                "phoneNumber": currentValues.consigneePhone,
            };
        }
    }
    if (subModal.type === 'delivery') {
        if ((selectedRouting === 'pickup_only' && watchedLinehaulSelectRouting === 'linehaul_only')) {
            // delivery from
            obj.customerDetails.shipperDetails = {
                "shipperName": selectedDeliveryCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line1,
                "addressLine2": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.line2,
                "city": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.city,
                "state": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.state,
                "zipCode": currentValues?.carrierInfo?.deliveryDetails?.manualFromLocationDetails?.zip,
                "contactPersonName": "",
                "phoneNumber": "",
            };
        }
        if (selectedRouting === 'pickup_linehaul') {
            // pickup agent to
            obj.customerDetails.shipperDetails = {
                "shipperName": currentValues?.carrierInfo?.pickupAgentTerminal ? selectedPickupCarrierObject?.carrierName : selectedPickupToCarrierObject?.carrierName,
                "addressLine1": currentValues?.carrierInfo?.manualToAddress?.line1 || selectedPickupCarrierObject?.address?.addressLine1,
                "addressLine2": currentValues?.carrierInfo?.manualToAddress?.line2 || selectedPickupCarrierObject?.address?.addressLine2,
                "city": currentValues?.carrierInfo?.manualToAddress?.city || selectedPickupCarrierObject?.address?.city,
                "state": currentValues?.carrierInfo?.manualToAddress?.state || selectedPickupCarrierObject?.address?.state,
                "zipCode": currentValues?.carrierInfo?.manualToAddress?.zip || selectedPickupCarrierObject?.address?.zipCode,
                "contactPersonName": "",
                "phoneNumber": "",
            };
        }
        obj.customerDetails.consigneeDetails = {
            "consigneeName": currentValues?.consigneeName?.consigneeName || currentValues?.consigneeName?.airlineName?.split('-').map(item => item.trim())[2] || currentValues?.consigneeName?.airlineName || '',
            "addressLine1": currentValues.consigneeAddr1,
            "addressLine2": currentValues.consigneeAddr2,
            "city": currentValues.consigneeCity,
            "state": currentValues.consigneeState,
            "zipCode": currentValues.consigneeZip,
            "contactPersonName": currentValues.consigneeContact,
            "phoneNumber": currentValues.consigneePhone,
        };
    }

    return obj;
};
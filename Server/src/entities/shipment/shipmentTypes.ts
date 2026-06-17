export type ShipmentDetails = {
    typeOfShipment: string;
    serviceLevel: string;
    shipmentDate: Date;
    shipmentTime: string;
    orderReceivedPickupPending: 'Y' | 'N';
    shipmentStatus: string;
};

export type AirlineDetails = {
    airlineId?: number;
    airlineNumber: number;
    airlineCode: string;
    airportCode: string;
    airlineName: string;
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    city: string;
    zipCode?: string;
    handler?: string;
    phoneNumber?: string;
    entityId?: number;
};

export type ShipperDetails = {
    shipperId?: number;
    shipperName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
};

export type ConsigneeDetails = {
    consigneeId?: number;
    consigneeName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    contactPersonName: string;
    phoneNumber: string;
    entityId?: number;
};

export type CustomerDetails = {
    customerId: number;
    stationId: number;
    airportPickupService: 'Y' | 'N';
    originAirportCode: string;
    airportDeliveryService: 'Y' | 'N';
    destinationAirportCode: string;
} & (
        | {
            airportPickupService: 'Y';
            pickupAirlineDetails: AirlineDetails;
            shipperDetails?: never;
        }
        | {
            airportPickupService: 'N';
            shipperDetails: ShipperDetails;
            pickupAirlineDetails?: never;
        }
    ) &
    (
        | {
            airportDeliveryService: 'Y';
            deliveryAirlineDetails: AirlineDetails;
            consigneeDetails?: never;
        }
        | {
            airportDeliveryService: 'N';
            consigneeDetails: ConsigneeDetails;
            deliveryAirlineDetails?: never;
        }
    );

export type HazmatDetails = {
    unNumber: string;
    properShippingName: string;
    hazardClass: string;
    packingGroup: string;
    weight: number;
    technicalName: string;
    contactPhoneNumber: string;
    hazmatDescription: string;
    limitedQuantity: 'Y' | 'N';
    marinePollutant: 'Y' | 'N';
    residueLastContained: 'Y' | 'N';
    reportableQuantity: 'Y' | 'N';
    dotExemption: 'Y' | 'N';
}

export type PalletDetails = {
    pieces: number;
    piecesUOM: string;
    description: string;
    hazmat: 'Y' | 'N';
} & { hazmatDetails: HazmatDetails }

export type HandlingUnitDetails = {
    handlingUnitUOM: string;
    handlingUnits: number;
    unit: string;
    handlingLength: number;
    handlingWidth: number;
    handlingHeight: number;
    handlingWeight: number;
    handlingWeightUnit: string;
    class: string;
} & {
    palletDetails: PalletDetails[];
};

export type CommodityDetails = {
    emergencyContactName: string;
    emergencyContactPhone: string;
} & {
    handlingUnits: HandlingUnitDetails[];
};

export type Accessorial = {
    accessorialId: number;
    chargeType: string;
    chargeValue: number;
    notes: Notes[];
}

export type Notes = {
    noteMessage: string;
}

export type EmailInfo = {
    primaryEmail: string;
    additionalEmails: string[];
}

export type AddressDetail = {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
}

// export type PickupDetails = {
//     routing: 'PICKUP_ONLY' | 'PICKUP_LINE_HAUL' | 'PICKUP_LINE_HAUL_DELIVERY';
//     airportTransfer: 'Y' | 'N';
//     carrierId: number;
//     terminalId: number;
//     fromLocation: string;
//     editFromLocation: 'Y' | 'N';
//     editFromLocationDetails?: {
//         addressLine1: string;
//         addressLine2?: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     pickupAgentTerminal: 'Y' | 'N';
//     pickupAgentTerminalDetails?: {
//         toLocationType: 'CARRIER' | 'CONSIGNEE';
//         toLocationId: number;
//         editToLocation: 'Y' | 'N';
//         editToLocationDetails?: {
//             addressLine1: string;
//             addressLine2?: string;
//             city: string;
//             state: string;
//             zipCode: string;
//         };
//     };
//     addPickupAccessorial: 'Y' | 'N';
//     pickupAccessorialDetails?: {
//         accessorials: Accessorial[]
//     };
//     pickupAlert: 'Y' | 'N';
//     pickupAlertDetails?: {
//         inboundNotes: string;
//         emailInfo: EmailInfo;
//     }
// }

// export type LinehaulDetails = {
//     routing: 'LINE_HAUL' | 'LINE_HAUL_DELIVERY';
//     carrierId: number;
//     terminalId: number;
//     carrierBillNumber: string;
//     editFromLocation: 'Y' | 'N';
//     editFromLocationDetails?: {
//         addressLine1: string;
//         addressLine2?: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     toLocationType: 'CARRIER' | 'CONSIGNEE';
//     toLocationId: number;
//     editToLocation: 'Y' | 'N';
//     editToLocationDetails?: {
//         addressLine1: string;
//         addressLine2?: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     etaDate: Date;
//     etaTime: string;
//     pieces: number;
//     addLinehaulAccessorial: 'Y' | 'N';
//     linehaulAccessorialDetails?: {
//         accessorials: Accessorial[]
//     };
//     linehaulNotes: string;
// };

// export type DeliveryDetails = {
//     carrierId: number;
//     terminalId: number;
//     carrierBillNumber: string;
//     editFromLocation: 'Y' | 'N';
//     editFromLocationDetails?: {
//         addressLine1: string;
//         addressLine2?: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     toLocationType: 'CARRIER' | 'CONSIGNEE';
//     toLocationId: number;
//     editToLocation: 'Y' | 'N';
//     editToLocationDetails?: {
//         addressLine1: string;
//         addressLine2?: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     etaDate: Date;
//     etaTime: string;
//     pieces: number;
//     addDeliveryAccessorial: 'Y' | 'N';
//     deliveryAccessorialDetails?: {
//         accessorials: Accessorial[]
//     };
//     airportTransfer: 'Y' | 'N';
//     deliveryAlert: 'Y' | 'N';
//     deliveryAlertDetails?: {
//         linehaulNotes: string;
//         deliveryNotes: string;
//         emailInfo: EmailInfo;
//     }

// }


export type PickupDetails = {
    pickupRouting: 'PICKUP_ONLY' | 'PICKUP_LINE_HAUL' | 'PICKUP_LINE_HAUL_DELIVERY';
    airportTransfer: 'Y' | 'N';
    carrierId: number;
    terminalId: number;
    fromLocationType: 'Shipper' | 'Carrier';
    fromLocation: string;
    fromLocationEntityId?: number;
} & (
        | {
            editFromLocation: 'Y';
            editFromLocationDetails: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
        | {
            editFromLocation: 'N';
            editFromLocationDetails?: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
    ) & (
        | {
            pickupAgentTerminal: 'Y';
            pickupAgentTerminalDetails: {
                toLocationType: 'Carrier' | 'Consignee';
                toLocation: string;
                toLocationEntityId?: number;
            } & (
                | {
                    editToLocation: 'Y';
                    editToLocationDetails: {
                        addressLine1: string;
                        addressLine2?: string;
                        city: string;
                        state: string;
                        zipCode: string;
                    };
                }
                | {
                    editToLocation: 'N';
                    editToLocationDetails?: {
                        addressLine1: string;
                        addressLine2?: string;
                        city: string;
                        state: string;
                        zipCode: string;
                    };
                }
            );
        }
        | {
            pickupAgentTerminal: 'N';
            pickupAgentTerminalDetails?: never;
        }
    ) & (
        | {
            pickupAccessorial: 'Y';
            pickupAccessorialDetails: {
                accessorials: Accessorial[];
            };
        }
        | {
            pickupAccessorial: 'N';
            pickupAccessorialDetails?: never;
        }
    ) & (
        | {
            pickupAlert: 'Y';
            pickupAlertDetails: {
                inboundNotes: string;
                emailInfo: {
                    primaryEmail: string;
                    additionalEmails: string[];
                };
            };
        }
        | {
            pickupAlert: 'N';
            pickupAlertDetails?: never;
        }
    );

// Linehaul Primary Info
export type LinehaulPrimaryInfo = {
    linehaulRouting: 'LINE_HAUL' | 'LINE_HAUL_DELIVERY';
    carrierId: number;
    terminalId: number;
    carrierBillNumber: string;
    fromLocationType: 'Shipper' | 'Carrier';
    fromLocation: string;
    fromLocationEntityId?: number;
    toLocationType: 'Carrier' | 'Consignee';
    toLocation: string;
    toLocationEntityId?: number;
    etaDate: Date;
    etaTime: string;
    pieces: number;
    weight: number;
} & (
        | {
            editFromLocation: 'Y';
            editFromLocationDetails: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
        | {
            editFromLocation: 'N';
            editFromLocationDetails?: never;
        }
    ) & (
        | {
            editToLocation: 'Y';
            editToLocationDetails: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
        | {
            editToLocation: 'N';
            editToLocationDetails?: never;
        }
    );

// Linehaul Common Info
export type LinehaulCommonInfo = {
    linehaulNotes: string;
} & (
        | {
            linehaulAccessorial: 'Y';
            linehaulAccessorialDetails: {
                accessorials: Accessorial[];
            };
        }
        | {
            linehaulAccessorial: 'N';
            linehaulAccessorialDetails?: never;
        }
    );

// Linehaul Details (combination of primary and common)
export type LinehaulDetails = {
    linehaulPrimaryInfo: LinehaulPrimaryInfo;
    linehaulCommonInfo: LinehaulCommonInfo;
}

// Delivery Primary Info
export type DeliveryPrimaryInfo = {
    carrierId: number;
    terminalId: number;
    carrierBillNumber: string;
    fromLocationType: 'Carrier';
    fromLocation: string;
    fromLocationEntityId?: number;
    toLocationType: 'Consignee';
    toLocation: string;
    toLocationEntityId?: number;
    etaDate: Date;
    etaTime: string;
    pieces: number;
    weight: number;
} & (
        | {
            editFromLocation: 'Y';
            editFromLocationDetails: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
        | {
            editFromLocation: 'N';
            editFromLocationDetails?: never;
        }
    ) & (
        | {
            editToLocation: 'Y';
            editToLocationDetails: {
                addressLine1: string;
                addressLine2?: string;
                city: string;
                state: string;
                zipCode: string;
            };
        }
        | {
            editToLocation: 'N';
            editToLocationDetails?: never;
        }
    );

// Delivery Common Info
export type DeliveryCommonInfo = {
    airportTransfer: 'Y' | 'N';
} & (
        | {
            deliveryAccessorial: 'Y';
            deliveryAccessorialDetails: {
                accessorials: Accessorial[];
            };
        }
        | {
            deliveryAccessorial: 'N';
            deliveryAccessorialDetails?: never;
        }
    ) & (
        | {
            deliveryAlert: 'Y';
            deliveryAlertDetails: {
                linehaulNotes: string;
                deliveryNotes: string;
                emailInfo: {
                    primaryEmail: string;
                    additionalEmails: string[];
                };
            };
        }
        | {
            deliveryAlert: 'N';
            deliveryAlertDetails?: never;
        }
    );

// Delivery Details (combination of primary and common)
export type DeliveryDetails = {
    deliveryPrimaryInfo: DeliveryPrimaryInfo;
    deliveryCommonInfo: DeliveryCommonInfo;
};

export type CarrierDetails =
    | {
        // ✅ PICKUP_ONLY + LINE_HAUL
        // Full pickup, Full linehaul (with CARRIER toLocationType), Full delivery
        pickupDetails: PickupDetails & {
            pickupRouting: 'PICKUP_ONLY';
        };

        linehaulDetails: {
            linehaulPrimaryInfo: LinehaulPrimaryInfo & {
                linehaulRouting: 'LINE_HAUL';
                toLocationType: 'Carrier';
                fromLocationType: 'Carrier';
            };
            linehaulCommonInfo: LinehaulCommonInfo;
        };

        deliveryDetails: DeliveryDetails;
    }

    | {
        // ✅ PICKUP_ONLY + LINE_HAUL_DELIVERY
        // Full pickup, Partial linehaul (embedded with CONSIGNEE toLocationType), Partial delivery (accessories + alert only)
        pickupDetails: PickupDetails & {
            pickupRouting: 'PICKUP_ONLY';
        };

        linehaulDetails: {
            linehaulPrimaryInfo: Omit<LinehaulPrimaryInfo, 'toLocationType'> & {
                linehaulRouting: 'LINE_HAUL_DELIVERY';
                toLocationType: 'Consignee';
                fromLocationType: 'Carrier';
            };
            linehaulCommonInfo: LinehaulCommonInfo;
        };

        deliveryDetails: {
            deliveryCommonInfo: {
                airportTransfer: 'Y' | 'N';
            } & (
                | {
                    deliveryAccessorial: 'Y';
                    deliveryAccessorialDetails: {
                        accessorials: Accessorial[];
                    };
                }
                | {
                    deliveryAccessorial: 'N';
                    deliveryAccessorialDetails?: never;
                }
            ) & (
                | {
                    deliveryAlert: 'Y';
                    deliveryAlertDetails: {
                        linehaulNotes: string;
                        deliveryNotes: string;
                        emailInfo: {
                            primaryEmail: string;
                            additionalEmails: string[];
                        };
                    };
                }
                | {
                    deliveryAlert: 'N';
                    deliveryAlertDetails?: never;
                }
            );
        };
    }

    | {
        // ✅ PICKUP_LINE_HAUL
        // Full pickup (CARRIER toLocationType), Partial linehaul (notes + accessories), Full delivery (CONSIGNEE toLocationType)
        pickupDetails: PickupDetails & {
            pickupRouting: 'PICKUP_LINE_HAUL';
        };

        linehaulDetails: {
            linehaulCommonInfo: {
                linehaulNotes: string;
            } & (
                | {
                    linehaulAccessorial: 'Y';
                    linehaulAccessorialDetails: {
                        accessorials: Accessorial[];
                    };
                }
                | {
                    linehaulAccessorial: 'N';
                    linehaulAccessorialDetails?: never;
                }
            );
        };

        deliveryDetails: DeliveryDetails & {
            deliveryPrimaryInfo: DeliveryPrimaryInfo & {
                toLocationType: 'Consignee';
            };
        };
    }

    | {
        // ✅ PICKUP_LINE_HAUL_DELIVERY
        // Full pickup (CONSIGNEE toLocationType), Partial linehaul (notes + accessories), Partial delivery (accessories + alert)
        pickupDetails: PickupDetails & {
            pickupRouting: 'PICKUP_LINE_HAUL_DELIVERY';
        };

        linehaulDetails: {
            linehaulCommonInfo: {
                linehaulNotes: string;
            } & (
                | {
                    linehaulAccessorial: 'Y';
                    linehaulAccessorialDetails: {
                        accessorials: Accessorial[];
                    };
                }
                | {
                    linehaulAccessorial: 'N';
                    linehaulAccessorialDetails?: never;
                }
            );
        };

        deliveryDetails: {
            deliveryCommonInfo: {
                airportTransfer: 'Y' | 'N';
            } & (
                | {
                    deliveryAccessorial: 'Y';
                    deliveryAccessorialDetails: {
                        accessorials: Accessorial[];
                    };
                }
                | {
                    deliveryAccessorial: 'N';
                    deliveryAccessorialDetails?: never;
                }
            ) & (
                | {
                    deliveryAlert: 'Y';
                    deliveryAlertDetails: {
                        linehaulNotes: string;
                        deliveryNotes: string;
                        emailInfo: {
                            primaryEmail: string;
                            additionalEmails: string[];
                        };
                    };
                }
                | {
                    deliveryAlert: 'N';
                    deliveryAlertDetails?: never;
                }
            );
        };
    };


export type CreateNetworkShipmentRequest = {
    shipmentDetails: ShipmentDetails;
    customerDetails: CustomerDetails;
    commodityDetails: CommodityDetails;
    carrierDetails: CarrierDetails
}
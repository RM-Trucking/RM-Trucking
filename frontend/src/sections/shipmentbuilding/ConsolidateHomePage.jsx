import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stack,
  Breadcrumbs,
  Link
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PATH_DASHBOARD } from '../../routes/paths';
import { useDispatch, useSelector } from '../../redux/store';
import {
  setSelectedShipmentBuildObj,
} from '../../redux/slices/shipmentbuilding';


// 1. Array data structure matching your exact API response signature payload
const shipments = [
  {
    "shipmentId": 1161,
    "shipmentDetails": {
      "typeOfShipment": "AIR_IMPORT",
      "serviceLevel": "Dedicated Truck",
      "shipmentDate": "2026-10-05",
      "shipmentTime": null,
      "orderReceivedPickupPending": "N",
      "status": "ORDER_RECEIVED_PICKUP_SETUP",
      "shipmentProNumber": "S0000001161"
    },
    "customerDetails": {
      "customerInfoId": 998,
      "shipmentId": 1161,
      "customerId": 104,
      "stationId": 153,
      "originAirportCode": "",
      "destinationAirportCode": "",
      "airportPickupService": "N",
      "airportDeliveryService": "N",
      "customerName": "check cust 23",
      "shipperDetails": {
        "shipperId": 130,
        "shipperName": "shipper 434",
        "addressLine1": "Demo Address Line 1",
        "addressLine2": "Line 2",
        "city": "Demo city",
        "state": "Demo state",
        "zipCode": "12345",
        "contactPersonName": "d",
        "phoneNumber": "(222) 222-2222",
        "entityId": 5435
      },
      "consigneeDetails": {
        "consigneeId": 158,
        "consigneeName": "consignee 157",
        "addressLine1": "line 1",
        "addressLine2": "",
        "city": "city",
        "state": "state",
        "zipCode": "65756",
        "contactPersonName": "nm",
        "phoneNumber": "(659) 876-7868",
        "entityId": 5440
      }
    },
    "commodityDetails": {
      "commodityId": 876,
      "emergencyContactName": "",
      "emergencyContactPhone": "",
      "handlingUnits": [
        {
          "handlingUnitId": 1373,
          "shipmentId": 1161,
          "handlingUnitUOM": "Crate",
          "handlingUnits": "1",
          "unit": "in",
          "handlingLength": 0,
          "handlingWidth": 0,
          "handlingHeight": 0,
          "handlingWeight": 2,
          "handlingWeightUnit": "LB",
          "class": "",
          "palletDetails": [
            {
              "itemId": 1515,
              "handlingUnitId": 1373,
              "pieces": 1,
              "piecesUOM": "Skid",
              "description": "desc",
              "hazmat": "N"
            }
          ],
          "images": []
        }
      ]
    },
    "carrierDetails": {
      "pickupDetails": {
        "pickupInfoId": 1039,
        "shipmentId": 1161,
        "entityId": 5435,
        "pickupRouting": "PICKUP_LINE_HAUL",
        "airportTransfer": "N",
        "carrierId": 184,
        "carrierName": "Averitt Express",
        "terminalId": 527,
        "terminalName": "RIC",
        "carrierBillNumber": "567567",
        "fromLocationType": "Shipper",
        "fromLocation": "shipper 434",
        "fromLocationEntityId": 5435,
        "editFromLocation": "N",
        "pickupAgentTerminal": "N",
        "pickupAccessorial": "N",
        "pickupAlert": "N",
        "editFromLocationDetails": {
          "addressLine1": "Demo Address Line 1",
          "addressLine2": "Line 2",
          "city": "Demo city",
          "state": "Demo state",
          "zipCode": "12345"
        },
        "pickupAgentTerminalDetails": {
          "pickupAgentTerminalId": 783,
          "shipmentId": 1161,
          "toLocationType": "Carrier",
          "toLocation": "Averitt Express",
          "toLocationEntityId": 3408,
          "editToLocation": "N",
          "editToLocationDetails": {
            "addressLine1": "1 Averitt Express Dr",
            "addressLine2": "",
            "city": "Nashville",
            "state": "TN",
            "zipCode": "37211"
          }
        },
        "pickupAlertDetails": {
          "pickupAlertId": 578,
          "shipmentId": 1161,
          "inboundNotes": null,
          "emailInfo": {
            "primaryEmail": "",
            "additionalEmails": []
          }
        }
      },
      "linehaulDetails": {
        "linehaulPrimaryInfo": {
          "linehaulInfoId": 430,
          "shipmentId": 1161,
          "entityId": 6365,
          "linehaulRouting": "LINE_HAUL_ONLY",
          "carrierId": 184,
          "terminalId": 214,
          "carrierBillNumber": "57567",
          "editFromLocation": "N",
          "fromLocationType": "Carrier",
          "fromLocation": "Carrier",
          "fromLocationEntityId": 3408,
          "editToLocation": "N",
          "toLocationType": "Carrier",
          "toLocation": "526-184",
          "toLocationEntityId": 4840,
          "etaDate": "2026-10-05",
          "etaTime": null,
          "pieces": null,
          "weight": null,
          "editFromLocationDetails": {
            "addressLine1": "1 Averitt Express Dr",
            "addressLine2": "",
            "city": "Nashville",
            "state": "TN",
            "zipCode": "37211"
          },
          "editToLocationDetails": {
            "addressLine1": "1005 Enterprise Cir",
            "addressLine2": "",
            "city": "Chesapeake",
            "state": "VA",
            "zipCode": "23321"
          }
        },
        "linehaulCommonInfo": {
          "linehaulCommonInfoId": 602,
          "shipmentId": 1161,
          "linehaulAccessorial": "N",
          "linehaulNotes": ""
        }
      },
      "deliveryDetails": {
        "deliveryPrimaryInfo": {
          "deliveryInfoId": 389,
          "shipmentId": 1161,
          "entityId": 6366,
          "carrierId": 184,
          "terminalId": 214,
          "carrierBillNumber": "5657567",
          "editFromLocation": "N",
          "fromLocationType": "Carrier",
          "fromLocation": "Carrier",
          "fromLocationEntityId": 3408,
          "editToLocation": "N",
          "toLocationType": "Consignee",
          "toLocation": "consignee 157",
          "toLocationEntityId": 5440,
          "etaDate": "2026-10-05",
          "etaTime": null,
          "pieces": null,
          "weight": null,
          "editFromLocationDetails": {
            "addressLine1": "1 Averitt Express Dr",
            "addressLine2": "",
            "city": "Nashville",
            "state": "TN",
            "zipCode": "37211"
          },
          "editToLocationDetails": {
            "addressLine1": "line 1",
            "addressLine2": "",
            "city": "city",
            "state": "state",
            "zipCode": "65756"
          }
        },
        "deliveryCommonInfo": {
          "deliveryCommonInfoId": 564,
          "shipmentId": 1161,
          "deliveryAccessorial": "N",
          "airportTransfer": "Y",
          "deliveryAlert": "N",
          "deliveryAlertDetails": {
            "deliveryAlertId": 461,
            "shipmentId": 1161,
            "linehaulNotes": null,
            "deliveryNotes": null,
            "emailInfo": {
              "primaryEmail": null,
              "additionalEmails": []
            }
          }
        }
      }
    }
  },
  {
    "shipmentId": 1109,
    "shipmentDetails": {
      "typeOfShipment": "AIR_EXPORT",
      "serviceLevel": "Dedicated Truck",
      "shipmentDate": "2026-09-17",
      "shipmentTime": null,
      "orderReceivedPickupPending": "N",
      "status": "ORDER_RECEIVED_PICKUP_SETUP",
      "shipmentProNumber": "S0000001109"
    },
    "customerDetails": {
      "customerInfoId": 952,
      "shipmentId": 1109,
      "customerId": 122,
      "stationId": 176,
      "originAirportCode": "LKML",
      "destinationAirportCode": "LMNL",
      "airportPickupService": "Y",
      "airportDeliveryService": "Y",
      "customerName": "Rajadurai S",
      "pickupAirlineDetails": {
        "airlineId": 184,
        "airlineNumber": 31,
        "airlineCode": "GL",
        "airportCode": "LKML",
        "airlineName": "Test 1",
        "addressLine1": "Test address 1",
        "addressLine2": "",
        "city": "Test city",
        "state": "Test State",
        "zipCode": "87976",
        "contactPersonName": "Shiva",
        "phoneNumber": "(897) 866-7632",
        "entityId": 6123,
        "scenarioType": "EXPORT"
      },
      "deliveryAirlineDetails": {
        "airlineId": 185,
        "airlineNumber": 32,
        "airlineCode": "GU",
        "airportCode": "LMNL",
        "airlineName": "Test 2",
        "addressLine1": "Test address 1",
        "addressLine2": "",
        "city": "Test city",
        "state": "Test state",
        "zipCode": "78767",
        "contactPersonName": "Prakash",
        "phoneNumber": "(987) 877-6588",
        "entityId": 6124,
        "scenarioType": "EXPORT"
      }
    },
    "commodityDetails": {
      "commodityId": 831,
      "emergencyContactName": "",
      "emergencyContactPhone": "",
      "handlingUnits": [
        {
          "handlingUnitId": 1145,
          "shipmentId": 1109,
          "handlingUnitUOM": "Drum",
          "handlingUnits": "4",
          "unit": "in",
          "handlingLength": 8,
          "handlingWidth": 6,
          "handlingHeight": 10,
          "handlingWeight": 45,
          "handlingWeightUnit": "LB",
          "class": "Class 55",
          "palletDetails": [
            {
              "itemId": 1263,
              "handlingUnitId": 1145,
              "pieces": 2,
              "piecesUOM": "Drum",
              "description": "Testing",
              "hazmat": "N"
            }
          ],
          "images": []
        }
      ]
    },
    "carrierDetails": {
      "pickupDetails": {
        "pickupInfoId": 832,
        "shipmentId": 1109,
        "entityId": 6125,
        "pickupRouting": "PICKUP_ONLY",
        "airportTransfer": "N",
        "carrierId": 263,
        "carrierName": "estest1",
        "terminalId": 521,
        "terminalName": "Terminal 001",
        "carrierBillNumber": "87676987",
        "fromLocationType": "Shipper",
        "fromLocation": "Test 1",
        "fromLocationEntityId": null,
        "editFromLocation": "N",
        "pickupAgentTerminal": "Y",
        "pickupAccessorial": "N",
        "pickupAlert": "N",
        "editFromLocationDetails": {
          "addressLine1": "Test address 1",
          "addressLine2": "",
          "city": "Test city",
          "state": "Test State",
          "zipCode": "87976"
        },
        "pickupAgentTerminalDetails": {
          "pickupAgentTerminalId": 576,
          "shipmentId": 1109,
          "toLocationType": "Carrier",
          "toLocation": "estest1",
          "toLocationEntityId": 4557,
          "editToLocation": "N",
          "editToLocationDetails": {
            "addressLine1": "Add line 1",
            "addressLine2": "Add line 2",
            "city": "city1",
            "state": "ST",
            "zipCode": "12309"
          }
        }
      },
      "linehaulDetails": {
        "linehaulPrimaryInfo": {
          "linehaulInfoId": 304,
          "shipmentId": 1109,
          "entityId": 6126,
          "linehaulRouting": "LINE_HAUL_ONLY",
          "carrierId": 263,
          "terminalId": 522,
          "carrierBillNumber": "879776",
          "editFromLocation": "N",
          "fromLocationType": "Carrier",
          "fromLocation": "",
          "fromLocationEntityId": 4587,
          "editToLocation": "N",
          "toLocationType": "Carrier",
          "toLocation": "236-243",
          "toLocationEntityId": 3442,
          "etaDate": "2026-09-17",
          "etaTime": null,
          "pieces": null,
          "weight": null,
          "editFromLocationDetails": {
            "addressLine1": "Test 2",
            "addressLine2": "Test 2",
            "city": "Test 2",
            "state": "Test 2",
            "zipCode": "77678"
          },
          "editToLocationDetails": {
            "addressLine1": "house of groom, lender group",
            "addressLine2": "",
            "city": "NewYork",
            "state": "Arizona",
            "zipCode": "60008"
          }
        },
        "linehaulCommonInfo": {
          "linehaulCommonInfoId": 435,
          "shipmentId": 1109,
          "linehaulAccessorial": "N",
          "linehaulNotes": ""
        }
      },
      "deliveryDetails": {
        "deliveryPrimaryInfo": {
          "deliveryInfoId": 317,
          "shipmentId": 1109,
          "entityId": 6128,
          "carrierId": 243,
          "terminalId": 236,
          "carrierBillNumber": "768676",
          "editFromLocation": "N",
          "fromLocationType": "Carrier",
          "fromLocation": "",
          "fromLocationEntityId": 3442,
          "editToLocation": "N",
          "toLocationType": "Consignee",
          "toLocation": "Test 2",
          "toLocationEntityId": null,
          "etaDate": "2026-09-17",
          "etaTime": null,
          "pieces": null,
          "weight": null,
          "editFromLocationDetails": {
            "addressLine1": "house of groom, lender group",
            "addressLine2": "",
            "city": "NewYork",
            "state": "Arizona",
            "zipCode": "60008"
          },
          "editToLocationDetails": {
            "addressLine1": "Test address 1",
            "addressLine2": "",
            "city": "Test city",
            "state": "Test state",
            "zipCode": "78767"
          }
        },
        "deliveryCommonInfo": {
          "deliveryCommonInfoId": 423,
          "shipmentId": 1109,
          "deliveryAccessorial": "N",
          "airportTransfer": "N",
          "deliveryAlert": "Y",
          "deliveryAlertDetails": {
            "deliveryAlertId": 339,
            "shipmentId": 1109,
            "linehaulNotes": "Please setup for pickup today ____ and drop to Forward Air",
            "deliveryNotes": "Setup for pickup today ____ ",
            "emailInfo": {
              "primaryEmail": "gowthami@srinsofttech.com",
              "additionalEmails": []
            }
          }
        }
      }
    }
  },
];

export default function ConsolidateHomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const shipmentViewData = useSelector((state) => state?.shipmentbuildingdata?.shipmentViewData);

  // 2. Safe Parsing Aggregations traversal rules
  const parsedRows = shipments.map((item, index) => {
    const firstHU = item.commodityDetails?.handlingUnits?.[0];
    const firstPallet = firstHU?.palletDetails?.[0];

    const originCity = item?.customerDetails?.airportPickupService === 'Y' ? item?.customerDetails?.pickupAirlineDetails?.city : item?.customerDetails?.shipperDetails?.city;
    const originState = item?.customerDetails?.airportPickupService === 'Y' ? item?.customerDetails?.pickupAirlineDetails?.state : item?.customerDetails?.shipperDetails?.state;

    const destinationCity = item?.customerDetails?.airportDeliveryService === 'Y' ? item?.customerDetails?.deliveryAirlineDetails?.city : item?.customerDetails?.consigneeDetails?.city;
    const destinationState = item?.customerDetails?.airportDeliveryService === 'Y' ? item?.customerDetails?.deliveryAirlineDetails?.state : item?.customerDetails?.consigneeDetails?.state;

    return {
      sNo: String(index + 1).padStart(2, '0'),
      shipmentId : item.shipmentId,
      proNum: item.shipmentDetails?.shipmentProNumber,
      customer: item.customerDetails?.customerName || 'N/A',
      origin: `${originCity}, ${originState}`,
      destination: `${destinationCity}, ${destinationState}`,
      serviceLevel: item.shipmentDetails?.serviceLevel || 'N/A',
      pickupAgent: item.carrierDetails?.pickupDetails?.carrierName || 'N/A',
      status: item.shipmentDetails?.status,
      weight: Number(firstHU?.handlingWeight || 0),
      hazmat: firstPallet?.hazmat === 'Y' ? '03' : '-',
      pieces: Number(firstPallet?.pieces || 0)
    };
  });

  // Calculate runtime aggregates for the summary row metrics dynamically
  const totalWeight = parsedRows.reduce((sum, r) => sum + r.weight, 0);
  const totalPieces = parsedRows.reduce((sum, r) => sum + r.pieces, 0);
  const totalHazmatCount = parsedRows.filter(r => r.hazmat !== '-').length;

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box', bgcolor: '#f5f5f5', minHeight: '100vh' }}>

      {/* HEADER NAVIGATION BAR STRIP */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ bgcolor: '#eaeaea', px: 2, py: 1, borderBottom: '1px solid #ccc' }}
      >
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" sx={{ fontSize: '0.85rem' }}>
            Shipment Activity
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Consolidate Build
          </Typography>
        </Breadcrumbs>

        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate(PATH_DASHBOARD?.shipmentBuilding?.root)} variant="outlined" size="small" sx={{ color: '#333', borderColor: '#999', bgcolor: '#fff', textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
          <Button variant="contained" size="small" sx={{ bgcolor: '#a22', '&:hover': { bgcolor: '#811' }, textTransform: 'none', fontWeight: 600, px: 3 }}>
            Build
          </Button>
        </Stack>
      </Stack>

      {/* CORE DISPLAY HOUSING CONTAINER PANEL */}
      <Box sx={{ p: 2 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: '4px', minHeight: '400px' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            Consolidate Build
          </Typography>

          <TableContainer component={Box} sx={{ width: '100%', overflowX: 'auto', mb: 3 }}>
            <Table sx={{ minWidth: 1000 }} size="small">
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>SNo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Shipment PRO</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Origin</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Destination</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service Level</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pickup Agent</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Weight (lbs)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hazmat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Piece</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedRows.map((row) => (
                  <TableRow key={row.sNo} hover>
                    <TableCell>{row.sNo}</TableCell>
                    <TableCell sx={{ color: '#a22', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>
                      {row.proNum}
                    </TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.origin}</TableCell>
                    <TableCell>{row.destination}</TableCell>
                    <TableCell>{row.serviceLevel}</TableCell>
                    <TableCell>{row.pickupAgent}</TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" sx={{ bgcolor: '#5cb85c', color: '#fff', fontWeight: 500, height: '20px', fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell>{row.weight}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <span>{row.hazmat}</span>
                        {row.hazmat !== '-' && (
                          <Box sx={{ display: 'inline-flex', bgcolor: '#f0ad4e', borderRadius: '50%', p: 0.2 }}>
                            <WarningAmberIcon sx={{ fontSize: 12, color: '#000' }} />
                          </Box>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{row.pieces}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton onClick={() => {
                          const shipmentId = row.shipmentId;
                          const selectedShipment = shipmentViewData.find(shipment => shipment.shipmentId === shipmentId);
                          dispatch(setSelectedShipmentBuildObj(selectedShipment));
                          navigate(PATH_DASHBOARD.shipmentBuilding.shipmentView);
                        }} size="small"><VisibilityIcon fontSize="inherit" sx={{ color: '#333' }} /></IconButton>
                        <IconButton size="small"><DeleteIcon fontSize="inherit" sx={{ color: '#333' }} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {/* TOTAL SUMMARY AGGREGATE PANEL BLOCK FOOTER */}
                <TableRow sx={{ bgcolor: '#fff', '& td': { fontWeight: '700 !important', color: '#000' } }}>
                  <TableCell colSpan={8} />
                  <TableCell>{totalWeight}</TableCell>
                  <TableCell>{`0${totalHazmatCount}`}</TableCell>
                  <TableCell>{totalPieces}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Button onClick={() => navigate(PATH_DASHBOARD?.shipmentBuilding?.root)} variant="contained" size="small" sx={{ bgcolor: '#a22', '&:hover': { bgcolor: '#811' }, textTransform: 'none', px: 2, py: 0.75 }}>
            Add Shipment
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}

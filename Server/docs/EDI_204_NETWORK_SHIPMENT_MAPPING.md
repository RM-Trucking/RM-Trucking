# Network Shipment EDI 204

## Creation flow

`POST /shipment/flow` calls `createShipmentFlow`. The flow inserts the shipment and all dependent customer, party, commodity, carrier, address, and rate rows in one transaction. After the final commit, it calls `getNetworkShipmentView(conn, shipmentId)` so EDI is generated from the persisted response shape, not from partially inserted request data. The generated file is written as `shipment-{shipmentId}.edi` under `FIRST_EDI_204_REQUEST_PATH`. The API response contains only `shipmentId`.

EDI generation and file writing are deliberately after commit. A file-generation failure must not roll back a shipment that has already been committed; the request fails and the file can be retried from the persisted shipment.

The create request does not need to contain every EDI value. Values such as the generated `shipmentProNumber`, customer name, and persisted entity IDs come from `getNetworkShipmentView` after the insert completes. The output is intentionally a single physical line: `~` terminates each X12 segment, and no newline is added between segments.

## Segment mapping

| Segment    | Source or rule                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ISA        | Sender/receiver IDs and qualifiers are generator options. `ISA09-10` come from interchange date/time. `ISA13` is a nine-digit control number. `ISA15` is `P` by default.                                                                                                                                     |
| GS         | `GS02/03` use sender/receiver options; date/time use shipment date/time; `GS06` is the group control number. `GS01=SM`, `GS07=X`, `GS08=004010`.                                                                                                                                                             |
| ST         | `ST01=204`; `ST02` is the four-digit transaction control number.                                                                                                                                                                                                                                             |
| B2         | `B204=shipmentId`; `B202=RMFT` by default; `B205=L`, `B206=PP`, `B207=A`. These are template/business constants.                                                                                                                                                                                             |
| B2A        | `B2A01=00`, template constant.                                                                                                                                                                                                                                                                               |
| L11        | One per `customerDetails.customerReferenceNumbers[]`: `L1101=referenceNumber`. CID maps to `CR`, Forwarder Reference Number maps to `FN`; unknown reference types use `ZZ`. Shipment PRO maps to `PRO`.                                                                                                      |
| G62        | Qualifier `10` uses `shipmentDetails.shipmentDate/time`; pickup qualifier `39` uses the same values; delivery qualifier `17` uses `carrierDetails.deliveryDetails.deliveryPrimaryInfo.etaDate/time`, falling back to shipment date/time. Dates become `CCYYMMDD`, times `HHMM`.                              |
| AT5        | `AT502=shipmentDetails.serviceLevel`, `AT503=shipmentDetails.typeOfShipment`; qualifiers are template constants.                                                                                                                                                                                             |
| PLD        | One segment after AT5. Value is `commodityDetails.handlingUnits.length`.                                                                                                                                                                                                                                     |
| N1 BT      | `customerDetails.customerName/customerId`; `BT` and `92` are template constants. Address/contact are the shipper details in the supplied template.                                                                                                                                                           |
| S5 1 PU    | Pickup stop, template constant.                                                                                                                                                                                                                                                                              |
| N1 SF      | `shipperDetails.shipperName/entityId`; address is `shipperDetails.addressLine1/2/city/state/zipCode`; contact is `contactPersonName/phoneNumber`.                                                                                                                                                            |
| OID/L5/AT8 | Repeated for every `palletDetails[]` item nested under every handling unit. OID uses handling-unit count/weight; L5 uses item description and handling UOM; AT8 uses handling-unit weight and item pieces. If a handling unit has no pallet item, one fallback set is emitted using the handling-unit count. |
| S5 2 CU    | Consignee stop, template constant.                                                                                                                                                                                                                                                                           |
| N1 CN      | `consigneeDetails.consigneeName/entityId`; address/contact use the corresponding consignee fields.                                                                                                                                                                                                           |
| L3         | Total weight is the sum of handling-unit weights. `L305` is `shipmentRateDetails.carrierRateDetails.totalCarrierRate`; `L302=G`.                                                                                                                                                                             |
| SE         | `SE01` counts ST through SE inclusive; `SE02=ST02`.                                                                                                                                                                                                                                                          |
| GE/IEA     | One transaction/group. `GE02=GS06`; `IEA02=ISA13`.                                                                                                                                                                                                                                                           |

## Validation and optional data

Required fields are shipment ID/date/time/service/type, customer name/ID, shipper, consignee, and at least one handling unit. Missing optional values produce an empty element or omit the optional segment: PRO, references, contacts, ETA, and carrier total are optional. Address segments are emitted only when the party exists. EDI delimiters (`~`, `*`, `^`) are replaced with spaces and phone values are emitted as digits.

Control numbers must be unique across the sending system. The utility's in-process fallback is suitable for development only; production should pass values from a database sequence or outbound EDI table and reserve `ISA13`, `GS06`, and `ST02` atomically. Validate the final text by checking envelope counts, matching control numbers, `SE01`, required 204 segment order, and partner-specific code lists before transmission.

## Implementation sketch

```text
create shipment and related rows in transaction
commit
shipment = GET shipment/{shipmentId}
validate required fields
start ISA/GS/ST/B2/B2A
emit references, dates, parties, pickup stop
for handlingUnit in commodity.handlingUnits:
  for pallet in handlingUnit.palletDetails or [fallback]:
    emit OID, L5, AT8
emit delivery stop and L3
SE01 = number of segments from ST through SE inclusive
emit SE, GE, IEA
persist/transmit EDI and mark outbound status
```

## Sample output

The following output is generated from shipment `1027` with explicit controls `ISA13=000000001`, `GS06=000000001`, and `ST02=0001`. The generator emits digits-only phone values and uses an empty delivery time because the payload has no delivery ETA time. `SE01=29` counts `ST` through `SE`.

```edi
ISA*00*          *00*          *ZZ*SRINSOFT       *02*RMFT           *260908*0422*U*00401*000000001*0*P*>~
GS*SM*SRINSOFT*RMFT*20260908*0422*1*X*004010~
ST*204*0001~
B2**RMFT**1027*L*PP*A~
B2A*00~
L11*345345*FN~
L11*456456*CR~
L11*S0000001027*PRO~
G62*10*20260908*U*0422*LT~
AT5**Regular*AIR_IMPORT~
PLD*1~
N1*BT*check cust 23*92*104~
N3*Demo Address Line 1*Line 2~
N4*Demo city*Demo state*12345~
G61*IC*d*TE*2222222222~
S5*1*PU~
G62*39*20260908*U*0422*LT~
N1*SF*shipper 434*92*5435~
N3*Demo Address Line 1*Line 2~
N4*Demo city*Demo state*12345~
OID***LB*1*LB*1**1~
L5*1*description***Crate~
AT8*G*L*1*1~
S5*2*CU~
N1*CN*consignee 157*92*5440~
N3*line 1*~
N4*city*state*65756~
G61*IC*nm*TE*6598767868~
G62*17*20260908*U**LT~
L3*1*G***86.6**~
SE*29*0001~
GE*1*1~
IEA*1*000000001~
```

For the supplied shipment `1032`, the same rules produce `L11*S0000001032*PRO`, `OID***LB*1*LB*2**1`, `AT8*G*L*2*1`, `L3*2*G***266**`, and `SE*27*0003`. The nullable delivery ETA time remains empty in `G62*17*20260908*U**LT`. The hazmat fields are stored in the shipment response but are not represented by the provided 204 template, so no additional hazmat segment is emitted.

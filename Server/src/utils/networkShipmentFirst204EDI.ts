import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

export interface Edi204ControlNumbers {
	isaControlNumber: number;
	gsControlNumber: number;
	transactionSetControlNumber: number;
}

export interface Edi204Options {
	senderId?: string;
	receiverId?: string;
	senderQualifier?: string;
	receiverQualifier?: string;
	usageIndicator?: "P" | "T";
	isaVersion?: string;
	controlNumbers?: Partial<Edi204ControlNumbers>;
	interchangeDateTime?: Date;
}

export interface Edi204Result {
	edi: string;
	controlNumbers: Edi204ControlNumbers;
	segmentCount: number;
}

export interface Edi204FileResult extends Edi204Result {
	filePath: string;
}

type ShipmentView = any;

let nextControlNumber = 1;

function required(value: unknown, path: string): string {
	if (value === undefined || value === null || String(value).trim() === "") {
		throw new Error(`EDI 204 requires ${path}`);
	}
	return String(value);
}

function value(value: unknown): string {
	return value === undefined || value === null ? "" : String(value);
}

function ediValue(valueToFormat: unknown): string {
	return value(valueToFormat).replace(/[~*^]/g, " ").trim();
}

function dateYYMMDD(input: unknown): string {
	const text = required(input, "a date");
	const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (match) return `${match[1]}${match[2]}${match[3]}`;

	const date = new Date(text);
	if (Number.isNaN(date.getTime())) throw new Error(`Invalid EDI date: ${text}`);
	return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function timeHHMM(input: unknown, fallback: Date): string {
	const text = value(input);
	const match = text.match(/^(\d{2}):(\d{2})/);
	if (match) return `${match[1]}${match[2]}`;
	return `${String(fallback.getHours()).padStart(2, "0")}${String(fallback.getMinutes()).padStart(2, "0")}`;
}

function controlNumber(input: number | undefined, width: number): string {
	const number = input ?? nextControlNumber++;
	if (!Number.isInteger(number) || number < 0) throw new Error("EDI control numbers must be non-negative integers");
	return String(number).padStart(width, "0").slice(-width);
}

function phone(input: unknown): string {
	return ediValue(input).replace(/\D/g, "");
}

function referenceQualifier(referenceType: unknown): string {
	const normalized = value(referenceType).toUpperCase();
	if (normalized === "CID") return "CR";
	if (normalized === "FORWARDER REFERENCE NUMBER") return "FN";
	return "ZZ";
}

function addressSegments(prefix: "N3" | "N4", address: any): string[] {
	if (!address) return [];
	if (prefix === "N3") return [`N3*${ediValue(address.addressLine1)}*${ediValue(address.addressLine2)}`];
	return [`N4*${ediValue(address.city)}*${ediValue(address.state)}*${ediValue(address.zipCode)}`];
}

function addContact(segments: string[], person: any): void {
	if (person && (person.contactPersonName || person.phoneNumber)) {
		segments.push(`G61*IC*${ediValue(person.contactPersonName)}*TE*${phone(person.phoneNumber)}`);
	}
}

function buildLineItemSegments(segments: string[], handlingUnit: any, item: any, lineNumber: number): void {
	const pieces = item?.pieces ?? handlingUnit.handlingUnits;
	const weight = handlingUnit.handlingWeight;
	segments.push(`OID***LB*${ediValue(handlingUnit.handlingUnits)}*LB*${ediValue(weight)}**${lineNumber}`);
	segments.push(`L5*${lineNumber}*${ediValue(item?.description)}***${ediValue(handlingUnit.handlingUnitUOM)}`);
	segments.push(`AT8*G*L*${ediValue(weight)}*${ediValue(pieces)}`);
}

function validateShipment(shipment: ShipmentView): void {
	required(shipment?.shipmentId, "shipmentId");
	required(shipment?.shipmentDetails?.shipmentDate, "shipmentDetails.shipmentDate");
	required(shipment?.shipmentDetails?.shipmentTime, "shipmentDetails.shipmentTime");
	required(shipment?.shipmentDetails?.serviceLevel, "shipmentDetails.serviceLevel");
	required(shipment?.shipmentDetails?.typeOfShipment, "shipmentDetails.typeOfShipment");
	required(shipment?.customerDetails?.customerName, "customerDetails.customerName");
	required(shipment?.customerDetails?.customerId, "customerDetails.customerId");
	required(shipment?.customerDetails?.shipperDetails, "customerDetails.shipperDetails");
	required(shipment?.customerDetails?.consigneeDetails, "customerDetails.consigneeDetails");
	if (!shipment?.commodityDetails?.handlingUnits?.length) throw new Error("EDI 204 requires at least one handling unit");
}

export function generateNetworkShipmentFirst204EDI(shipment: ShipmentView, options: Edi204Options = {}): Edi204Result {
	validateShipment(shipment);

	const now = options.interchangeDateTime ?? new Date();
	const shipmentDetails = shipment.shipmentDetails;
	const customer = shipment.customerDetails;
	const shipper = customer.shipperDetails;
	const consignee = customer.consigneeDetails;
	const isaControlNumber = controlNumber(options.controlNumbers?.isaControlNumber, 9);
	const gsControlNumber = controlNumber(options.controlNumbers?.gsControlNumber, 9);
	const transactionSetControlNumber = controlNumber(options.controlNumbers?.transactionSetControlNumber, 4);
	const senderId = ediValue(options.senderId ?? "SRINSOFT").padEnd(15).slice(0, 15);
	const receiverId = ediValue(options.receiverId ?? "RMFT").padEnd(15).slice(0, 15);
	const senderQualifier = ediValue(options.senderQualifier ?? "ZZ").padEnd(2).slice(0, 2);
	const receiverQualifier = ediValue(options.receiverQualifier ?? "02").padEnd(2).slice(0, 2);
	const interchangeDate = dateYYMMDD(options.interchangeDateTime ?? shipmentDetails.shipmentDate);
	const interchangeTime = timeHHMM(shipmentDetails.shipmentTime, now);
	const segments: string[] = [
		`ISA*00*          *00*          *${senderQualifier}*${senderId}*${receiverQualifier}*${receiverId}*${interchangeDate.slice(2)}*${interchangeTime}*U*00401*${isaControlNumber}*0*${options.usageIndicator ?? "P"}*>`,
		`GS*SM*${ediValue(options.senderId ?? "SRINSOFT")}*${ediValue(options.receiverId ?? "RMFT")}*${interchangeDate}*${interchangeTime}*${Number(gsControlNumber)}*X*${options.isaVersion ?? "004010"}`,
		`ST*204*${transactionSetControlNumber}`,
		`B2**${ediValue(options.receiverId ?? "RMFT")}**${ediValue(shipment.shipmentId)}*L*PP*A`,
		"B2A*00",
	];

	for (const reference of customer.customerReferenceNumbers ?? []) {
		segments.push(`L11*${ediValue(reference.referenceNumber)}*${referenceQualifier(reference.referenceType)}`);
	}
	if (shipmentDetails.shipmentProNumber) segments.push(`L11*${ediValue(shipmentDetails.shipmentProNumber)}*PRO`);
	segments.push(`G62*10*${dateYYMMDD(shipmentDetails.shipmentDate)}*U*${timeHHMM(shipmentDetails.shipmentTime, now)}*LT`);
	segments.push(`AT5**${ediValue(shipmentDetails.serviceLevel)}*${ediValue(shipmentDetails.typeOfShipment)}`);
	segments.push(`PLD*${shipment.commodityDetails.handlingUnits.length}`);
	segments.push(`N1*BT*${ediValue(customer.customerName)}*92*${ediValue(customer.customerId)}`);
	segments.push(...addressSegments("N3", shipper), ...addressSegments("N4", shipper));
	addContact(segments, shipper);
	segments.push("S5*1*PU");
	segments.push(`G62*39*${dateYYMMDD(shipmentDetails.shipmentDate)}*U*${timeHHMM(shipmentDetails.shipmentTime, now)}*LT`);
	segments.push(`N1*SF*${ediValue(shipper.shipperName)}*92*${ediValue(shipper.entityId)}`);
	segments.push(...addressSegments("N3", shipper), ...addressSegments("N4", shipper));

	let lineNumber = 1;
	for (const handlingUnit of shipment.commodityDetails.handlingUnits) {
		const items = handlingUnit.palletDetails?.length ? handlingUnit.palletDetails : [undefined];
		for (const item of items) buildLineItemSegments(segments, handlingUnit, item, lineNumber++);
	}

	segments.push("S5*2*CU");
	segments.push(`N1*CN*${ediValue(consignee.consigneeName)}*92*${ediValue(consignee.entityId)}`);
	segments.push(...addressSegments("N3", consignee), ...addressSegments("N4", consignee));
	addContact(segments, consignee);
	const deliveryDate = shipment.carrierDetails?.deliveryDetails?.deliveryPrimaryInfo?.etaDate ?? shipmentDetails.shipmentDate;
	const deliveryTime = shipment.carrierDetails?.deliveryDetails?.deliveryPrimaryInfo?.etaTime;
	segments.push(`G62*17*${dateYYMMDD(deliveryDate)}*U*${deliveryTime ? timeHHMM(deliveryTime, now) : ""}*LT`);

	const totalWeight = shipment.commodityDetails.handlingUnits.reduce((sum: number, item: any) => sum + Number(item.handlingWeight || 0), 0);
	const totalCarrierRate = shipment.shipmentRateDetails?.carrierRateDetails?.totalCarrierRate;
	segments.push(`L3*${ediValue(totalWeight)}*G***${ediValue(totalCarrierRate)}**`);
	const segmentCount = segments.length - 2 + 1;
	segments.push(`SE*${segmentCount}*${transactionSetControlNumber}`);
	segments.push(`GE*1*${Number(gsControlNumber)}`);
	segments.push(`IEA*1*${isaControlNumber}`);

	return {
		edi: `${segments.join("~")}~`,
		controlNumbers: { isaControlNumber: Number(isaControlNumber), gsControlNumber: Number(gsControlNumber), transactionSetControlNumber: Number(transactionSetControlNumber) },
		segmentCount,
	};
}

export async function writeNetworkShipmentFirst204EDI(shipment: ShipmentView, options: Edi204Options = {}): Promise<Edi204FileResult> {
	const requestPath = process.env.FIRST_EDI_204_REQUEST_PATH?.trim();
	if (!requestPath) throw new Error("FIRST_EDI_204_REQUEST_PATH is not configured");

	const result = generateNetworkShipmentFirst204EDI(shipment, options);
	await mkdir(requestPath, { recursive: true });
	const filePath = join(requestPath, `shipment-${required(shipment?.shipmentId, "shipmentId")}.edi`);
	await writeFile(filePath, result.edi, { encoding: "utf8" });

	return { ...result, filePath };
}

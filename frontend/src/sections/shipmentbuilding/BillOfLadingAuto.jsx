import React, { useEffect, useRef } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import JsBarcode from 'jsbarcode';
import RMLogo from '../../assets/RM.png';
import Image from '../../components/image';

// Barcode sub-component to ensure accurate SVG rendering
const BarcodeImage = ({ value }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, String(value), {
                    format: 'CODE128',
                    width: 1.4,
                    height: 32,
                    displayValue: false,
                    margin: 0,
                });
            } catch (err) {
                console.error('Barcode rendering error:', err);
            }
        }
    }, [value]);

    return <svg ref={svgRef} style={{ width: '90%', height: '36px' }} />;
};

export default function BillOfLadingAuto({ data }) {
    if (!data) return null;

    // Flatten handling units and pallet line items
    const flatItems = [];
    let totalWeight = 0;
    let totalHandlingUnits = 0;
    let totalPieces = 0;

    const handlingUnitsList = data?.commodityDetails?.handlingUnits || [];
    handlingUnitsList.forEach((hu) => {
        totalHandlingUnits += parseInt(hu.handlingUnits || 0, 10);
        totalWeight += Number(hu.handlingWeight || 0);

        const pallets = hu.palletDetails || [{}];
        pallets.forEach((pallet) => {
            totalPieces += parseInt(pallet.pieces || 0, 10);
            flatItems.push({
                huType: hu.handlingUnitUOM || '',
                huQty: hu.handlingUnits || '',
                pieceType: pallet.piecesUOM || '',
                pieceQty: pallet.pieces || '',
                hm: pallet.hazmat === 'Y' ? 'X' : '',
                description: pallet.description || '',
                weight: hu.handlingWeight || '',
                class: hu.class ? String(hu.class).replace(/[^0-9]/g, '') : '',
                length: hu.handlingLength || '',
                width: hu.handlingWidth || '',
                height: hu.handlingHeight || '',
            });
        });
    });

    // Pagination Configuration
    const ROWS_PAGE_1 = 10;
    const ROWS_SUBSEQUENT_PAGE = 10;
    const pages = [];
    let remaining = [...flatItems];

    if (remaining.length <= ROWS_PAGE_1) {
        pages.push(remaining);
    } else {
        pages.push(remaining.slice(0, ROWS_PAGE_1));
        remaining = remaining.slice(ROWS_PAGE_1);
        while (remaining.length > 0) {
            pages.push(remaining.slice(0, ROWS_SUBSEQUENT_PAGE));
            remaining = remaining.slice(ROWS_SUBSEQUENT_PAGE);
        }
    }

    const totalPages = pages.length;
    const shipper = data?.customerDetails?.shipperDetails || {};
    const consignee = data?.customerDetails?.consigneeDetails || {};
    const carrier = data?.carrierDetails?.pickupDetails || {};
    const proNumber =
        data?.carrierDetails?.linehaulDetails?.linehaulPrimaryInfo?.carrierBillNumber ||
        '00744265994';
    const shipmentId = data?.shipmentId || '';
    const date = data?.shipmentDetails?.shipmentDate || '';

    return (
        <>
            <GlobalStyles
                styles={{
                    '@media print': {
                        '@page': {
                            size: 'A4 portrait',
                            margin: '8mm',
                        },
                        body: {
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact',
                            margin: 0,
                            padding: 0,
                            background: '#fff',
                        },
                        '.no-print': {
                            display: 'none !important',
                        },
                        '.bol-page-container': {
                            boxShadow: 'none !important',
                            margin: '0 !important',
                            pageBreakAfter: 'always !important',
                            breakAfter: 'page !important',
                        },
                    },
                    '.bol-wrapper': {
                        fontFamily: 'Arial, sans-serif',
                        color: '#000',
                        fontSize: '8.5pt',
                        width: '100%',
                    },
                    '.bol-page-container': {
                        width: '100%',
                        maxWidth: '190mm',
                        minHeight: '270mm',
                        margin: '10px auto',
                        background: '#fff',
                        border: '1.5px solid #000',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        pageBreakAfter: 'always',
                        breakAfter: 'page',
                    },
                    '.bol-section-header': {
                        background: '#000',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '8pt',
                        textAlign: 'center',
                        padding: '2px 4px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                    },
                    '.bol-table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '7.5pt',
                        textAlign: 'center',
                    },
                    '.bol-table th, .bol-table td': {
                        border: '1px solid #000',
                        padding: '4px 4px',
                        verticalAlign: 'middle',
                    },
                    '.bol-table th': {
                        background: '#f1f5f9',
                        fontWeight: 'bold',
                    },
                    '.bol-checkbox': {
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        border: '1px solid #000',
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        lineHeight: '10px',
                        fontSize: '7pt',
                    },
                }}
            />

            <div className="bol-wrapper">
                {pages.map((pageItems, index) => {
                    const pageNum = index + 1;
                    const isFirstPage = pageNum === 1;
                    const isLastPage = pageNum === totalPages;
                    const maxRows = isFirstPage ? ROWS_PAGE_1 : ROWS_SUBSEQUENT_PAGE;
                    const blanks = maxRows - pageItems.length;

                    return (
                        <div key={pageNum} >
                            <Image
                                disabledEffect
                                visibleByDefault
                                alt="R&M Trucking"
                                src={RMLogo}
                                sx={{ width: '40px', marginBottom: '10px', marginTop: 0, paddingTop: 0 }}
                            />
                            <div className="bol-page-container">
                                {/* TOP CONTENT */}
                                <div>
                                    {/* Meta Header */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '3px 6px',
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #000',
                                        }}
                                    >
                                        <div>Date: {date}</div>
                                        <div>
                                            Page: 0{pageNum}/0{totalPages}
                                        </div>
                                    </div>

                                    {/* Page 1 Header Routing */}
                                    {isFirstPage ? (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', borderBottom: '1px solid #000' }}>
                                                <div style={{ borderRight: '1px solid #000' }}>
                                                    <div className="bol-section-header">SHIP FROM</div>
                                                    <div style={{ padding: '4px 6px', minHeight: '52px', lineHeight: '1.25' }}>
                                                        <b>Name:</b> {shipper.shipperName}<br />
                                                        <b>Address:</b> {shipper.addressLine1} {shipper.addressLine2}<br />
                                                        <b>City/State/Zip:</b> {shipper.city}, {shipper.state} {shipper.zipCode}<br />
                                                        <b>Contact:</b> {shipper.contactPersonName} {shipper.phoneNumber}
                                                    </div>

                                                    <div className="bol-section-header">SHIP TO</div>
                                                    <div style={{ padding: '4px 6px', minHeight: '52px', lineHeight: '1.25' }}>
                                                        <b>Name:</b> {consignee.consigneeName}<br />
                                                        <b>Address:</b> {consignee.addressLine1} {consignee.addressLine2}<br />
                                                        <b>City/State/Zip:</b> {consignee.city}, {consignee.state} {consignee.zipCode}<br />
                                                        <b>Contact:</b> {consignee.contactPersonName} {consignee.phoneNumber}
                                                    </div>

                                                    <div className="bol-section-header">THIRD PARTY FREIGHT CHARGES BILL TO</div>
                                                    <div style={{ padding: '4px 6px', minHeight: '36px', lineHeight: '1.25' }}>
                                                        <b>Name:</b> {data?.customerDetails?.customerName}<br />
                                                        <b>Address / Station:</b> Station ID: {data?.customerDetails?.stationId}
                                                    </div>
                                                </div>

                                                <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    {/* Bill of Lading Block with Dedicated Barcode Space */}
                                                    <div>
                                                        <div style={{ paddingBottom: '4px' }}>
                                                            <div style={{ fontSize: '8pt' }}><b>Bill of Lading #:</b> {shipmentId}</div>
                                                            {/* Added Bill of Lading Barcode Image underneath the number */}
                                                            <div style={{ textAlign: 'center', margin: '4px 0', minHeight: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <BarcodeImage value={shipmentId} />
                                                            </div>
                                                        </div>

                                                        <div style={{ borderTop: '1.5px solid #000', paddingTop: '4px', fontSize: '7.5pt' }}>
                                                            <b>CARRIER NAME:</b> {carrier.carrierName || 'Dayton Freight Lines, Inc.'}<br />
                                                            <b>SCAC:</b> DAFG
                                                        </div>

                                                        {/* Pro Number Grid with Legal Disclaimer */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderTop: '1.5px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                                                            <div style={{ fontSize: '5pt', color: '#333', lineHeight: '1.1', paddingRight: '4px', textAlign: 'justify' }}>
                                                                This shipment is subject exclusively to the Uniform Bill of Lading, the liability limitations, and all other applicable provisions of the carrier's individual and collective tariffs, including NMFC 100-Y series.
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <span style={{ fontSize: '7.5pt' }}><b>Pro number:</b></span>
                                                                <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>{proNumber}</div>
                                                                <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center' }}>
                                                                    <BarcodeImage value={proNumber} />
                                                                </div>
                                                                <div style={{ fontSize: '6pt', transform: 'scale(0.9)' }}>DAFG BOL</div>
                                                            </div>
                                                        </div>

                                                        {/* Figma Specific Sub-Table: Skids, Drums, Long, Loose */}
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px', fontSize: '6.5pt', textAlign: 'center', borderTop: '1px solid #000' }}>
                                                            <thead>
                                                                <tr style={{ height: '14px' }}>
                                                                    <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Skids</th>
                                                                    <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Drums</th>
                                                                    <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Long</th>
                                                                    <th style={{ fontWeight: 'normal', width: '25%' }}>Loose</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr style={{ height: '16px', borderTop: '1px solid #000' }}>
                                                                    <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                    <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                    <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                    <td>&nbsp;</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Bottom Payment Terms Checkboxes */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-around',
                                                            padding: '6px 0 2px 0',
                                                            borderTop: '1.5px solid #000',
                                                            fontWeight: 'bold',
                                                            fontSize: '8pt'
                                                        }}
                                                    >
                                                        <label style={{ display: 'flex', alignItems: 'center' }}>Prepaid <span className="bol-checkbox" style={{ marginLeft: '6px' }}></span></label>
                                                        <label style={{ display: 'flex', alignItems: 'center' }}>Collect <span className="bol-checkbox" style={{ marginLeft: '6px' }}></span></label>
                                                        <label style={{ display: 'flex', alignItems: 'center' }}>3rd Party <span className="bol-checkbox" style={{ marginLeft: '6px' }}></span></label>
                                                    </div>
                                                </div>


                                            </div>

                                            <div className="bol-section-header">CUSTOMER ORDER INFORMATION</div>
                                            <div style={{ padding: '3px 6px', fontSize: '7.5pt', borderBottom: '1px solid #000' }}>
                                                MAWB: {shipmentId}, HWB: {shipmentId}, Pick up: {shipmentId}, Load: {shipmentId}, CID: {shipmentId}, SID: {shipmentId}, BOL: {shipmentId}
                                            </div>

                                            <div className="bol-section-header">NOTES</div>
                                            <div style={{ padding: '3px 6px', fontSize: '7.5pt', borderBottom: '1px solid #000', minHeight: '16px' }}>
                                                {carrier?.pickupAlertDetails?.inboundNotes || '-'}
                                            </div>
                                        </>
                                    ) : (
                                        /* Page 2+ Compressed Routing Header */
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '35% 35% 30%', borderBottom: '1px solid #000' }}>
                                                <div style={{ borderRight: '1px solid #000' }}>
                                                    <div className="bol-section-header">SHIP FROM</div>
                                                    <div style={{ padding: '4px', minHeight: '44px', fontSize: '7.5pt' }}>
                                                        <b>Name:</b> {shipper.shipperName}<br />
                                                        <b>Address:</b> {shipper.addressLine1}, {shipper.city}, {shipper.state}
                                                    </div>
                                                </div>
                                                <div style={{ borderRight: '1px solid #000' }}>
                                                    <div className="bol-section-header">SHIP TO</div>
                                                    <div style={{ padding: '4px', minHeight: '44px', fontSize: '7.5pt' }}>
                                                        <b>Name:</b> {consignee.consigneeName}<br />
                                                        <b>Address:</b> {consignee.addressLine1}, {consignee.city}, {consignee.state}
                                                    </div>
                                                </div>
                                                <div style={{ padding: '4px', fontSize: '7.5pt' }}>
                                                    <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <div style={{ borderTop: '1.5px solid #000', paddingTop: '4px', fontSize: '7.5pt' }}>
                                                                <b>CARRIER NAME:</b> {carrier.carrierName || 'Dayton Freight Lines, Inc.'}<br />
                                                                <b>SCAC:</b> DAFG
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderTop: '1.5px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                                                                <div style={{ fontSize: '5pt', color: '#333', lineHeight: '1.1', paddingRight: '4px', textAlign: 'justify' }}>
                                                                    This shipment is subject exclusively to the Uniform Bill of Lading, the liability limitations, and all other applicable provisions of the carrier's individual and collective tariffs, including NMFC 100-Y series.
                                                                </div>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <span style={{ fontSize: '7.5pt' }}><b>Pro number:</b></span>
                                                                    <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>{proNumber}</div>
                                                                    <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center' }}>
                                                                        <BarcodeImage value={proNumber} />
                                                                    </div>
                                                                    <div style={{ fontSize: '6pt', marginTop: '-2px', transform: 'scale(0.9)' }}>DAFG BOL</div>
                                                                </div>
                                                            </div>

                                                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px', fontSize: '6.5pt', textAlign: 'center', borderTop: '1px solid #000' }}>
                                                                <thead>
                                                                    <tr style={{ height: '14px' }}>
                                                                        <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Skids</th>
                                                                        <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Drums</th>
                                                                        <th style={{ borderRight: '1px solid #000', fontWeight: 'normal', width: '25%' }}>Long</th>
                                                                        <th style={{ fontWeight: 'normal', width: '25%' }}>Loose</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr style={{ height: '16px', borderTop: '1px solid #000' }}>
                                                                        <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                        <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                        <td style={{ borderRight: '1px solid #000' }}>&nbsp;</td>
                                                                        <td>&nbsp;</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 0 2px 0', borderTop: '1.5px solid #000', fontWeight: 'bold', fontSize: '8pt' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center' }}>Prepaid <span className="bol-checkbox" style={{ marginLeft: '6px' }}></span></label>
                                                            <label style={{ display: 'flex', alignItems: 'center' }}>Collect <span className="bol-checkbox" style={{ marginLeft: '6px' }}></span></label>
                                                            <label style={{ display: 'flex', alignItems: 'center' }}>3rd Party <span className="bol-checkbox" style={{ marginLeft: '6px' }}>✓</span></label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bol-section-header">CUSTOMER ORDER INFORMATION</div>
                                            <div style={{ padding: '3px 6px', fontSize: '7.5pt', borderBottom: '1px solid #000' }}>
                                                MAWB: {shipmentId}, HWB: {shipmentId}, Pick up: {shipmentId}, Load: {shipmentId}, CID: {shipmentId}, SID: {shipmentId}, BOL: {shipmentId}
                                            </div>
                                        </>
                                    )}

                                    {/* Commodity Table Grid */}
                                    <div className="bol-section-header">COMMODITY DESCRIPTION</div>
                                    <table className="bol-table">
                                        <thead>
                                            <tr>
                                                <th colSpan="2" style={{ width: '14%' }}>Handling Unit</th>
                                                <th colSpan="2" style={{ width: '14%' }}>Piece</th>
                                                <th rowSpan="2" style={{ width: '4%' }}>HM</th>
                                                <th rowSpan="2" style={{ width: '38%' }}>Commodity Description</th>
                                                <th rowSpan="2" style={{ width: '8%' }}>Weight<br />(lbs)</th>
                                                <th rowSpan="2" style={{ width: '6%' }}>Freight<br />Class</th>
                                                <th colSpan="3" style={{ width: '16%' }}>Dimensions</th>
                                            </tr>
                                            <tr>
                                                <th>Type</th>
                                                <th>QTY</th>
                                                <th>Type</th>
                                                <th>QTY</th>
                                                <th>L</th>
                                                <th>W</th>
                                                <th>H</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageItems.map((item, rowIdx) => (
                                                <tr key={rowIdx} style={{ height: '50px' }}>
                                                    <td>{item.huType}</td>
                                                    <td>{item.huQty}</td>
                                                    <td>{item.pieceType}</td>
                                                    <td>{item.pieceQty}</td>
                                                    <td><b>{item.hm}</b></td>
                                                    <td style={{ textAlign: 'left' }}>{item.description}</td>
                                                    <td style={{ textAlign: 'right' }}>{item.weight}</td>
                                                    <td>{item.class}</td>
                                                    <td>{item.length}</td>
                                                    <td>{item.width}</td>
                                                    <td>{item.height}</td>
                                                </tr>
                                            ))}

                                            {/* Fill Table Blanks */}
                                            {Array.from({ length: Math.max(0, blanks) }).map((_, bIdx) => (
                                                <tr key={`blank-${bIdx}`} style={{ height: '22px' }}>
                                                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                                                </tr>
                                            ))}

                                            {/* Total Row (Last Page Only) */}
                                            {isLastPage && (
                                                <tr style={{ fontWeight: 'bold', background: '#fafafa' }}>
                                                    <td>Total H/U</td>
                                                    <td>{totalHandlingUnits}</td>
                                                    <td>Total Pcs</td>
                                                    <td>{totalPieces}</td>
                                                    <td></td>
                                                    <td style={{ textAlign: 'right' }}>Total Shipping Weight:</td>
                                                    <td style={{ textAlign: 'right' }}>{totalWeight}</td>
                                                    <td colSpan="4"></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER SECTION */}
                                <div>
                                    {/* Valuation Statement (Every Page) */}
                                    <div style={{ borderTop: '1px solid #000', fontSize: '6.5pt', lineHeight: 1.2 }}>
                                        <div className="bol-section-header">VALUATION STATEMENT</div>
                                        <div style={{ padding: '3px 6px', textAlign: 'justify' }}>
                                            <b>NOTICE:</b> UNLESS A HIGHER VALUE IS DECLARED, THE SHIPPER HEREBY RELEASES THE PROPERTY TO A VALUE OF $0.50 PER POUND, SUBJECT TO A $50 MINIMUM. SEE THE TRANSPORTATION CONTRACT AND SERVICE CONDITIONS AT <span style={{ color: '#a22', fontWeight: 'bold' }}>WWW.RMTRUCKING.COM</span> FOR LIMITATIONS AND DECLARED SURCHARGES.
                                        </div>
                                    </div>


                                    {/* Legal & Signatures (Last Page Only) */}
                                    {isLastPage && (
                                        <div style={{ borderTop: '1.5px solid #000', fontSize: '6pt', lineHeight: 1.25 }}>
                                            {/* Top Header Note */}
                                            <div className="bol-section-header" style={{ fontSize: '7pt', padding: '3px 4px' }}>
                                                NOTE Liability Limitation for loss or damage in this shipment may be applicable. See 49 U.S.C. 14706(c)(1)(A) and (B).
                                            </div>

                                            {/* Legal Text Two-Column Layout */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', borderBottom: '1px solid #000' }}>
                                                <div style={{ borderRight: '1px solid #000', padding: '4px', textAlign: 'justify', fontSize: '5.5pt', color: '#111' }}>
                                                    RECEIVED, subject to classifications and tariffs in effect on the date of the issue of this Bill of Lading, the property described above in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated above with said carrier (the word carrier being understood throughout this contract and meaning any person or corporation is possession of the property under the contract) agrees to carry to its usual place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to the said destination. It is mutually agreed as to each carrier of all or any of, said property overall or any portion of said route to destination and as to each party at any time interested in all or any of said property, that every service to be performed hereunder shall be subject to all the bill of lading terms and conditions in the governing classification of the date of the shipment. Shipper hereby certifies that he is familiar with all the bill of lading terms and conditions in the governing classification and the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
                                                </div>
                                                <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '5.5pt', color: '#111' }}>
                                                    <div>
                                                        <b>SUBJECT TO SECTION 7:</b> If the shipment is to be delivered to the consignee without recourse on the consignor, the consignor shall sign the following statement: The carrier shall not make delivery of the shipment without payment of freight and all other lawful charges.
                                                    </div>
                                                    {/* Figma/Image layout: Shipper Signature field under Section 7 */}
                                                    <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '2px', fontSize: '12pt', fontWeight: 'bold' }}>
                                                        Shipper Signature
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Sign-Off and Checkbox Layout Block */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '33.3% 33.4% 33.3%', minHeight: '110px', fontSize: '7pt' }}>

                                                {/* Left: Shipper Signature / Date Block */}
                                                <div style={{ borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <div><b>SHIPPER SIGNATURE / DATE</b></div>
                                                        <div style={{ fontSize: '5.5pt', color: '#333', marginTop: '4px', lineHeight: '1.1' }}>
                                                            This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the DOT.
                                                        </div>
                                                    </div>
                                                    {/* Aligned to the right side with a 40px margin padding spacer from the edge */}
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '18pt', fontWeight: 'normal', color: '#000', minHeight: '40px', paddingBottom: '5px', paddingRight: '90px' }}>
                                                        /
                                                    </div>
                                                </div>


                                                {/* Middle: Trailer Loaded and Freight Counted Checkbox Columns */}
                                                <div style={{ borderRight: '1px solid #000', padding: '4px 6px', display: 'grid', gridTemplateColumns: '50% 50%', gap: '4px' }}>
                                                    {/* Column A: Trailer Loading State */}
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Trailer Loaded:</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                                                            <span className="bol-checkbox"></span> <span style={{ marginLeft: '4px', fontSize: '6.5pt' }}>By Shipper</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                                                            <span className="bol-checkbox"></span> <span style={{ marginLeft: '4px', fontSize: '6.5pt' }}>By Driver</span>
                                                        </div>
                                                    </div>
                                                    {/* Column B: Freight Piece Count State */}
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Freight Counted:</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                                                            <span className="bol-checkbox"></span> <span style={{ marginLeft: '4px', fontSize: '6.5pt' }}>By Shipper</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'top', margin: '4px 0' }}>
                                                            <span className="bol-checkbox" style={{ marginTop: '2px' }}></span>
                                                            <span style={{ marginLeft: '4px', fontSize: '6.5pt', lineHeight: '1.1' }}>By Driver/pallets said to contain</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                                                            <span className="bol-checkbox"></span> <span style={{ marginLeft: '4px', fontSize: '6.5pt' }}>By Driver/Pieces</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Carrier Signature / Pickup Date Block */}
                                                <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <div><b>CARRIER SIGNATURE / PICKUP DATE</b></div>
                                                        <div style={{ fontSize: '5.5pt', color: '#333', marginTop: '4px', lineHeight: '1.1' }}>
                                                            Carrier acknowledges receipt of packages and required placards. Carrier certifies emergency response information was made available and/or carrier has the DOT emergency response guidebook or equivalent documentation in the vehicle. Property described above is received in good order, except as noted.
                                                        </div>
                                                    </div>
                                                    {/* Aligned to the right side with a 40px margin padding spacer from the edge */}
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '18pt', fontWeight: 'normal', color: '#000', minHeight: '40px', paddingBottom: '5px', paddingRight: '90px' }}>
                                                        /
                                                    </div>
                                                </div>


                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
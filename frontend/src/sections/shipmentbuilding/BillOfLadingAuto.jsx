import React, { useState, useEffect } from 'react';
import './BillOfLadingAuto.css';

const BillOfLadingAuto = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated API Call
        const fetchShipmentData = async () => {
            try {
                const result = {
                    date: '02/19/2026',
                    bolNumber: '64176852',
                    proNumber: '00744265994',
                    scac: 'DAFG',
                    carrierName: 'Dayton Freight Lines, Inc.',
                    shipFrom: {
                        name: 'R & M TRUCKING CO',
                        address: '840 W GREEN ST STE 100',
                        cityStateZip: 'BENSENVILLE, IL 60106',
                        contact: ''
                    },
                    shipTo: {
                        name: 'Valeo',
                        address: '1231 N A Ave',
                        cityStateZip: 'SEYMOUR, IN 47274',
                        contact: ''
                    },
                    commodities: Array.from({ length: 25 }, (_, i) => ({
                        id: i + 1,
                        type: 'Skid',
                        qty: 2,
                        pieceType: 'Skid',
                        pieceQty: 50,
                        hm: i % 3 === 0 ? 'X' : '-',
                        description: i % 2 === 0 ? 'UN1234, Biomedical waste N.O.S., (Sulfate), 2.4A' : 'Furniture, Racks',
                        weight: 2000,
                        freightClass: 60,
                        l: 20,
                        w: 20,
                        h: 20
                    })),
                    totals: {
                        huQty: 50,
                        pieceQty: 1250,
                        hmCount: 8,
                        totalWeight: 50000
                    }
                };

                setData(result);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load shipment data:', err);
                setLoading(false);
            }
        };

        fetchShipmentData();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div>Loading template...</div>;
    if (!data) return <div>Failed to load data.</div>;

    return (
        <div className="bol-print-container">
            {/* Print Trigger Button */}
            <div className="no-print" style={{ padding: '15px', textAlign: 'center' }}>
                <button onClick={handlePrint} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Print Document
                </button>
            </div>

            {/* DOCUMENT WRAPPER */}
            <div className="bol-sheet">

                {/* TOP HEADER & ADDRESSES */}
                <div className="header-block">
                    <div className="header-top border-box">
                        <div className="header-left">
                            <h1 className="company-logo">R&M</h1>
                            <div><strong>Date :</strong> {data.date}</div>
                        </div>
                        <div className="header-right">
                            <div className="page-counter">Page: <span className="page-number"></span></div>
                        </div>
                    </div>

                    <div className="main-grid border-box">
                        <div className="left-column border-right">
                            <div className="section-header-inline">SHIP FROM</div>
                            <div className="info-block">
                                <div><strong>Name :</strong> {data.shipFrom.name}</div>
                                <div><strong>Address :</strong> {data.shipFrom.address}</div>
                                <div><strong>City/State/Zip :</strong> {data.shipFrom.cityStateZip}</div>
                            </div>

                            <div className="section-header-inline">SHIP TO</div>
                            <div className="info-block">
                                <div><strong>Name :</strong> {data.shipTo.name}</div>
                                <div><strong>Address :</strong> {data.shipTo.address}</div>
                                <div><strong>City/State/Zip :</strong> {data.shipTo.cityStateZip}</div>
                            </div>

                            <div className="section-header-inline">THIRD PARTY FREIGHT CHARGES BILL TO:</div>
                            <div className="info-block">
                                <div><strong>Name :</strong></div>
                                <div><strong>Address :</strong></div>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="bol-info border-bottom">
                                <div><strong>Bill of Lading #:</strong> {data.bolNumber}</div>
                                <div className="barcode-placeholder">BAR CODE SPACE</div>
                            </div>
                            <div className="carrier-info">
                                <div><strong>CARRIER NAME:</strong> {data.carrierName}</div>
                                <div><strong>SCAC:</strong> {data.scac}</div>
                                <div className="pro-number"><strong>Pro number:</strong> {data.proNumber}</div>
                                <div className="barcode-area">
                                    <div className="mock-barcode">||| ||||| |||| ||||| |||</div>
                                    <small>{data.scac}-BOL</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="section-header">CUSTOMER ORDER INFORMATION</div>
                    <div className="order-info-box border-box">
                        MAWB : {data.bolNumber}, HWB : {data.bolNumber}, Pick up : {data.bolNumber}, Load : {data.bolNumber}, CID : {data.bolNumber}, SID : {data.bolNumber}, BOL : {data.bolNumber}
                    </div>
                </div>

                {/* COMMODITY TABLE (AUTOMATICALLY SPLITS ACROSS PAGES) */}
                <div className="section-header">COMMODITY DESCRIPTION</div>
                <table className="commodity-table">
                    <thead>
                        <tr>
                            <th colSpan="2">Handling Unit</th>
                            <th colSpan="2">Piece</th>
                            <th rowSpan="2">HM</th>
                            <th rowSpan="2">Commodity Description</th>
                            <th rowSpan="2">Weight lbs</th>
                            <th rowSpan="2">Freight Class</th>
                            <th colSpan="3">Dimensions</th>
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
                        {data.commodities.map((item) => (
                            <tr key={item.id} className="avoid-break">
                                <td>{item.type}</td>
                                <td>{item.qty}</td>
                                <td>{item.pieceType}</td>
                                <td>{item.pieceQty}</td>
                                <td>{item.hm}</td>
                                <td className="align-left">{item.description}</td>
                                <td>{item.weight}</td>
                                <td>{item.freightClass}</td>
                                <td>{item.l}</td>
                                <td>{item.w}</td>
                                <td>{item.h}</td>
                            </tr>
                        ))}
                        <tr className="totals-row avoid-break">
                            <td><strong>Total H/U</strong></td>
                            <td><strong>{data.totals.huQty}</strong></td>
                            <td><strong>Piece</strong></td>
                            <td><strong>{data.totals.pieceQty}</strong></td>
                            <td><strong>{data.totals.hmCount}</strong></td>
                            <td></td>
                            <td><strong>Total Shipping Weight</strong></td>
                            <td><strong>{data.totals.totalWeight}</strong></td>
                            <td colSpan="3"></td>
                        </tr>
                    </tbody>
                </table>

                {/* FOOTER & SIGNATURES (KEPT TOGETHER AT END) */}
                <div className="footer-block avoid-break">
                    <div className="section-header">VALUATION STATEMENT</div>
                    <div className="legal-statement border-box">
                        NOTICE: UNLESS A HIGHER VALUE IS DECLARED, THE SHIPPER HEREBY RELEASES THE PROPERTY TO A VALUE OF $0.50 PER POUND, SUBJECT TO A $50 MINIMUM.
                    </div>

                    <div className="section-header">NOTE Liability Limitation</div>
                    <div className="notes-grid border-box">
                        <div className="note-left border-right">
                            NOTE Liability Limitation for loss or damage in this shipment may be applicable. See 49 U.S.C. 14706(c)(1)(A) and (B).
                        </div>
                        <div className="note-right">
                            SUBJECT TO SECTION 7 : If the shipment is to be delivered without recourse on consignor, consignor shall sign.
                        </div>
                    </div>

                    <div className="signatures-grid border-box">
                        <div className="sig-column border-right">
                            <div className="sig-title">SHIPPER SIGNATURE / DATE</div>
                            <div className="sig-line">/</div>
                        </div>
                        <div className="sig-column border-right checkboxes-column">
                            <div><strong>Trailer Loaded:</strong></div>
                            <label><input type="checkbox" /> By Shipper</label>
                            <label><input type="checkbox" /> By Driver</label>
                        </div>
                        <div className="sig-column">
                            <div className="sig-title">CARRIER SIGNATURE / PICKUP DATE</div>
                            <div className="sig-line">/</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillOfLadingAuto;

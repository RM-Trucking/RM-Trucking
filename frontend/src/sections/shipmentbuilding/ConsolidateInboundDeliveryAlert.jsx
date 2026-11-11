import React from 'react';
import Image from '../../components/image';
import RMLogo from '../../assets/RM.png';

export default function ConsolidateInboundDeliveryAlert({ data }) {
    // Extract tracking information from the data structure passed down
    // Fallbacks provided to match your functional hook state inputs
    const sharedMetadata = {
        date: data?.date || '',
        labelCount: data?.deliveryItems?.length || 0,
        pickupCompany: data?.pickupCompany || "",
        pickupAddress: data?.pickupAddress || "",
        mawb: data?.mawb || "",
        rdyDate: data?.rdyDate || "",
        totalPcsWeight: data?.totalPcsWeight || "",
        agentName: data?.agentName || "",
        agentNoa: data?.agentNoa || "",
        agentFax: data?.agentFax || "",
        agentCityState: data?.agentCityState || ""
    };

    const deliveryItems = data?.deliveryItems || [];

    // Helper chunking engine to segment table items into 3 rows maximum per printable page wrapper
    const chunkRows = (array, size) => {
        const chunked = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    };

    const pagesData = chunkRows(deliveryItems, 3);
    const totalPages = Math.max(pagesData.length, 1); // Ensure at least 1 page prints if empty

    // Format index helpers to mirror single digit numbers to layout configurations (e.g., '02')
    const formatIndex = (num) => String(num).padStart(2, '0');

    return (
        <div className="bol-print-container">
            {/* Dynamic Mapping Layout Engine */}
            {pagesData.length > 0 ? (
                pagesData.map((pageRows, index) => (
                    <PrintPage
                        key={index}
                        rows={pageRows}
                        pageNumber={index + 1}
                        totalPages={totalPages}
                        metadata={sharedMetadata}
                        formatIndex={formatIndex}
                    />
                ))
            ) : (
                /* Empty structural state fallback sheet if no items are passed */
                <PrintPage
                    rows={[]}
                    pageNumber={1}
                    totalPages={1}
                    metadata={sharedMetadata}
                    formatIndex={formatIndex}
                />
            )}

            {/* Embedded Style Block Injection targeting useReactToPrint output context directly */}
            <style>{`
        @media print {
          .page-break-wrapper {
            page-break-after: always;
            break-after: page;
          }
          .page-break-wrapper:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
        }

        .page-break-wrapper {
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: #fff;
          padding: 0.4in;
        }

        /* Top Header Grid Area Styling */
        .header-layout-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .logo-branding-block {
          display: flex;
          align-items: flex-start;
        }
        .logo-wordmark {
          font-size: 42px;
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -2px;
          color: #000;
        }
        .logo-sub-label {
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1.5px;
          margin-top: 1px;
          border-top: 2px solid #000;
          padding-top: 2px;
          text-align: center;
        }
        .company-contact-info {
          font-size: 14px;
          margin-left: 25px;
          line-height: 1.5;
          font-weight: bold;
        }

       /* Gray Metadata Sidebar Card Box */
            .inbound-alert-card {
            border: 1px solid #c0c0c0;
            border-radius: 8px;
            background-color: #dcdcdc;
            width: 290px;
            box-sizing: border-box;
            padding: 8px 10px 10px 10px;
            font-family: Arial, Helvetica, sans-serif;
            }
            .alert-card-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #000;
            margin-bottom: 6px;
            padding-left: 2px;
            border-bottom : 1px solid rgba(143, 143, 143, 1);
            }
            .alert-card-data-row {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
            }
            .alert-card-data-row:last-child {
            margin-bottom: 0;
            }
            .cell-label {
            font-size: 11px;
            color: #000;
            width: 75px;
            flex-shrink: 0;
            }
            .cell-value-input {
            background-color: #ffffff;
            border: 1px solid #b0b0b0;
            border-radius: 4px;
            padding: 3px 6px;
            font-size: 11px;
            color: #000;
            flex-grow: 1;
            min-height: 16px;
            display: flex;
            align-items: center;
            }
            /* Half-width layout fields for Label Count and Page Number row */
            .split-inputs-container {
            display: flex;
            gap: 10px;
            width: 100%;
            }
            .split-input-group {
            display: flex;
            align-items: center;
            flex: 1;
            }
            .split-input-group .cell-label {
            width: auto;
            margin-right: 6px;
            }
            .split-input-group .cell-value-input {
            width: 45px;
            flex-grow: 0;
            text-align: center;
            justify-content: center;
            }


        /* Pickup and Agent Segment Matrix block styling */
        .logistics-data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .black-header-row th {
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          padding: 4px;
          letter-spacing: 1px;
          border: 1px solid #000000;
        }
        .logistics-cell-data {
          border: 1px solid #000000;
          width: 50%;
          vertical-align: top;
          padding: 6px 8px;
          font-size: 11px;
          line-height: 1.4;
        }
        .logistics-meta-strip {
          display: flex;
          border-top: 1px solid #000000;
          margin: 6px -8px -6px -8px;
        }
        .meta-strip-label {
          width: 130px;
          font-weight: normal;
          color: #000;
          border-right: 1px solid #000000;
          padding: 3px 8px;
        }
        .meta-strip-value {
          padding: 3px 8px;
          flex-grow: 1;
        }

        /* Primary Delivery Table Breakdowns */
        .delivery-grid-table {
          width: 100%;
          border-collapse: collapse;
        }
        .delivery-grid-table th {
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          padding: 5px;
          border: 1px solid #000000;
          text-align: center;
        }
        .delivery-grid-table td {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 11px;
          vertical-align: top;
          line-height: 1.4;
        }
      `}</style>
        </div>
    );
}

// Sub-Component Rendering One Standalone Printed Sheet Page View
function PrintPage({ rows, pageNumber, totalPages, metadata, formatIndex }) {
    return (
        <div className="page-break-wrapper">

            {/* 1. DOCUMENT UPPER MAIN IDENTITY HEADERS */}
            <div className="header-layout-grid">
                <div className="logo-branding-block" style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <div>
                        <Image
                            disabledEffect
                            visibleByDefault
                            alt="R&M Trucking"
                            src={RMLogo}
                            sx={{ width: '180px', marginBottom: '10px', marginTop: 0, paddingTop: 0 }}
                        />
                    </div>

                    {/* Shifting the contact details block directly to the right margin end boundary */}
                    <div className="company-contact-info" style={{ marginRight: 'auto', textAlign: 'left', marginTop : '20px' }}>
                        840 E Green St STE 100,<br />
                        Bensenville, IL 60106<br />
                        Ph# (847)616-1080 Fax# (847)616-8811
                    </div>
                </div>


                {/* Gray Side Alert Metadata Box matching image perfectly */}
                <div className="inbound-alert-card">
                    <div className="alert-card-title">Inbound Delivery Alert</div>

                    {/* Date Row with padding-bottom to create clean space before the divider line */}
                    <div
                        className="alert-card-data-row"
                        style={{
                            borderBottom: '1px solid rgba(143, 143, 143, 1)',
                            paddingBottom: '6px',   /* Adjust this value to increase or decrease the spacing */
                            marginBottom: '8px'     /* Adds complementary space below the line before the next row starts */
                        }}
                    >
                        <div className="cell-label">Date :</div>
                        <div className="cell-value-input">{metadata.date}</div>
                    </div>


                    {/* Label & Page Metrics Row */}
                    <div className="alert-card-data-row">
                        <div className="split-inputs-container">

                            <div className="split-input-group">
                                <div className="cell-label">Label Count:</div>
                                <div className="cell-value-input">{formatIndex(metadata.labelCount)}</div>
                            </div>

                            <div className="split-input-group">
                                <div className="cell-label">Page No :</div>
                                <div className="cell-value-input">{`${formatIndex(pageNumber)}/${formatIndex(totalPages)}`}</div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* 2. PICKUP AND AGENT INFORMATION SPLIT BAR */}
            <table className="logistics-data-table">
                <thead>
                    <tr className="black-header-row">
                        <th style={{ width: '50%' }}>Pick Up</th>
                        <th style={{ width: '50%' }}>Agent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="logistics-cell-data">
                            <div style={{ fontWeight: 'normal', marginBottom: '4px' }}>{metadata.pickupCompany}</div>
                            <div style={{ color: '#333', marginBottom: '8px' }}>{metadata.pickupAddress}</div>

                            <div className="logistics-meta-strip">
                                <div className="meta-strip-label">MAWB</div>
                                <div className="meta-strip-value">{metadata.mawb}</div>
                            </div>
                            <div className="logistics-meta-strip">
                                <div className="meta-strip-label">RDY</div>
                                <div className="meta-strip-value">{metadata.rdyDate}</div>
                            </div>
                            <div className="logistics-meta-strip" style={{ margin: '6px -8px -6px -8px' }}>
                                <div className="meta-strip-label">PCS / WEIGHT</div>
                                <div className="meta-strip-value">{metadata.totalPcsWeight}</div>
                            </div>
                        </td>

                        <td className="logistics-cell-data">
                            <div style={{ marginBottom: '2px' }}>{metadata.agentName}</div>
                            <div style={{ marginBottom: '2px' }}>NOA {metadata.agentNoa}</div>
                            <div style={{ marginBottom: '2px' }}>{metadata.agentFax}</div>
                            <div>{metadata.agentCityState}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 3. LOGISTICS DISPATCH MATRIX (MAXIMUM OF 3 ROWS PER PAGE BLOCK) */}
            <table className="delivery-grid-table">
                <thead>
                    <tr className="black-header-row">
                        <th style={{ width: '6%' }}>SNo</th>
                        <th style={{ width: '14%' }}>HAWB</th>
                        <th style={{ width: '14%' }}>Pcs / Weight</th>
                        <th style={{ width: '33%' }}>Delivery Address</th>
                        <th style={{ width: '33%' }}>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                            <td style={{ textAlign: 'center' }}>{formatIndex((pageNumber - 1) * 3 + (rIdx + 1))}</td>
                            <td>{row.hawb}</td>
                            <td>{row.pcsWeight}</td>
                            <td>
                                <span style={{ fontWeight: 'bold' }}>{row.deliveryName}</span><br />
                                {row.addressLine}<br />
                                {row.contactPhone && <span>{row.contactPhone}<br /></span>}
                                {row.attentionTarget && <span>{row.attentionTarget}</span>}
                            </td>
                            <td>{row.notes}</td>
                        </tr>
                    ))}

                    {/* Structural Row Padding Fix: Fills page height gracefully if index rows drop below 3 */}
                    {/* {rows.length < 3 && Array.from({ length: 3 - rows.length }).map((_, emptyIdx) => (
                        <tr key={`empty-row-${emptyIdx}`} style={{ height: '70px' }}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        </tr>
                    ))} */}
                </tbody>
            </table>

        </div>
    );
}


import GlobalStyles from '@mui/material/GlobalStyles';

export default function BillOfLadingAuto() {
    return (
        <>
            <GlobalStyles
                styles={{
                    '@media print': {
                        '@page': {
                            size: 'A4 portrait',
                            margin: '10mm',
                        },
                        'body': {
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact',
                        },
                        '.no-print': {
                            display: 'none !important',
                        },
                    },
                }}
            />

            {/* Your BOL Template HTML/JSX Here */}
            <div className="bol-wrapper">
                {/* Table, Headers, Barcodes, etc. */}
            </div>
        </>
    );
}
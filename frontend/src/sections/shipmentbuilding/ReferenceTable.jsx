import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import './ReferenceTable.css';

const TYPE_OPTIONS = [
    "MAWB", "HWB", "Ocean BOL", "Booking", "Pick up", "IT", "Load", "GO",
    "Order", "Forwarder Reference Number", "Container", "PO", "CID", "SID",
    "Customer Number", "BOL", "Other"
];

// FIXED: Clean destructured parameters with proper layout positioning
const ReferenceTable = ({ control, errors, setValue, clearErrors }) => {
    
    // Explicit array state structure initializes safely
    const [rows, setRows] = useState([
        { id: 1, type: '', referenceNo: '' }
    ]);

    // Handle updates for dropdowns and text values smoothly
    const handleInputChange = (id, field, value) => {
        setRows(prevRows =>
            prevRows.map(row => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // Add a new empty row with robust string fallback layers
    const handleAddRow = () => {
        const hasEmptyFields = rows.some(
            row => !(row.type || '').toString().trim() || !(row.referenceNo || '').toString().trim()
        );

        if (hasEmptyFields) {
            toast.error('Please fill out all fields before adding a new row.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
                style: { fontSize: '14px' }
            });
            return;
        }

        const newRow = {
            id: Date.now(),
            type: '',
            referenceNo: ''
        };
        setRows([...rows, newRow]);
    };

    // Safe deletion configuration
    const handleDeleteRow = (id) => {
        setRows(rows.filter(row => row.id !== id));
    };

    // Synchronizes the local data arrays to react-hook-form
    useEffect(() => {
        if (setValue) {
            setValue('referenceTableRows', rows);
        }

        const hasEmptyFields = rows.some(
            row => !(row.type || '').toString().trim() || !(row.referenceNo || '').toString().trim()
        );

        if (!hasEmptyFields && clearErrors) {
            clearErrors('referenceTableRows');
        }
    }, [rows, setValue, clearErrors]);

    return (
        <div className="table-container">
            <table className="reference-table">
                <thead>
                    <tr>
                        <th style={{ width: '15%' }}>Sno</th>
                        <th style={{ width: '35%' }}>Type</th>
                        <th style={{ width: '35%' }}>Reference #</th>
                        <th style={{ width: '15%' }}>Actions</th>
                    </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
                    {rows.map((row, index) => (
                        <tr key={row.id}>
                            <td className="sno-cell">
                                {String(index + 1).padStart(2, '0')}
                            </td>
                            <td>
                                <select
                                    value={row.type || ""}
                                    onChange={(e) => handleInputChange(row.id, 'type', e.target.value)}
                                    className="table-input"
                                >
                                    <option value="" disabled>Select Type</option>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={row.referenceNo || ""}
                                    onChange={(e) => handleInputChange(row.id, 'referenceNo', e.target.value)}
                                    placeholder="Enter Reference #"
                                    className="table-input"
                                />
                            </td>
                            <td className="action-cell">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteRow(row.id)}
                                    className="delete-btn"
                                    title="Delete Row"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="add-btn-container">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="add-btn"
                    title="Add New Row"
                >
                    +
                </button>
            </div>

            <ToastContainer />
        </div>
    );
};

export default ReferenceTable;

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Required library styles
import './ReferenceTable.css';

const TYPE_OPTIONS = [
    "MAWB", "HWB", "Ocean BOL", "Booking", "Pick up", "IT", "Load", "GO",
    "Order", "Forwarder Reference Number", "Container", "PO", "CID", "SID",
    "Customer Number", "BOL", "Other"
];

const ReferenceTable = ({ control,
    errors,
    setValue,
    clearErrors, }) => {
    const [rows, setRows] = useState([
        { id: 1, type: '', referenceNo: '' },
    ]);

    // Handle changes for dropdown and text input
    const handleInputChange = (id, field, value) => {
        setRows(prevRows =>
            prevRows.map(row => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // Add a new empty row with library validation
    const handleAddRow = () => {
        const hasEmptyFields = rows.some(
            row => !row.type.trim() || !row.referenceNo.trim()
        );

        if (hasEmptyFields) {
            // Trigger beautiful React toast error notification
            toast.error('Please fill out all fields before adding a new row.', {
                position: "top-right", // Changed from bottom-center
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

    // Delete a specific row
    const handleDeleteRow = (id) => {
        setRows(rows.filter(row => row.id !== id));
    };

    // Automatically synchronize local rows with react-hook-form state
    useEffect(() => {
        if (setValue) {
            setValue('referenceTableRows', rows);
        }

        // Clear any global react-hook-form errors for this field if rows become valid
        const hasEmptyFields = rows.some(row => !row.type.trim() || !row.referenceNo.trim());
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
                                    value={row.type}
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
                                    value={row.referenceNo}
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

            {/* Add Row Button at the bottom right */}
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

            {/* Global notification container injected into layout */}
            <ToastContainer />
        </div>
    );
};

export default ReferenceTable;

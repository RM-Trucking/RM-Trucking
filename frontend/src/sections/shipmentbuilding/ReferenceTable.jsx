import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    IconButton,Box
} from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';
import './ReferenceTable.css';
import Iconify from '../../components/iconify';

const TYPE_OPTIONS = [
    "MAWB", "HWB", "Ocean BOL", "Booking", "Pick up", "IT", "Load", "GO",
    "Order", "Forwarder Reference Number", "Container", "PO", "CID", "SID",
    "Customer Number", "BOL", "Other"
];

// FIXED: Removed TypeScript annotations to match plain JS .jsx files
export default function ReferenceTable({ type, control, errors, setValue, clearErrors, getValues, watch }) {

    // Handle updates for dropdowns and text values smoothly
    const handleInputChange = (id, field, value) => {
        // 1. Get the current array from the form state
        const currentRows = watch('referenceTableRows') || [];

        // 2. Map through and update the specific field in the matching row
        const updatedRows = currentRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        );

        // 3. Update the form value and trigger validation/dirty state
        setValue('referenceTableRows', updatedRows, {
            shouldValidate: true,
            shouldDirty: true
        });
    };


    // Add a new empty row with robust string fallback layers
    const handleAddRow = () => {
        // 1. Get the current array from the form state
        const currentRows = watch('referenceTableRows') || [];

        // 2. Check if any existing row has empty fields (using trim)
        const hasEmptyFields = currentRows.some(
            row => !(row.referenceType || '').toString().trim() || !(row.referenceNumber || '').toString().trim()
        );

        // 3. Block addition and show toast if empty fields are found
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

        // 4. Create the new row object
        const newRow = {
            id: Date.now(),
            referenceType: '',
            referenceNumber: '',
            isChecked: false,
        };

        // 5. Append the new row and update the form value
        setValue('referenceTableRows', [...currentRows, newRow], {
            shouldValidate: true,
            shouldDirty: true
        });
    };


    // Safe deletion configuration
    const handleDeleteRow = (id) => {
        // 1. Get the current array from the form state
        const currentRows = watch('referenceTableRows') || [];

        // 2. Filter out the row with the matching id
        const updatedRows = currentRows.filter(row => row.id !== id);

        // 3. Update the form value and sync the form's state
        setValue('referenceTableRows', updatedRows, {
            shouldValidate: true,
            shouldDirty: true
        });
    };


    useEffect(() => {
        const currentRows = watch('referenceTableRows') || [];
        const hasEmptyFields = currentRows.some(
            row => !(row.referenceType || '').toString().trim() || !(row.referenceNumber || '').toString().trim()
        );
        if (!hasEmptyFields && clearErrors) {
            clearErrors('referenceTableRows');
        }
    }, [watch('referenceTableRows'), setValue, clearErrors]);

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
                    {getValues('referenceTableRows')?.map((row, index) => (
                        <tr key={row.id}>
                            <td className="sno-cell">
                                {String(index + 1).padStart(2, '0')}
                            </td>
                            <td>
                                <select
                                    value={row.referenceType || ""}
                                    onChange={(e) => handleInputChange(row.id, 'referenceType', e.target.value)}
                                    className="table-input"
                                    disabled={type === 'View'}
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
                                    value={row.referenceNumber || ""}
                                    onChange={(e) => handleInputChange(row.id, 'referenceNumber', e.target.value)}
                                    placeholder="Enter Reference #"
                                    className="table-input"
                                    maxLength={100}
                                    disabled={type === 'View'}
                                />

                            </td>
                            <td className="action-cell">
                                {type !== 'View' && <IconButton onClick={() => {
                                    handleDeleteRow(row.id)
                                }}>
                                    <Iconify icon="material-symbols:delete-rounded" sx={{ color: '#000', pointerEvents: 'none' }} />
                                </IconButton>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {
                watch('referenceTableRows').length === 0 && <Box sx={{p:1.5, textAlign : 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius : '12px'}}>No Rows</Box>
            }

            {type !== 'View' && <div className="add-btn-container">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="add-btn"
                    title="Add New Row"
                >
                    +
                </button>
            </div>}

            <ToastContainer />
        </div>
    );
}
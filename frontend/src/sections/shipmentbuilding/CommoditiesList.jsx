import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import { useForm, Controller, useFieldArray, useWatch, set, get } from 'react-hook-form';

import {
  Box, Stepper, Step, StepLabel, Typography, TextField, MenuItem,
  Button, Paper, Alert, Snackbar, Checkbox, FormControlLabel, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, StepConnector, stepConnectorClasses, styled, Stack, Divider, Accordion,
  AccordionSummary, AccordionDetails, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, ListItemText, CircularProgress, InputAdornment, Autocomplete, createFilterOptions,
  ToggleButton, ToggleButtonGroup,

} from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import Iconify from '../../components/iconify';
import formatPhoneNumber from '../../utils/formatPhoneNumber';
import NotesTable from '../customer/NotesTable';
import ErrorFallback from '../shared/ErrorBoundary';
import NotesTableForAccessorials from './NotesTableForAccessorials';
import StyledTextField from '../shared/StyledTextField';
import { useDispatch, useSelector } from '../../redux/store';
import { PATH_DASHBOARD } from '../../routes/paths';
import {
  postStep1, getCustomerStationDropdown, getCarrierTerminalDropdown, searchCustomerStationDropdown,
  getShipperDropdown, getConsigneeDropdown, getShipperAirlineDropdown,
  getConsigneeAirlineDropdown, setPickupAccessorials,
  setLinehaulAccessorials,
  setDeliveryAccessorials,
  getPickupAccessorials,
  getLinehaulAccessorials,
  getDeliveryAccessorials,
  setAccessorialDropdown,
  getAccessorialDropdown,
  getStationAccessorialData,
  getZipToZipCarrierPickupRate,
  getZipToZipCarrierLinehaulRate,
  getZipToZipCarrierDeliveryRate, setError, setOperationalMessage,

} from '../../redux/slices/shipment';

// commodity list table
const CommoditiesList = ({ watchedHU }) => {
  const calculateTotals = (huArray) => {
    let totalHU = 0, totalPieces = 0, totalHM = 0, totalWeight = 0;

    huArray?.forEach((hu) => {
      totalHU += Number(hu.unitsCount || 0);

      hu.items?.forEach((item) => {
        totalPieces += Number(item.pieces || 0);
        if (item.hazmatInfo) totalHM += 1;
      });

      // Extract current weight and unit string
      const currentWeight = Number(hu.weight || 0);
      const weightUnit = (hu.weightUnit || '').trim().toLowerCase();

      // 1. Convert to LBS if the item unit is registered as KGS
      if (weightUnit === 'kgs' || weightUnit === 'kg') {
        totalWeight += currentWeight * 2.20462;
      } else {
        totalWeight += currentWeight;
      }
    });

    return {
      totalHU,
      totalPieces,
      totalHM,
      // 2. Round up the weight value to 2 decimals, or display empty string if 0
      totalWeight: totalWeight === 0 ? "" : Number(totalWeight.toFixed(2))
    };
  };



  const totals = calculateTotals(watchedHU);
  const cellStyle = { border: '1px solid #ccc', padding: '6px', fontSize: '0.7rem' };
  const headerBg = { backgroundColor: '#f5f5f5', fontWeight: 'bold' };



  return (
    <Box sx={{ mt: 4, overflowX: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Commodities List</Typography>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <tbody>
          {watchedHU?.map((hu, huIdx) => (
            <React.Fragment key={huIdx}>
              {/* --- DYNAMIC HEADER PER HANDLING UNIT --- */}
              <tr style={headerBg}>
                <td style={cellStyle} colSpan={2}>Handling Unit {huIdx + 1}</td>
                <td style={cellStyle} colSpan={2}>Piece</td>
                <td style={cellStyle} rowSpan={2}>HM</td>
                <td style={cellStyle} rowSpan={2}>Commodity Description</td>
                <td style={cellStyle} rowSpan={2}>Weight lbs</td>
                <td style={cellStyle} rowSpan={2}>Freight Class</td>
                <td style={cellStyle} colSpan={3}>Dimensions</td>
              </tr>
              <tr style={headerBg}>
                <td style={cellStyle}>Type</td><td style={cellStyle}>QTY</td>
                <td style={cellStyle}>Type</td><td style={cellStyle}>QTY</td>
                <td style={cellStyle}>L</td><th style={cellStyle}>W</th><th style={cellStyle}>H</th>
              </tr>



              {/* --- ITEMS DATA --- */}
              {hu.items?.map((item, itmIdx) => (
                <tr key={itmIdx}>
                  {/* HU Type/QTY spans all items in this specific HU */}
                  {itmIdx === 0 ? (
                    <>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.uom}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.unitsCount}</td>
                    </>
                  ) : null}
                  <td style={cellStyle}>{item.piecesUom}</td>
                  <td style={cellStyle}>{item.pieces}</td>
                  <td style={cellStyle}>{item.hazmatInfo ? 'X' : '-'}</td>
                  <td style={{ ...cellStyle, textAlign: 'left', color: item.hazmatInfo ? '#a22' : 'inherit' }}>
                    {item.hazmatInfo && item.hazmatData
                      ? `${item.hazmatData.unNumber}, ${item.hazmatData.shippingName}, (${item.hazmatData.technicalName}), ${item.hazmatData.hazmatClass}, ${item.hazmatData.weight} lbs`
                      : item.description}
                  </td>
                  {/* Dimensions/Weight/Class spans all items in this specific HU */}
                  {itmIdx === 0 ? (
                    <>
                      <td style={cellStyle} rowSpan={hu.items.length}>
                        {hu.weightUnit === 'lbs'
                          ? `${hu.weight}`
                          : `${(Number(hu.weight) * 2.20462).toFixed(2)}`
                        }
                      </td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.class}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.length}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.width}</td>
                      <td style={cellStyle} rowSpan={hu.items.length}>{hu.height}</td>
                    </>
                  ) : null}
                </tr>
              ))}
              {/* Spacer row between units for visual clarity */}
              <tr><td colSpan={11} style={{ border: 'none', height: '10px' }}></td></tr>
            </React.Fragment>
          ))}
        </tbody>



        {/* --- GRAND TOTAL FOOTER --- */}
        <tfoot style={{ fontWeight: 'bold', backgroundColor: '#fff' }}>
          <tr>
            <td style={cellStyle}>Total H/U</td>
            <td style={cellStyle}>{totals.totalHU}</td>
            <td style={cellStyle}>Piece</td>
            <td style={cellStyle}>{totals.totalPieces}</td>
            <td style={cellStyle}>{totals.totalHM}</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>Total Shipping Weight</td>
            <td style={cellStyle}>{totals.totalWeight}</td>
            <td style={cellStyle} colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
    </Box>
  );
};
export default CommoditiesList; 
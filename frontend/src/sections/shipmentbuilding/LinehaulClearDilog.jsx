import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import { useForm, Controller, useFieldArray, useWatch, set, get } from 'react-hook-form';

import {
  Typography,
  Button, Dialog, DialogTitle,
  DialogContent, DialogActions,

} from '@mui/material';

const LinehaulClearDilog = ({ open, type, onClose, onSave, }) => {
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Information</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', }}>
            Are you sure you want to clear? This action will clear all the linehaul {type === 'linehaul_only' ? 'and delivery details.' : 'details.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ color: '#000', borderColor: '#000' }}>Cancel</Button>
          <Button onClick={onSave} variant="contained" sx={{ bgcolor: '#a22' }}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LinehaulClearDilog; 

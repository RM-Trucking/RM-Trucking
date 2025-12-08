import PropTypes from 'prop-types';
// @mui
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

// ----------------------------------------------------------------------

ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.node,
  action: PropTypes.node,
  content: PropTypes.node,
  onClose: PropTypes.func,
  dataTestId: PropTypes.string,
};

export default function ConfirmDialog({ title, content, action, open, onClose, dataTestId, ...other }) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      {...other}
      {...(dataTestId ? { 'data-testid': dataTestId } : {})}
      disableScrollLock
    >
      <DialogTitle {...(dataTestId ? { 'data-testid': `${dataTestId}-title` } : {})} sx={{ pb: 2 }}>
        {title}
      </DialogTitle>

      {content && (
        <DialogContent {...(dataTestId ? { 'data-testid': `${dataTestId}-content` } : {})} sx={{ typography: 'body2' }}>
          {' '}
          {content}{' '}
        </DialogContent>
      )}

      <DialogActions sx={{justifyContent : 'flex-start'}} {...(dataTestId ? { 'data-testid': `${dataTestId}-actions` } : {})}>
        {action}

        {/* <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button> */}
      </DialogActions>
    </Dialog>
  );
}

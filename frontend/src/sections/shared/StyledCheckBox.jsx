import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';

const StyledCheckbox = styled(Checkbox)({
  // Default color for the unchecked state
  color: 'rgba(0, 25, 76, 1)',
  paddingBottom: '0px',
  // Color for the checked state
  '&.Mui-checked': {
    color: 'rgba(0, 25, 76, 1)'
  },

  // Optional: Add a focus ring for keyboard navigation accessibility
  '&.Mui-focusVisible': {
    boxShadow: '0 0 0 2px rgba(0, 25, 76, 1)',
  },
  // --- ADD THIS SECTION FOR THE DISABLED RED STATE ---
  '&.Mui-disabled': {
    color: 'rgba(0, 25, 76, 1)', // Makes the unchecked box red
    opacity: 1,    // Removes the default faded/grey look
  },

  '&.Mui-checked.Mui-disabled': {
    color: 'rgba(0, 25, 76, 1)', // Makes the checkmark and box red when checked AND disabled
  },
});

export default StyledCheckbox;
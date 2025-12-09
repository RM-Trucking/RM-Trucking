import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';

const StyledCheckbox = styled(Checkbox)({
  // Default color for the unchecked state
  color: '#A22',
  
  // Color for the checked state
  '&.Mui-checked': {
    color: '#A22',
  },

  // Optional: Add a focus ring for keyboard navigation accessibility
  '&.Mui-focusVisible': {
    boxShadow: '0 0 0 2px #A22',
  },
});

export default StyledCheckbox;
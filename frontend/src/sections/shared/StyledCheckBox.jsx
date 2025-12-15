import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';

const StyledCheckbox = styled(Checkbox)({
  // Default color for the unchecked state
  color: '#00194c',
  paddingBottom: '0px',
  // Color for the checked state
  '&.Mui-checked': {
    color: '#00194c',
  },

  // Optional: Add a focus ring for keyboard navigation accessibility
  '&.Mui-focusVisible': {
    boxShadow: '0 0 0 2px #00194c',
  },
});

export default StyledCheckbox;
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

const StyledTextField = styled(TextField)({
  // Target the MuiInput-underline class for the standard variant
  '& .MuiInput-underline:after': {
    borderBottomColor: 'rgba(107, 107, 107, 1)', // The focused color
  },
  // Optional: Change the label color when focused
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'rgba(107, 107, 107, 1)',
  },
  // Optional: Change the hover state underline color
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(107, 107, 107, 1)',
  },
});

export default StyledTextField;
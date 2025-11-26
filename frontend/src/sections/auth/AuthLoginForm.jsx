import { useForm } from "react-hook-form";
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper
} from "@mui/material";
import { PATH_DASHBOARD } from '../../routes/paths';
// auth
import { useAuthContext } from '../../auth/useAuthContext';

 
export default function AuthLoginForm() {
  // const { login, saveUserCredentials } = useAuthContext();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();
 
  const submitForm = (data) => {
    console.log("Login Data:", data);
    if(data?.email && data?.password){
      navigate(PATH_DASHBOARD?.general?.dashboard);
    }
  };
 
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: alpha('#f2f5f7', 0.8),
      }}
    >
      <Paper
        elevation={3}
        sx={{ padding: 4, width: 350, borderRadius: 3 }}
      >
        <Typography
          variant="h5"
          textAlign="center"
          fontWeight="bold"
          mb={3}
        >
          Login
        </Typography>
 
        <form onSubmit={handleSubmit(submitForm)}>
          {/* Email */}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={"valli@srinsofttech.com"}
            {...register("email", { required: "Email is required" })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
 
          {/* Password */}
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value = {"R&MTrucking1234#"}
            margin="normal"
            {...register("password", {
              required: "Password is required"
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
 
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, py: 1.2, bgcolor : '#A22' }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
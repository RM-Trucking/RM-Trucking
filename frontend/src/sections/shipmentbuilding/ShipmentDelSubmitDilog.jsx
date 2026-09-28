import {
    Dialog, DialogTitle,
    DialogContent,
} from '@mui/material';
import ShipmentDelLinehaulPage from './ShipmentDelLinehaulPage';


const ShipmentDelSubmitDialog = ({ open, onClose, actionType }) => {
    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: '1500px',
                        width: '100%',
                    }
                }}>
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Linehaul Carrier pickup location</DialogTitle>
                <DialogContent sx={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    mt: 2
                }}>
                    <ShipmentDelLinehaulPage type='Edit' actionDelType={actionType} onDelDialogClose={onClose} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ShipmentDelSubmitDialog; 

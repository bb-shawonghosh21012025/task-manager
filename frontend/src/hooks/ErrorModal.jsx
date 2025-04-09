import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
  } from "@mui/material";
import "../App.css";
  
export  const ErrorModal = ({ isOpen, title, message, onClose }) => {
    return (
      <Dialog
        id="error-dialog"
        data-testid="error-dialog"
        open={isOpen}
        onClose={onClose}
        className="error-dialog"
      >
      <DialogTitle>
          <Typography variant="h6" component="span">
            {title}
          </Typography></DialogTitle>
      <DialogContent>
          <Typography className="error-message" dangerouslySetInnerHTML={{ __html: message }} />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={onClose} className="error-close-btn">
           Close
          </Button>
      </DialogActions>
      </Dialog>
    );
  };
  
  export default ErrorModal;

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
  } from "@mui/material";
  import "../App.css";
  
  export const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) => {
    return (
      <Dialog
        id="error-dialog"
        data-testid="error-dialog"
        open={isOpen}
        onClose={onCancel}
        className="error-dialog"
      >
        {title !== undefined && (
          <DialogTitle>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </DialogTitle>
        )}
        {message && (
          <DialogContent>
            <Typography
              className="error-message"
              dangerouslySetInnerHTML={{ __html: message }}
            />
          </DialogContent>
        )}
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={onCancel} className="error-close-btn">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} className="error-close-btn">
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  export default ConfirmModal;
  

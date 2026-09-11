import React, { useState } from 'react';

import { useForm, Controller, useFieldArray, useWatch, set, get, useFormContext } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    Divider,
    Alert, Snackbar,
} from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import Iconify from '../../components/iconify';


const actionBtnSx = {
    bgcolor: "#A22",
    color: "#fff",
    textTransform: "none",
    minWidth: 80,
    height: 28,
    px: 1.5,
    fontSize: 12,
    "&:hover": { bgcolor: "#8b1c1c" },
};

export default function ImagePreviewDilog({ imagePreviewDialog, setImagePreviewDialog, fullImageDialog, setFullImageDialog,

}) {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const handleCloseImagePreview = () => {
        setImagePreviewDialog({
            open: false,
            images: [],
            itemLabel: "",
            key: null,
            formId: null,
            itemId: null,
            imageField: "images",
        });
        setFullImageDialog({ open: false, image: null, title: "" });
    };
    const looksLikeBase64Image = (value) => {
        const compactValue = String(value || "").trim();
        return (
            compactValue.length > 80 && /^[A-Za-z0-9+/]+={0,2}$/.test(compactValue)
        );
    };
    const getImageName = (file, index) => {
        if (!file) return `Image ${index + 1}`;
        if (typeof file === "string") {
            if (looksLikeBase64Image(file) || file.startsWith("data:image/"))
                return `Cargo API Image ${index + 1}`;
            return file.split("/").pop() || `Image ${index + 1}`;
        }
        return file.name || file.filename || `Image ${index + 1}`;
    };
    const getBase64ImageMimeType = (value) => {
        const compactValue = String(value || "").trim();

        if (compactValue.startsWith("/9j/")) return "image/jpeg";
        if (compactValue.startsWith("iVBORw0KGgo")) return "image/png";
        if (compactValue.startsWith("R0lGOD")) return "image/gif";
        if (compactValue.startsWith("UklGR")) return "image/webp";
        return "image/jpeg";
    };
    const getImageUrl = (file) => {
        if (!file) return "";
        if (typeof file === "string") {
            const image = file.trim();
            if (/^(data:image\/|https?:\/\/|blob:)/i.test(image)) return image;
            if (looksLikeBase64Image(image))
                return `data:${getBase64ImageMimeType(image)};base64,${image}`;
            return image;
        }
        if (file.url) return file.url;
        if (file.preview) return file.preview;
        if (file.base64) return getImageUrl(file.base64);
        if (file.image) return getImageUrl(file.image);
        if (file instanceof File) return URL.createObjectURL(file);
        return "";
    };
    const handleOpenFullImage = (image, title) => {
        setFullImageDialog({ open: true, image, title });
    };
    const handleCloseFullImage = () => {
        setFullImageDialog({ open: false, image: null, title: "" });
    };


    return (
        <>
            <Dialog
                open={imagePreviewDialog.open}
                onClose={handleCloseImagePreview}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pr: 5 }}>
                    Uploaded Images - {imagePreviewDialog.itemLabel}
                    <IconButton
                        onClick={handleCloseImagePreview}
                        size="small"
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {imagePreviewDialog.images.length === 0 ? (
                        <Typography sx={{ fontSize: 13 }}>
                            No uploaded images available.
                        </Typography>
                    ) : (
                        <Stack direction="row" flexWrap="wrap" gap={2}>
                            {imagePreviewDialog.images.map((file, index) => {
                                const imageUrl = getImageUrl(file);

                                return (
                                    <Stack
                                        key={`${getImageName(file, index)}-${index}`}
                                        spacing={0.7}
                                        sx={{ width: 170 }}
                                    >
                                        <Box
                                            sx={{
                                                position: "relative",
                                                width: 170,
                                                height: 130,
                                                border: "1px solid #d0d0d0",
                                                borderRadius: 1,
                                                overflow: "hidden",
                                                bgcolor: "#f7f7f7",
                                            }}
                                        >
                                            {imageUrl ? (
                                                <Box
                                                    component="img"
                                                    src={imageUrl}
                                                    alt={getImageName(file, index)}
                                                    onClick={() =>
                                                        handleOpenFullImage(file, getImageName(file, index))
                                                    }
                                                    sx={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        cursor: "zoom-in",
                                                    }}
                                                />
                                            ) : (
                                                <Stack
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    sx={{ height: "100%", opacity: 0.5 }}
                                                >
                                                    <Iconify icon="mdi:image-off" width={28} />
                                                </Stack>
                                            )}
                                            <IconButton
                                                size="small"
                                                title="Remove image"
                                                onClick={() => handleRemovePreviewImage(index)}
                                                sx={{
                                                    position: "absolute",
                                                    top: 4,
                                                    right: 4,
                                                    bgcolor: "rgba(255,255,255,0.9)",
                                                    color: "#A22",
                                                    "&:hover": { bgcolor: "#fff" },
                                                }}
                                            >
                                                <Iconify icon="mdi:close-circle" width={18} />
                                            </IconButton>
                                        </Box>
                                        <Typography sx={{ fontSize: 12, wordBreak: "break-word" }}>
                                            {getImageName(file, index)}
                                        </Typography>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleCloseImagePreview}
                        sx={{ ...actionBtnSx, height: 32, minWidth: 70 }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* full image dilog  */}
            <Dialog
                open={fullImageDialog.open}
                onClose={handleCloseFullImage}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pr: 5 }}>
                    {fullImageDialog.title || "Image Preview"}
                    <IconButton
                        onClick={handleCloseFullImage}
                        size="small"
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: "#111", p: 2 }}>
                    {getImageUrl(fullImageDialog.image) ? (
                        <Box
                            component="img"
                            src={getImageUrl(fullImageDialog.image)}
                            alt={fullImageDialog.title || "Image Preview"}
                            sx={{
                                display: "block",
                                maxWidth: "100%",
                                maxHeight: "75vh",
                                mx: "auto",
                                objectFit: "contain",
                                bgcolor: "#fff",
                            }}
                        />
                    ) : (
                        <Stack
                            alignItems="center"
                            justifyContent="center"
                            sx={{ minHeight: 320, color: "#fff" }}
                            spacing={1}
                        >
                            <Iconify icon="mdi:image-off" width={32} />
                            <Typography sx={{ fontSize: 13 }}>
                                Image preview unavailable.
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

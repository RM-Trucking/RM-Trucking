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

export default function ImageUploadDilog({ uploadDialog, setUploadDialog, fileInputRef,
    stagedFiles, setStagedFiles, isDraggingFiles, setIsDraggingFiles, cameraDialogOpen, setCameraDialogOpen,
    cameraInputRef, cameraVideoRef, cameraStreamRef
}) {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const handleCloseImageUpload = () => {
        setUploadDialog({
            open: false,
            mode: "upload",
            key: null,
            formId: null,
            itemId: null,
            imageField: "images",
        });

        handleCloseCamera();
    };
    const addFilesToStage = (files) => {
        const selectedFiles = Array.from(files || []);

        if (selectedFiles.length > 0) {
            setStagedFiles((prev) => [...prev, ...selectedFiles]);
        }
    };

    const handleFileSelection = (event) => {
        addFilesToStage(event.target.files);
        event.target.value = "";
    };
    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDraggingFiles(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDraggingFiles(false);
    };
    const handleFileDrop = (event) => {
        event.preventDefault();
        setIsDraggingFiles(false);
        addFilesToStage(event.dataTransfer.files);
    };
    const handleCaptureImage = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            cameraInputRef.current?.click();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });

            cameraStreamRef.current = stream;
            setCameraDialogOpen(true);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error?.message || "Unable to open camera",
                severity: "error",
            });
        }
    };
    const handleCloseSnackbar = () => {
        setSnackbar({
            open: false, message: "",
            severity: "",
        });
    };
    const handleBrowseFiles = () => {
        fileInputRef.current?.click();
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
    const looksLikeBase64Image = (value) => {
        const compactValue = String(value || "").trim();
        return (
            compactValue.length > 80 && /^[A-Za-z0-9+/]+={0,2}$/.test(compactValue)
        );
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
    const openImagePreviewTab = (imageUrl, title = "Image Preview") => {
        const previewWindow = window.open("", "_blank");
        if (!previewWindow) return false;

        previewWindow.document.title = title;
        previewWindow.document.body.style.margin = "0";
        previewWindow.document.body.style.minHeight = "100vh";
        previewWindow.document.body.style.background = "#111";
        previewWindow.document.body.style.display = "flex";
        previewWindow.document.body.style.alignItems = "center";
        previewWindow.document.body.style.justifyContent = "center";
        previewWindow.document.body.style.padding = "24px";
        previewWindow.document.body.style.boxSizing = "border-box";

        const image = previewWindow.document.createElement("img");
        image.src = imageUrl;
        image.alt = title;
        image.style.maxWidth = "100%";
        image.style.maxHeight = "calc(100vh - 48px)";
        image.style.objectFit = "contain";
        image.style.background = "#fff";

        previewWindow.document.body.appendChild(image);
        previewWindow.document.close();
        return true;
    };
    const handleViewStagedFile = (file, index = 0) => {
        if (!file) return;
        // if (isScanGunScreen) {
        //   handleOpenFullImage(file, getImageName(file, index));
        //   return;
        // }
        const previewUrl = getImageUrl(file);
        if (!previewUrl) return;

        const opened = openImagePreviewTab(previewUrl, getImageName(file, index));

        if (opened && file instanceof File) {
            setTimeout(() => {
                URL.revokeObjectURL(previewUrl);
            }, 1000);
        }
    };
    const handleRemoveStagedFile = (index) => {
        setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const stopCameraStream = () => {
        cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
        cameraStreamRef.current = null;
    };
    const handleCloseCamera = () => {
        if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = null;
        }
        stopCameraStream();
        setCameraDialogOpen(false);
    };
    const handleTakePhoto = () => {
        const video = cameraVideoRef.current;
        if (!video) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;

                const file = new File([blob], `camera-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                });
                addFilesToStage([file]);
                handleCloseCamera();
            },
            "image/jpeg",
            0.92,
        );
    };
    const DECIMAL_ITEM_FIELDS = new Set(["length", "width", "height", "weight"]);
    const formatDecimal10_2Input = (value) => {
        const inputValue = String(value ?? "").replace(/[^\d.]/g, "");
        const hasDecimal = inputValue.includes(".");
        const [integerPart = "", ...decimalParts] = inputValue.split(".");
        const integerValue = integerPart.slice(0, 8);
        const decimalValue = decimalParts.join("").slice(0, 2);

        return hasDecimal ? `${integerValue || "0"}.${decimalValue}` : integerValue;
    };
    const updateItem = (key, formId, itemId, field, value) => {
        const nextValue = DECIMAL_ITEM_FIELDS.has(field)
            ? formatDecimal10_2Input(value)
            : value;

        // updateReceipt(key, (p) => ({
        //     forms: p.forms.map((f) =>
        //         f.id === formId
        //             ? {
        //                 ...f,
        //                 items: f.items.map((i) =>
        //                     i.id === itemId ? { ...i, [field]: nextValue } : i,
        //                 ),
        //             }
        //             : f,
        //     ),
        // }));
    };
    // const updateFormField = (key, formId, field, value) =>
    // updateReceipt(key, (p) => ({
    //   forms: p.forms.map((f) =>
    //     f.id === formId ? { ...f, [field]: value } : f,
    //   ),
    // }));
    const handleUploadImages = () => {
        if (!uploadDialog.key || !uploadDialog.formId) return;

        // if (uploadDialog.itemId) {
        //     updateItem(
        //         uploadDialog.key,
        //         uploadDialog.formId,
        //         uploadDialog.itemId,
        //         uploadDialog.imageField || "images",
        //         stagedFiles,
        //     );
        // } else {
        //     updateFormField(
        //         uploadDialog.key,
        //         uploadDialog.formId,
        //         uploadDialog.imageField || "images",
        //         stagedFiles,
        //     );
        // }
        handleCloseImageUpload();
    };
    const FileItem = ({ filename, onRemove, onView, hideRemove = false }) => (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: "4px 8px",
                mb: 1,
                width: "100%",
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                    size="small"
                    onClick={onView}
                    sx={{ bgcolor: "#dbdbdb", borderRadius: 0.5, p: "4px", color: "#000" }}
                >
                    <Iconify icon="mdi:eye" width={16} color="#000" />
                </IconButton>
                <Typography sx={{ fontSize: 12 }}>{filename}</Typography>
            </Stack>
            {!hideRemove && (
                <IconButton
                    size="small"
                    onClick={onRemove}
                    sx={{ p: "2px", color: "#000" }}
                >
                    <Iconify icon="carbon:close-filled" width={16} />
                </IconButton>
            )}
        </Box>
    );

    return (
        <>
            <Dialog
                open={uploadDialog.open}
                onClose={handleCloseImageUpload}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pr: 5 }}>
                    {uploadDialog.mode === "view" ? "Uploaded Images" : "Image Upload"}
                    <IconButton
                        onClick={handleCloseImageUpload}
                        size="small"
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.jif"
                        style={{ display: "none" }}
                        onChange={handleFileSelection}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={handleFileSelection}
                    />

                    <Stack spacing={2}>
                        {(
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                File Upload
                            </Typography>
                        )}
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            sx={{ border: "1px dashed #a0a0a0", borderRadius: 2, p: 2 }}
                        >
                            {(
                                <Stack
                                    sx={{
                                        width: { xs: "100%", md: "50%" },
                                        borderRight: { xs: "none", md: "1px solid #e0e0e0" },
                                        borderBottom: { xs: "1px solid #e0e0e0", md: "none" },
                                        pr: { xs: 0, md: 2 },
                                        pb: { xs: 2, md: 0 },
                                        mb: { xs: 2, md: 0 },
                                        bgcolor: isDraggingFiles ? "#fff3f3" : "transparent",
                                        borderRadius: 1,
                                        transition: "background-color 0.2s ease",
                                        minHeight: 180,
                                    }}
                                    alignItems="center"
                                    justifyContent="center"
                                    spacing={1}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleFileDrop}
                                >
                                    <Iconify icon="mdi:tray-arrow-up" width={32} color="#A22" />
                                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                                        Drag & Drop File
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: "#777" }}>
                                        File Supported: Image, JIF
                                    </Typography>
                                    <Typography sx={{ fontSize: 14, fontWeight: 600, my: 0.5 }}>
                                        OR
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconButton
                                            size="small"
                                            onClick={handleCaptureImage}
                                            title="Capture image"
                                            sx={{
                                                bgcolor: "#A22",
                                                color: "#fff",
                                                width: 32,
                                                height: 32,
                                                borderRadius: 1,
                                                "&:hover": { bgcolor: "#8b1c1c" },
                                            }}
                                        >
                                            <Iconify icon="mdi:camera" width={20} />
                                        </IconButton>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleBrowseFiles}
                                            sx={{ ...actionBtnSx, height: 32 }}
                                        >
                                            Browse Files
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}

                            <Stack
                                sx={{
                                    width: "100%",
                                    pl: 0,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ mb: 1 }}
                                >
                                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                                        Uploaded Files
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: "#555" }}>
                                        {stagedFiles.length} file(s)
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 1 }} />

                                {stagedFiles.length === 0 ? (
                                    <Stack
                                        alignItems="center"
                                        justifyContent="center"
                                        sx={{ minHeight: 140, opacity: 0.5 }}
                                        spacing={1}
                                    >
                                        <Iconify icon="mdi:file-document-multiple" width={32} />
                                        <Typography sx={{ fontSize: 12 }}>No Files</Typography>
                                    </Stack>
                                ) : (
                                    <Box sx={{ maxHeight: 180, overflowY: "auto", pr: 1 }}>
                                        {stagedFiles.map((file, idx) => (
                                            <FileItem
                                                key={`${getImageName(file, idx)}-${file.lastModified || idx}-${idx}`}
                                                filename={getImageName(file, idx)}
                                                onView={() => handleViewStagedFile(file, idx)}
                                                onRemove={
                                                    () => handleRemoveStagedFile(idx)
                                                }
                                            // hideRemove={uploadDialog.mode === "view"}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Stack>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCloseImageUpload}
                        sx={{ textTransform: "none", color: "#333", borderColor: "#aaa" }}
                    >
                        Cancel
                    </Button>
                    {(
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleUploadImages}
                            sx={{ ...actionBtnSx, height: 32 }}
                        >
                            Upload
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog
                open={cameraDialogOpen}
                onClose={handleCloseCamera}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pr: 5 }}>
                    Capture Image
                    <IconButton
                        onClick={handleCloseCamera}
                        size="small"
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box
                        component="video"
                        ref={(node) => {
                            cameraVideoRef.current = node;
                            if (
                                node &&
                                cameraStreamRef.current &&
                                node.srcObject !== cameraStreamRef.current
                            ) {
                                node.srcObject = cameraStreamRef.current;
                                node.play?.().catch(() => { });
                            }
                        }}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={(event) =>
                            event.currentTarget.play?.().catch(() => { })
                        }
                        onCanPlay={(event) => event.currentTarget.play?.().catch(() => { })}
                        sx={{
                            width: "100%",
                            height: { xs: "60vh", md: "70vh" },
                            minHeight: { xs: 360, md: 560 },
                            maxHeight: 760,
                            bgcolor: "#000",
                            borderRadius: 1,
                            objectFit: "contain",
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCloseCamera}
                        sx={{ textTransform: "none", color: "#333", borderColor: "#aaa" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleTakePhoto}
                        sx={{ ...actionBtnSx, height: 32 }}
                    >
                        Capture
                    </Button>
                </DialogActions>
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

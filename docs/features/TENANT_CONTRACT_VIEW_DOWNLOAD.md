# Tenant Contract View & Download Feature

## Overview
Implemented comprehensive document viewing and downloading functionality for tenants, allowing them to view contracts in a modal dialog and download them in PDF or DOCX formats.

## Changes Made

### 1. Frontend API Helper (`src/lib/api/documents.ts`)
- **Added `downloadDocumentInFormat()` function**: Generates download URLs for documents in specific formats (PDF or DOCX)
- Supports both generated contracts (no fileUrl) and uploaded files

### 2. Tenant Documents Component (`src/components/TenantDocuments.tsx`)

#### State Management
- Added `viewingDocument` state to track the currently viewed document
- Added `showViewDialog` state to control the view dialog visibility

#### Enhanced Functions
- **`handleDownload()`**: Updated to support format selection (PDF/DOCX)
  - For generated contracts: Uses the download API with format parameter
  - For uploaded files: Uses direct file URL
  
- **`handleView()`**: Opens a modal dialog to preview documents
  - Shows document details (format, size, date)
  - Provides download buttons for both PDF and DOCX formats
  - Displays document preview using iframe or image tag

#### UI Components
- **Document Card**: Updated to use proper Document type and call handlers correctly
- **View Dialog**: 
  - Large modal (max-w-4xl) with document preview
  - Document info section showing metadata
  - Download buttons for PDF and DOCX formats
  - Preview area (500px height) with iframe for PDFs or img for images
  - Handles both uploaded files and generated contracts

#### Document Preview Logic
- For uploaded files with image extensions: Displays as `<img>` tag
- For uploaded PDFs/documents: Displays in `<iframe>`
- For generated contracts (no fileUrl): Displays PDF preview in `<iframe>`

### 3. Backend Support (Already Implemented)
The backend already has the necessary route at `/api/documents/:id/download/:format` that:
- Validates format (pdf or docx)
- Checks user access permissions
- Serves uploaded files directly if format matches
- Generates PDF/DOCX from HTML content for generated contracts
- Uses PDFKit for PDF generation
- Uses docx library for DOCX generation

## Features

### View Contract
1. Tenant clicks "View" button on any document
2. Modal dialog opens with:
   - Document name and description
   - Metadata (format, size, date)
   - Download buttons for PDF and DOCX
   - Full document preview

### Download Contract
1. Tenant can download from:
   - Document card (default format)
   - View dialog (choose PDF or DOCX)
2. Downloads open in new tab/window
3. Success toast notification shown

## User Experience
- **Seamless viewing**: Documents open in a large modal with preview
- **Format flexibility**: Download as PDF or DOCX
- **Visual feedback**: Toast notifications for all actions
- **Responsive design**: Modal adapts to screen size
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Technical Details

### File Type Detection
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- PDFs: `.pdf`
- Documents: `.doc`, `.docx`

### URL Resolution
- Uploaded files: `${VITE_API_URL}${fileUrl}`
- Generated contracts: `${VITE_API_URL}/api/documents/${id}/download/${format}`

### Security
- All downloads require authentication
- Backend validates user access permissions
- Role-based access control enforced

## Testing Checklist
- [x] View uploaded PDF documents
- [x] View uploaded image documents
- [x] View generated contracts
- [x] Download documents as PDF
- [x] Download documents as DOCX
- [x] Download from document card
- [x] Download from view dialog
- [x] Proper error handling
- [x] Toast notifications working
- [x] Modal close functionality
- [x] Responsive design

## Future Enhancements
- Add document annotations
- Support for document signing
- Version history tracking
- Document sharing with other tenants
- Print functionality
- Full-screen view mode


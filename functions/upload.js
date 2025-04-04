const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Google Drive API setup
const drive = google.drive('v3');
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'YOUR_SERVICE_ACCOUNT_KEY.json'), // Path to your service account JSON key
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const uploadToDrive = async (file) => {
    const authClient = await auth.getClient();
    const driveService = google.drive({ version: 'v3', auth: authClient });

    const fileMetadata = {
        name: file.originalname,
        parents: ['YOUR_FOLDER_ID'], // Google Drive folder ID where you want to upload
    };

    const media = {
        mimeType: file.mimetype,
        body: file.buffer,
    };

    try {
        const res = await driveService.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id,name,webViewLink',
        });
        return res.data;
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
};

app.get('/test', async (req, res) => {
    res.json({
        data: 'test'
    })
});


// Endpoint to handle file uploads
app.post('/upload', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }

        const uploadedFiles = [];

        // Upload each file to Google Drive
        for (let file of files) {
            const driveFile = await uploadToDrive(file);
            uploadedFiles.push(driveFile);
        }

        res.status(200).json({
            success: true,
            uploadedFiles: uploadedFiles,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading files to Google Drive.',
            error: error.message,
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


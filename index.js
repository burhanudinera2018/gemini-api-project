import "dotenv/config";
import express from "express";
import multer from "multer"; // Sudah diimpor
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

// --- Multer Configuration ---
// Gunakan memoryStorage agar req.file.buffer tersedia untuk base64 encoding.
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage }); 

// --- App Initialization ---
const app = express(); // Hanya sekali deklarasi
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// Text Input 
app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});


// --- Image Input Route ---
// Menggunakan variabel 'upload' yang sudah didefinisikan dengan memoryStorage di atas.
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
    
    // 1. Pemeriksaan file sudah benar
    if (!req.file) {
        console.error("Error: File gambar tidak ditemukan dalam request.");
        return res.status(400).json({ message: "Harap unggah file gambar dengan kunci 'image'." });
    }

    // 2. Ambil prompt dan konversi buffer
    const prompt = req.body.prompt; 
    const base64Image = req.file.buffer.toString("base64");
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt, type: "text" },
                { inlineData: { data: base64Image, mimeType: req.file.mimetype }, type: "image" }
            ]
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error("Error saat memanggil Gemini API:", e);
        res.status(500).json({ message: e.message });
    }
});


// Document Input Route
// Route ini menerima satu file dokumen (PDF, DOCX, dll.) dan teks prompt.
app.post("/generate-from-document", upload.single("document"), async (req, res) => {
    
    // 1. Pemeriksaan file
    if (!req.file) {
        console.error("Error: File dokumen tidak ditemukan dalam request.");
        return res.status(400).json({ message: "Harap unggah file dokumen dengan kunci 'document'." });
    }

    // 2. Ambil prompt dan konversi buffer
    const prompt = req.body.prompt; 
    
    // Konversi buffer dokumen ke Base64
    const base64Document = req.file.buffer.toString("base64");
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL, // Model yang lebih kuat mungkin lebih baik untuk dokumen panjang
            contents: [
                { text: prompt, type: "text" },
                // Mengirim dokumen sebagai data inline
                { 
                    inlineData: { 
                        data: base64Document, 
                        mimeType: req.file.mimetype // Menggunakan MIME type dokumen yang diunggah
                    }, 
                    type: "document" // Atau 'application' tergantung pada tipe file, namun Multer akan mengirim MIME type yang benar
                }
            ]
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error("Error saat memanggil Gemini API dengan dokumen:", e);
        res.status(500).json({ message: e.message });
    }
});

// Audio Input Route
// Route ini menerima satu file audio (MP3, WAV, dll.) dan teks prompt.
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
    
    // 1. Pemeriksaan file
    if (!req.file) {
        console.error("Error: File audio tidak ditemukan dalam request.");
        return res.status(400).json({ message: "Harap unggah file audio dengan kunci 'audio'." });
    }

    // 2. Ambil prompt dan konversi buffer
    const prompt = req.body.prompt; 
    
    // Konversi buffer audio ke Base64
    const base64Audio = req.file.buffer.toString("base64");
    
    try {
        const response = await ai.models.generateContent({
            // Model yang kuat (misalnya gemini-2.5-flash) mendukung audio
            model: GEMINI_MODEL, 
            contents: [
                { text: prompt, type: "text" },
                // Mengirim audio sebagai data inline
                { 
                    inlineData: { 
                        data: base64Audio, 
                        mimeType: req.file.mimetype // Menggunakan MIME type audio (e.g., audio/mp3)
                    }, 
                    type: "audio" // Menentukan tipe konten sebagai audio
                }
            ]
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error("Error saat memanggil Gemini API dengan audio:", e);
        res.status(500).json({ message: e.message });
    }
});
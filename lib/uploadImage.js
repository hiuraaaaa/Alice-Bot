import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * Upload file ke tmpfiles.org dan mengembalikan Direct Link
 * @param {Buffer|string} fileBuffer - Buffer file atau path file
 * @param {string} filename - Nama file termasuk ekstensi
 * @returns {Promise<string>} - URL Direct Link hasil upload
 */
export async function uploadImage(fileBuffer, filename = 'upload.jpg') {
    try {
        const form = new FormData();
        const buffer = typeof fileBuffer === 'string' ? fs.readFileSync(fileBuffer) : fileBuffer;

        form.append('file', buffer, { filename });

        const res = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const data = await res.json();

        if (data.status === 'success' && data.data && data.data.url) {
            // Mengubah URL halaman menjadi Direct Link
            // Contoh: https://tmpfiles.org/12345/file.jpg -> https://tmpfiles.org/dl/12345/file.jpg
            const directLink = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
            return directLink;
        } else {
            throw new Error(data.message || 'Gagal upload file ke tmpfiles.org');
        }
    } catch (err) {
        console.error('Upload Error:', err);
        throw err;
    }
}


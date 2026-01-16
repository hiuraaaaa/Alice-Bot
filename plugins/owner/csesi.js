import fs from 'fs/promises'; // Menggunakan fs/promises untuk operasi asinkron
import path from 'path';

const clearsession = async (m, { reply }) => {
    const sessionDir = path.join(process.cwd(), 'auth_info');  

    try {
        // Memastikan folder sesi ada
        const dirExists = await fs.access(sessionDir).then(() => true).catch(() => false);
        if (!dirExists) {
            return reply('❌ Folder sesi tidak ditemukan. Tidak ada yang perlu dibersihkan.');
        }

        const files = await fs.readdir(sessionDir);  
        let deletedCount = 0;  
        const filesToDelete = [];

        for (const file of files) {
            if (file !== 'creds.json') {  
                filesToDelete.push(fs.unlink(path.join(sessionDir, file)));
                deletedCount++;  
            }
        }

        await Promise.all(filesToDelete); // Menunggu semua file selesai dihapus

        if (deletedCount > 0) {
            await reply(`✅ Berhasil membersihkan folder sesi!
🗑️ Total file dihapus: ${deletedCount}

_Catatan: File creds.json tetap dipertahankan agar bot tidak logout._`);
        } else {
            await reply('ℹ️ Folder sesi sudah bersih. Tidak ada file selain creds.json yang ditemukan.');
        }

    } catch (err) {
        console.error(`[ERROR] Gagal membersihkan sesi: ${err.message}`);
        await reply('❌ Terjadi kesalahan saat membersihkan sesi. Silakan coba lagi nanti.');
    }
};

clearsession.help = ["clearsession"];
clearsession.tags = ["owner"];
clearsession.command = /^(clearsession|cs|clearsesi)$/i;
clearsession.owner = true;
export default clearsession;
import fetch from "node-fetch";

const handler = async (m, { sock, args, text, sender }) => {
  try {
    // Ambil text dari args atau quoted message
    const input = text || m.quoted?.text || null;
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ Link web nya mana njeng?\n\n_Contoh: .cloneweb https://example.com_" },
        { quoted: m }
      );
    }

    // Extract URL dari text
    const urlPattern = /https?:\/\/[^\s]+/;
    const match = input.match(urlPattern);
    const url = match ? match[0] : null;
    
    if (!url) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ URL tidak ditemukan dalam teks.\n\n_Pastikan URL dimulai dengan http:// atau https://_" },
        { quoted: m }
      );
    }

    // Kirim pesan loading
    await sock.sendMessage(
      m.key.remoteJid,
      { text: "⏳ Sedang mengunduh website...\n_Proses ini membutuhkan waktu beberapa menit, mohon tunggu..._" },
      { quoted: m }
    );

    // Download website
    const result = await SaveWeb2zip(url);

    if (!result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengunduh file.\n_Pastikan URL valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    // Kirim file ZIP
    const caption = `✅ *Download Sukses!*\n\n📦 File: ${result.fileName}\n🔗 URL: ${url}\n\n_Website berhasil diunduh dan dikemas dalam format ZIP_`;
    
    await sock.sendMessage(
      m.key.remoteJid,
      {
        document: Buffer.from(result.buffer),
        mimetype: "application/zip",
        fileName: result.fileName,
        caption: caption
      },
      { quoted: m }
    );

  } catch (error) {
    console.error("[CLONEWEB] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { text: `❌ Terjadi kesalahan:\n${error.message}` },
      { quoted: m }
    );
  }
};

handler.help = ["cloneweb"];
handler.tags = ["tools"];
handler.command = /^(cloneweb)$/i;
handler.premium = true;

export default handler;

// ===============================
// SaveWeb2zip Function
// ===============================
const SaveWeb2zip = async (link, options = {}) => {
  const apiUrl = "https://copier.saveweb2zip.com";
  let attempts = 0;
  let md5;

  try {
    // Step 1: Copy Site
    const copyResponse = await fetch(`${apiUrl}/api/copySite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        Referer: "https://saveweb2zip.com/en"
      },
      body: JSON.stringify({
        url: link,
        renameAssets: options.renameAssets || false,
        saveStructure: options.saveStructure || false,
        alternativeAlgorithm: options.alternativeAlgorithm || false,
        mobileVersion: options.mobileVersion || false
      })
    });

    const copyResult = await copyResponse.json();
    md5 = copyResult.md5;

    if (!md5) throw new Error("Failed to retrieve MD5 hash");

    console.log(`[CLONEWEB] MD5: ${md5}`);

    // Step 2: Check Status
    while (attempts < 10) {
      console.log(`[CLONEWEB] Checking status... Attempt ${attempts + 1}/10`);
      
      const statusResponse = await fetch(`${apiUrl}/api/getStatus/${md5}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: "https://saveweb2zip.com/en"
        }
      });

      const statusResult = await statusResponse.json();
      
      if (statusResult.isFinished) {
        console.log(`[CLONEWEB] Download ready!`);
        
        // Step 3: Download Archive
        const downloadResponse = await fetch(`${apiUrl}/api/downloadArchive/${md5}`, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
            Referer: "https://saveweb2zip.com/en"
          }
        });

        const buffer = await downloadResponse.arrayBuffer();
        const fileName = `cloneweb_${md5}.zip`;
        
        return {
          fileName: fileName,
          buffer: buffer,
          link: `${apiUrl}/api/downloadArchive/${md5}`
        };
      }

      // Wait 1 minute before next check
      await new Promise(resolve => setTimeout(resolve, 60000));
      attempts++;
    }

    throw new Error("Timeout: Max attempts reached without completion");
    
  } catch (error) {
    console.error("[CLONEWEB] Error:", error);
    return null;
  }
};
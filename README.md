#run
User WhatsApp
      │
      ▼
  index.js / handler.js
      │
      ├─ Cek command / message
      │
      ├─ Pakai lib/ utils → limit, cooldown, upload, logging, antiSpam
      │
      └─ Load plugin sesuai kategori (plugins/)
              │
              ├─ ai/          → AI chat & image processing
              ├─ download/    → Spotify/TikTok/YouTube
              ├─ fun/         → hiburan / waifu-image
              ├─ group/       → setname dsb
              ├─ info/        → server / user info
              ├─ main/        → menu & command utama
              ├─ owner/       → owner-only commands
              ├─ premium/     → premium-only features
              └─ tools/       → utilitas tambahan
      │
      ▼
  Database / Data JSON
      │
      ├─ data/ → memori AI, ping, banned, analytics
      └─ database/ → limit, premium, autoreply
      │
      ▼
  tmp/ → hasil sementara (gambar, audio, video, dsb)
      │
      ▼
User WhatsApp ← Bot Reply

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // 1. Ambil data yang dikirim oleh frontend
    const { username, email, password, address_line_confirm } = await request.json();

    // 🛡️ LAPISAN 1: Pengecekan Honeypot (Jebakan Bot)
    // Jika kolom siluman ini terisi, berarti ini adalah kelakuan bot spammer.
    if (address_line_confirm && address_line_confirm.trim() !== "") {
      console.warn("Bot spammer terdeteksi via Honeypot backend.");
      // Berikan respon sukses palsu agar bot-nya mengira berhasil lalu berhenti menyerang
      return new Response(JSON.stringify({ message: "Registrasi berhasil! Silakan login." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validasi input dasar wajib diisi
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: "Semua data wajib diisi!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Bersihkan spasi di awal/akhir input
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    // 🛡️ LAPISAN 2: Validasi Panjang Karakter Username
    if (cleanUsername.length < 4 || cleanUsername.length > 15) {
      return new Response(JSON.stringify({ error: "Username harus memiliki panjang antara 4 sampai 15 karakter!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🛡️ LAPISAN 3: Validasi Karakter Sakti (Hanya boleh huruf kecil dan angka)
    // Ini otomatis menolak script bot yang gemar menembak nama acak dengan huruf kapital/simbol aneh
    const regexBersih = /^[a-z0-9]+$/;
    if (!regexBersih.test(cleanUsername)) {
      return new Response(JSON.stringify({ error: "Username hanya boleh berisi huruf kecil dan angka saja, tanpa spasi/simbol!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Hubungkan ke database Cloudflare D1
    const db = env.DB; 

    // 3. Masukkan data user baru yang sudah tervalidasi bersih ke tabel 'users'
    await db.prepare(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    ).bind(cleanUsername, cleanEmail, password).run();

    // 4. Jika sukses asli dari manusia, beri respon berhasil sesungguhnya
    return new Response(JSON.stringify({ message: "Registrasi berhasil! Silakan login." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Jika ada error (misal username/email sudah terdaftar unik)
    let errorMessage = error.message || "Terjadi kesalahan di server.";
    
    // Opsional: mempercantik pesan error jika username duplikat di SQLite/D1
    if (errorMessage.includes("UNIQUE constraint failed")) {
      errorMessage = "Username atau Email sudah terdaftar! Gunakan yang lain.";
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

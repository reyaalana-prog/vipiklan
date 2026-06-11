export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // 1. Ambil data yang dikirim oleh form register.html
    const { username, email, password } = await request.json();

    // Validasi input sederhana
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: "Semua data wajib diisi!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Hubungkan ke database Cloudflare D1 kamu
    // Catatan: 'DB' adalah nama binding yang nanti kita atur di dashboard Cloudflare
    const db = env.DB; 

    // 3. Masukkan data user baru ke tabel 'users'
    // Untuk pengembangan awal, kita simpan password langsung. 
    // (Nanti bisa kita optimasi pakai hashing demi keamanan)
    await db.prepare(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    ).bind(username, email, password).run();

    // 4. Jika sukses, beri respon berhasil
    return new Response(JSON.stringify({ message: "Registrasi berhasil! Silakan login." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Jika ada error (misal username/email sudah terdaftar)
    return new Response(JSON.stringify({ error: error.message || "Terjadi kesalahan di server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

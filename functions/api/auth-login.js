export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // 1. Ambil data username dan password dari form login
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username dan password wajib diisi!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const db = env.DB;

    // 2. Cari user di database berdasarkan username
    const user = await db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).bind(username).first();

    // 3. Jika user tidak ditemukan atau password salah
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ error: "Username atau password salah!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔥 ANTI-SHARING: Generate Token Sesi Unik Baru menggunakan Web Crypto API bawaan Cloudflare
    const uuid = crypto.randomUUID(); 
    const sessionToken = `STRM-SESI-${uuid}`;

    // Simpan token baru ini ke database D1 (Otomatis menimpa token sesi perangkat lama)
    await db.prepare("UPDATE users SET session_token = ? WHERE username = ?")
              .bind(sessionToken, username)
              .run();

    // 4. Jika sukses login, kirim data user beserta status masa aktif dan session tokennya
    return new Response(JSON.stringify({ 
      message: "Login berhasil!",
      user: {
        id: user.id,
        username: user.username,
        subscription_until: user.subscription_until, // Ini untuk dicek di halaman streaming nanti
        session_token: sessionToken // <-- Kirim token ini agar bisa disimpan di sessionStorage browser user
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Terjadi kesalahan di server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

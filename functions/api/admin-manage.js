const ADMIN_PIN_RAHASIA = "130903"; 

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const inputPin = request.headers.get("X-Admin-PIN") || url.searchParams.get("pin");
  
  if (inputPin !== ADMIN_PIN_RAHASIA) {
    return new Response(JSON.stringify({ error: "Akses ditolak! PIN Admin salah." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Environment variable 'DB' tidak ditemukan!" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // --- OPSI 1: AMBIL DATA (GET) ---
  if (request.method === "GET") {
    try {
      // Ambil data semua user
      const { results: users } = await db.prepare("SELECT username, subscription_until AS subUntil FROM users ORDER BY rowid DESC").all();
      
      // Ambil data harga paket dari tabel baru
      const { results: packages } = await db.prepare("SELECT duration_days AS days, price FROM packages ORDER BY duration_days ASC").all();

      return new Response(JSON.stringify({
        users: users,
        packages: packages,
        serverTime: new Date().getTime()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // --- OPSI 2: SIMPAN DATA / UPDATE (POST) ---
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { action } = body;

      // Fitur A: Perpanjang Akun User
      if (action === "update_user") {
        const { username, new_sub_until } = body;
        await db.prepare("UPDATE users SET subscription_until = ? WHERE username = ?").bind(new_sub_until, username).run();
        return new Response(JSON.stringify({ success: true, message: `Masa aktif ${username} berhasil diperbarui!` }));
      }

      // Fitur B: Update Harga Paket Baru dari Panel Admin
      if (action === "update_price") {
        const { days, new_price } = body;
        await db.prepare("UPDATE packages SET price = ? WHERE duration_days = ?").bind(parseInt(new_price), parseInt(days)).run();
        return new Response(JSON.stringify({ success: true, message: `Harga paket ${days} hari berhasil diubah menjadi Rp ${parseInt(new_price).toLocaleString('id-ID')}!` }));
      }

      return new Response(JSON.stringify({ error: "Aksi tidak dikenali." }), { status: 400 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

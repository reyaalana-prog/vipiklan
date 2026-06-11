// PIN rahasia untuk masuk ke halaman admin kamu
const ADMIN_PIN_RAHASIA = "123456"; 

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Ambil PIN dari header atau parameter untuk validasi admin
  const inputPin = request.headers.get("X-Admin-PIN") || url.searchParams.get("pin");
  
  if (inputPin !== ADMIN_PIN_RAHASIA) {
    return new Response(JSON.stringify({ error: "Akses ditolak! PIN Admin salah atau tidak menyertakan identitas." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Ambil binding database D1 milik Arlyn
  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Environment variable 'DB' (Cloudflare D1) tidak ditemukan!" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // --- OPSI 1: JIKA MENERIMA REQUEST GET (AMBIL SEMUA USER DARI D1) ---
  if (request.method === "GET") {
    try {
      // Mengambil data user dari tabel 'users' di D1 kamu, diurutkan dari yang terbaru
      const { results } = await db.prepare("SELECT username, subUntil FROM users ORDER BY rowid DESC").all();
      
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // --- OPSI 2: JIKA MENERIMA REQUEST POST (UPDATE MASA AKTIF USER DI D1) ---
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { username, new_sub_until } = body;

      if (!username || !new_sub_until) {
        return new Response(JSON.stringify({ error: "Data kurang lengkap." }), { status: 400 });
      }

      // Update kolom subUntil di database D1 berdasarkan username
      const info = await db.prepare("UPDATE users SET subUntil = ? WHERE username = ?")
                          .bind(new_sub_until, username)
                          .run();

      if (!info.success) throw new Error("Gagal mengeksekusi query UPDATE di D1");

      return new Response(JSON.stringify({ success: true, message: `Masa aktif ${username} berhasil diperbarui!` }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

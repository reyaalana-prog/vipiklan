const ADMIN_PIN_RAHASIA = "123456"; 

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const inputPin = request.headers.get("X-Admin-PIN") || url.searchParams.get("pin");
  
  if (inputPin !== ADMIN_PIN_RAHASIA) {
    return new Response(JSON.stringify({ error: "Akses ditolak! PIN Admin salah atau tidak menyertakan identitas." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Environment variable 'DB' (Cloudflare D1) tidak ditemukan!" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // --- OPSI 1: JIKA MENERIMA REQUEST GET (AMBIL USER) ---
  if (request.method === "GET") {
    try {
      // FIX MUTLAK: Mengubah nama kolom menjadi 'subscription_until' sesuai database asli Arlyn
      const { results } = await db.prepare("SELECT username, subscription_until AS subUntil FROM users ORDER BY rowid DESC").all();
      
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

  // --- OPSI 2: JIKA MENERIMA REQUEST POST (UPDATE MASA AKTIF) ---
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { username, new_sub_until } = body;

      if (!username || !new_sub_until) {
        return new Response(JSON.stringify({ error: "Data kurang lengkap." }), { status: 400 });
      }

      // FIX MUTLAK: Mengubah SET menjadi 'subscription_until'
      const info = await db.prepare("UPDATE users SET subscription_until = ? WHERE username = ?")
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

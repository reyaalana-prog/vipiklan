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

      // 🔥 FITUR A (BERHASIL DIPERBAIKI): Perpanjang Akun User dengan Akumulasi Otomatis
      if (action === "update_user") {
        const { username, days_to_add } = body; 
        
        // 1. Ambil data subscription_until terakhir milik user dari database D1
        const userData = await db.prepare("SELECT subscription_until FROM users WHERE username = ?").bind(username).first();
        
        if (!userData) {
          return new Response(JSON.stringify({ error: "User tidak ditemukan!" }), { status: 404 });
        }

        const sekarang = new Date();
        let basisTanggal = sekarang; // Default: Jika expired, hitung dari hari ini

        if (userData.subscription_until) {
          // Ganti spasi dengan huruf 'T' agar format datetime ISO terbaca aman di semua platform javascript
          const formatIso = userData.subscription_until.replace(" ", "T");
          const tanggalDb = new Date(formatIso);
          
          // Jika tanggal di DB ternyata masih hidup (belum expired), jadikan tanggal DB sebagai basis akumulasi!
          if (tanggalDb.getTime() > sekarang.getTime()) {
            basisTanggal = tanggalDb;
          }
        }

        // 2. Tambahkan jumlah hari baru (misal ditambahkan 3 hari atau 10 hari)
        // Pastikan days_to_add dikonversi ke integer agar tidak terjadi penggabungan teks string
        const durasiHari = parseInt(days_to_add) || 3; 
        basisTanggal.setDate(basisTanggal.getDate() + durasiHari);

        // 3. Konversi kembali ke format standar database "YYYY-MM-DD HH:MM:SS"
        const yyyy = basisTanggal.getFullYear();
        const mm = String(basisTanggal.getMonth() + 1).padStart(2, '0');
        const dd = String(basisTanggal.getDate()).padStart(2, '0');
        const hh = String(basisTanggal.getHours()).padStart(2, '0');
        const min = String(basisTanggal.getMinutes()).padStart(2, '0');
        const ss = String(basisTanggal.getSeconds()).padStart(2, '0');
        
        const tanggalFinalDb = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

        // 4. Eksekusi simpan pembaharuan akumulasi permanen ke database Cloudflare D1
        await db.prepare("UPDATE users SET subscription_until = ? WHERE username = ?").bind(tanggalFinalDb, username).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Masa aktif ${username} sukses ditambah ${durasiHari} hari! Tanggal baru: ${tanggalFinalDb}` 
        }));
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

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const db = env.DB;

  // 🔥 ANTI-SHARING: Ambil data username & token dari dashboard.html
  const userClient = url.searchParams.get("user");
  const tokenClient = url.searchParams.get("token");

  if (!userClient || !tokenClient) {
    return new Response(JSON.stringify({ error: "KICK_USER", message: "Sesi tidak valid atau telah berakhir, silakan login ulang." }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 🔥 ANTI-SHARING: Validasi token database D1 Cloudflare
    const userDb = await db.prepare("SELECT session_token FROM users WHERE username = ?").bind(userClient).first();

    if (!userDb || userDb.session_token !== tokenClient) {
      return new Response(JSON.stringify({ error: "KICK_USER", message: "Akun Anda terdeteksi sedang digunakan di perangkat lain!" }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- DATA BUNNY.NET MILIK ARLYN ----
    const LIBRARY_ID = "680881"; 
    const API_KEY = "9a5faa61-f848-47c9-9d03608118cd-7985-4fcc"; 

    let allVideos = [];
    let currentPage = 1;
    let keepFetching = true;

    // 🔄 AUTOMATIC WHILE-LOOP PAGINATION SYSTEM (ANTI LIMIT MASA DEPAN)
    while (keepFetching) {
      const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=${currentPage}&perPage=100`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'AccessKey': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Bunny.net Error ${response.status} pada halaman ${currentPage}`);
      }

      const data = await response.json();
      const items = data.items || (Array.isArray(data) ? data : []);

      // Jika halaman ini mengembalikan data video, masukkan ke dalam penampung raksasa
      if (items.length > 0) {
        allVideos = allVideos.concat(items);
        currentPage++; // Naik ke halaman berikutnya otomatis (Page 2, Page 3, dst...)
      } else {
        // Begitu halaman kosong / tidak ada video lagi, matikan perulangan!
        keepFetching = false;
      }

      // Pengaman darurat (Guard): Biar ga terjadi infinite loop kalau ada eror ekstrim
      if (currentPage > 20) { 
        keepFetching = false; 
      }
    }

    return new Response(JSON.stringify(allVideos), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        // ⚡ BERHASIL DIOPTIMALKAN: Simpan cache di edge CDN Cloudflare selama 5 menit (300 detik) agar muat awal dashboard instan!
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

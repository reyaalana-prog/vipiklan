export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const db = env.DB;

  // 🔥 ANTI-SHARING: Ambil data username & token yang dikirim oleh dashboard.html via parameter URL
  const userClient = url.searchParams.get("user");
  const tokenClient = url.searchParams.get("token");

  // Jika data kredensial sesi kosong, langsung potong akses di sini
  if (!userClient || !tokenClient) {
    return new Response(JSON.stringify({ error: "KICK_USER", message: "Sesi tidak valid atau telah berakhir, silakan login ulang." }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 🔥 ANTI-SHARING: Ambil token valid terakhir yang tersimpan di dalam database D1 Cloudflare
    const userDb = await db.prepare("SELECT session_token FROM users WHERE username = ?").bind(userClient).first();

    // Jika token di browser user tidak sama dengan token terakhir di database D1, artinya akun ini baru saja login di HP/perangkat lain!
    if (!userDb || userDb.session_token !== tokenClient) {
      return new Response(JSON.stringify({ error: "KICK_USER", message: "Akun Anda terdeteksi sedang digunakan di perangkat lain!" }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- DATA BUNNY.NET MILIK ARLYN ASLI (LOLOS 401) ----
    const LIBRARY_ID = "680881"; 
    const API_KEY = "9a5faa61-f848-47c9-9d03608118cd-7985-4fcc"; 

    // 🔥 BERHASIL DIPERBAIKI: perPage dinaikkan menjadi 1000 agar seluruh 170 video nampil sekaligus
    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=1&perPage=1000`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'AccessKey': API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data.items || data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
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

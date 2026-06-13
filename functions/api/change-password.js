// ========================================================================
// API ENDPOINT: POST /api/change-password
// Kodingan khusus Cloudflare Pages Functions
// ========================================================================

export async function onRequestPost(context) {
  const { request, env } = context;

  // Setup Header CORS agar aman diakses dari dashboard.html
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();
    const { user, token, oldPassword, newPassword } = body;

    // 1. Validasi Input
    if (!user || !token || !oldPassword || !newPassword) {
      return new Response(JSON.stringify({ success: false, message: "Semua data input wajib diisi!" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (newPassword.length < 4) {
      return new Response(JSON.stringify({ success: false, message: "Password baru minimal 4 karakter!" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Cek Validasi Sesi Aktif di tabel sessions database D1
    const tokenValid = await env.DB.prepare(
      "SELECT username FROM sessions WHERE username = ? AND token = ?"
    ).bind(user, token).first();

    if (!tokenValid) {
      return new Response(JSON.stringify({ success: false, message: "Sesi tidak sah atau kadaluwarsa! Silakan login ulang." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Verifikasi Password Lama di tabel users database D1
    const dataAkun = await env.DB.prepare(
      "SELECT password FROM users WHERE username = ?"
    ).bind(user).first();

    if (!dataAkun || dataAkun.password !== oldPassword) {
      return new Response(JSON.stringify({ success: false, message: "Password LAMA yang Anda masukkan salah!" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 4. Eksekusi Perubahan Password Baru di Database D1
    await env.DB.prepare(
      "UPDATE users SET password = ? WHERE username = ?"
    ).bind(newPassword, user).run();

    return new Response(JSON.stringify({ success: true, message: "Password Anda berhasil diperbarui!" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Terjadi kesalahan sistem: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// Tangani preflight request dari browser otomatis
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}

export async function onRequest(context) {
  // 1. Ambil Kunci Kredensial Supabase dari Environment Variables Cloudflare / Direct Variable
  const SUPABASE_URL = context.env.SUPABASE_URL || "https://rpwpufayiqhqjbygssas.supabase.co";
  const SUPABASE_KEY = context.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd3B1ZmF5aXFocWpieWdzc2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjQ3MzYsImV4cCI6MjA5ODY0MDczNn0.gf8wHrw3XV3nXD8JYfCHPGfyuMS7-JXxYwd0KTHnuEg";

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    // 2. Fetch data secara paralel dari tabel videos1 dan videos2
    const [res1, res2] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/videos1?select=id,title,slug,videy_id,kategori,created_at`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/videos2?select=id,title,slug,videy_id,kategori,created_at`, { headers })
    ]);

    const data1 = res1.ok ? await res1.json() : [];
    const data2 = res2.ok ? await res2.json() : [];

    // 3. Gabungkan kedua daftar video menjadi satu array
    const combinedVideos = [...data1, ...data2];

    // 4. Urutkan video dari yang paling baru (berdasarkan created_at)
    combinedVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return new Response(JSON.stringify(combinedVideos), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

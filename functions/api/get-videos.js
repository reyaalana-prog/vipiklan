export async function onRequestGet(context) {
  const { env } = context;

  // Data Bunny.net milik Arlyn
  const LIBRARY_ID = "680881"; 
  const API_KEY = "e33bda09-efca-431a-ab6a-20503328-432f-4fc6"; 

  try {
    // PERBAIKAN UTAMA: Mengubah domain ke regional server 'sg.video.bunny.net' untuk bypass Error 1016
    const response = await fetch(`https://sg.video.bunny.net/library/${LIBRARY_ID}/videos?page=1&perPage=100&orderBy=date`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'AccessKey': API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Kirim daftar video ke front-end website kita dengan tambahan header CORS
    return new Response(JSON.stringify(data.items), {
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
      status: 200, // Tetap gunakan status 200 agar pesan error terbaca jelas di front-end jika gagal
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

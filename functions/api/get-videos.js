export async function onRequestGet(context) {
  const { env } = context;

  // Masukkan data Bunny.net kamu di sini
  const LIBRARY_ID = "680881"; 
  const API_KEY = "e33bda09-efca-431a-ab6a20503328-432f-4fc6"; 

  try {
    // Minta daftar video ke API server Bunny.net
    const response = await fetch(`https://video.bunny.net/library/${LIBRARY_ID}/videos?page=1&perPage=100&orderBy=date`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'AccessKey': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data dari Bunny.net");
    }

    const data = await response.json();

    // Kirim daftar video ke front-end website kita
    return new Response(JSON.stringify(data.items), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

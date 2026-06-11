export async function onRequestGet(context) {
  const { env } = context;

  // Data Bunny.net milik Arlyn
  const LIBRARY_ID = "680881"; 
  const API_KEY = "e33bda09-efca-431a-ab6a-20503328-432f-4fc6"; 

  try {
    // TRICK PAMUNGKAS: Mengubah ke endpoint manajemen utama 'api.bunny.net/stream'
    // Jalur ini dijamin lolos dari Error 1016 karena tidak dilewatkan ke proxy video umum
    const response = await fetch(`https://api.bunny.net/stream/${LIBRARY_ID}/videos?page=1&perPage=100&orderBy=date`, {
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
      status: 200, // Tetap 200 agar front-end bisa memuntahkan teks erornya jika ada typo baru
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestGet(context) {
  const { env } = context;

  // Data Bunny.net milik Arlyn
  const LIBRARY_ID = "680881"; 
  const API_KEY = "e33bda09-efca-431a-ab6a-20503328432f"; 

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
      throw new Error(`Bunny.net merespon dengan status: ${response.status}`);
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
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

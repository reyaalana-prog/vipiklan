export async function onRequestGet(context) {
  const { env } = context;

  const LIBRARY_ID = "680881"; 
  const API_KEY = "e33bda09-efca-431a-ab6a20503328-432f-4fc6"; // Ganti ke Read-only API Key asli kamu jika sebelumnya sempat diubah

  try {
    const response = await fetch(`https://video.bunny.net/library/${LIBRARY_ID}/videos?page=1&perPage=100&orderBy=date`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'AccessKey': API_KEY,
        'User-Agent': 'CloudflarePagesFunction/1.0'
      }
    });

    // JIKA BUNNY MENOLAK, TANGKAP PESAN ERROR ASLINYA DI SINI
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data.items), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    // MODIFIKASI: Kirim detail error asli agar tampil di tulisan merah dashboard
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Kita set 200 dulu biar front-end mau membaca pesan error-nya
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase menggunakan Service Role Key agar memiliki izin penghapusan
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action } = JSON.parse(event.body);
    
    // 1. Ambil semua data user untuk dianalisis (Deep Scan)
    // Kita mengambil kolom username, balance, dan IP
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, wallet_balance, last_ip');

    if (fetchError) throw fetchError;

    // 2. Definisi Pola Bot dan Pelanggaran
    // Pola: Karakter apapun + Underscore + Angka di akhir (e.g., mantapgasihbang_51)
    const botPattern = /.*_\d+$/;
    const suspiciousKeywords = ['mampus', 'tembus', 'breach', 'pwned', 'makantuhh', 'mantapgasih'];

    // 3. Proses Penyaringan (Logic Filter)
    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotName = botPattern.test(name);
      const hasBadWord = suspiciousKeywords.some(word => name.includes(word));
      const isBadBalance = balance === 999;

      return isBotName || hasBadWord || isBadBalance;
    });

    // --- ACTION: PREVIEW ---
    if (action === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          users: suspiciousUsers 
        })
      };
    } 
    
    // --- ACTION: DELETE ALL ---
    if (action === 'delete_all') {
      if (suspiciousUsers.length === 0) {
        return { 
          statusCode: 200, 
          body: JSON.stringify({ success: true, count: 0 }) 
        };
      }

      // Ambil hanya daftar username yang akan dihapus
      const targetUsernames = suspiciousUsers.map(u => u.username);

      const { error: deleteError, count } = await supabase
        .from('users')
        .delete({ count: 'exact' })
        .in('username', targetUsernames);

      if (deleteError) throw deleteError;

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          count: count || 0 
        })
      };
    }

    return { statusCode: 400, body: "Invalid Action" };

  } catch (err) {
    console.error("Cleanup Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};

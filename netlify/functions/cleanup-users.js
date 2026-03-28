const { createClient } = require('@supabase/supabase-js');

// Menggunakan Service Role Key agar memiliki izin untuk menghapus data
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action } = JSON.parse(event.body);
    
    // 1. Ambil semua user untuk dianalisis secara mendalam (Deep Scan)
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, wallet_balance, last_ip');

    if (fetchError) throw fetchError;

    /**
     * LOGIKA DETEKSI OTOMATIS (REGEX)
     * Pola: Karakter apa pun + Underscore + Angka di akhir
     * Ini akan menangkap: mantapgasih_1120, member_1, makantuhh_905, dll.
     */
    const botPattern = /.*_\d+$/; 
    const suspiciousKeywords = ['mampus', 'tembus', 'breach', 'pwned', 'makantuhh'];

    // 2. Filter akun yang memenuhi kriteria bot atau pelanggaran
    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotPattern = botPattern.test(name); // Deteksi otomatis berdasarkan pola
      const hasBadWord = suspiciousKeywords.some(word => name.includes(word));
      const isBadBalance = balance === 999; // Deteksi berdasarkan saldo ilegal

      return isBotPattern || hasBadWord || isBadBalance;
    });

    // --- AKSI: PREVIEW (Melihat Daftar) ---
    if (action === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, users: suspiciousUsers })
      };
    } 
    
    // --- AKSI: DELETE_ALL (Menghapus Semua Terdeteksi) ---
    if (action === 'delete_all') {
      if (suspiciousUsers.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ success: true, count: 0 }) };
      }

      const targetUsernames = suspiciousUsers.map(u => u.username);

      const { error: deleteError, count } = await supabase
        .from('users')
        .delete({ count: 'exact' })
        .in('username', targetUsernames);

      if (deleteError) throw deleteError;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, count: count || 0 })
      };
    }

    return { statusCode: 400, body: "Invalid Action" };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};

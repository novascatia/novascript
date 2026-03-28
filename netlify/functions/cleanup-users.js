const { createClient } = require('@supabase/supabase-js');

// Menggunakan Service Role Key agar memiliki izin penghapusan massal
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // --- PROSES PENGAMBILAN DATA TOTAL (BYPASS LIMIT) ---
    let allUsers = [];
    let rangeStart = 0;
    const rangeStep = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from('users')
        .select('username, password, wallet_balance, last_ip')
        .range(rangeStart, rangeStart + rangeStep - 1);

      if (error) throw error;
      
      allUsers = allUsers.concat(data);
      if (data.length < rangeStep) keepFetching = false;
      else rangeStart += rangeStep;
    }

    // --- LOGIKA DETEKSI BOT AGRESIF ---
    // 1. Pola Username: member_123, novacupu123, makantuhh_123, atau teks+angka panjang
    const botNamePattern = /(member_|novacupu|makantuhh|mantapgasih).*?\d+$/i;
    
    // 2. Pola Password: Mengandung kata 'noob', 'scam', atau diakhiri angka sangat panjang
    const suspiciousPwPattern = /(noob|scam|goblok|tolol|noobkali).*?\d+$/i;

    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const pw = (user.password || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotName = botNamePattern.test(name);
      const isBadPw = suspiciousPwPattern.test(pw);
      const isBadBalance = balance === 999;
      
      // Tambahan: Deteksi jika username mengandung kata kunci tanpa angka pun tetap kena
      const hasBadWord = ['mampus', 'tembus', 'breach'].some(word => name.includes(word));

      return isBotName || isBadPw || isBadBalance || hasBadWord;
    });

    // --- AKSI: PREVIEW ---
    if (action === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, users: suspiciousUsers })
      };
    } 
    
    // --- AKSI: DELETE_ALL ---
    if (action === 'delete_all') {
      if (suspiciousUsers.length === 0) return { statusCode: 200, body: JSON.stringify({ success: true, count: 0 }) };

      const targetUsernames = suspiciousUsers.map(u => u.username);
      let totalDeleted = 0;

      // Hapus dalam batch 100 agar aman dari limit Netlify/Supabase
      for (let i = 0; i < targetUsernames.length; i += 100) {
        const batch = targetUsernames.slice(i, i + 100);
        const { count, error } = await supabase
          .from('users')
          .delete({ count: 'exact' })
          .in('username', batch);
        
        if (error) throw error;
        totalDeleted += (count || 0);
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, count: totalDeleted }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

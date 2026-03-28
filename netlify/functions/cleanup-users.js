const { createClient } = require('@supabase/supabase-js');

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

    // --- LOGIKA DETEKSI BOT EKSTRIM ---
    // 1. Pola Username: Kata kunci sombong/bot + angka di akhir (min 3 digit)
    // Menangkap: novasokberkuasa384, novacupu12345, member_999, dll.
    const botNamePattern = /(member_|novacupu|novasokberkuasa|makantuhh|mantapgasih|bot|user).*?\d{3,}$/i;
    
    // 2. Pola Password: Password umum + angka panjang di akhir
    // Menangkap: password123356, webscamnoob123, dll.
    const suspiciousPwPattern = /(password|noob|scam|goblok|tolol|admin|12345).*?\d{3,}$/i;

    // 3. Pola Umum: Username apa pun yang diakhiri angka lebih dari 5 digit (Sangat jarang dilakukan user asli)
    const longNumberPattern = /.*?\d{5,}$/;

    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const pw = (user.password || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotName = botNamePattern.test(name) || longNumberPattern.test(name);
      const isBadPw = suspiciousPwPattern.test(pw);
      const isBadBalance = balance === 999;
      
      const hasBadWord = ['mampus', 'tembus', 'breach', 'sokberkuasa'].some(word => name.includes(word));

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

      // Batch delete agar tidak crash
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

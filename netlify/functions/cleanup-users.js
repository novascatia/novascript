const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // 1. Ambil data secara bertahap (Bypass Limit)
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

    // 2. LOGIKA DETEKSI YANG DIPERKETAT (ANTI SALAH TANGKAP)
    // Pola Bot: Nama yang diakhiri angka minimal 3 digit (e.g., Grock123 kena, tapi Grock aman)
    const botNamePattern = /.*_\d{1,}$|.*?\d{3,}$/i;
    
    // Kata kunci yang benar-benar dilarang
    const forbiddenKeywords = ['novacupu', 'novasokberkuasa', 'makantuhh', 'mampus', 'tembus', 'breach'];
    
    // Kata kunci password bot
    const badPwKeywords = ['noob', 'scam', 'goblok', 'tolol', 'password123'];

    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const pw = (user.password || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      // --- VALIDASI ---
      // Cek apakah username punya pola bot (akhiran angka banyak)
      const isBotName = botNamePattern.test(name);
      
      // Cek apakah mengandung kata terlarang
      const hasForbiddenWord = forbiddenKeywords.some(word => name.includes(word));
      
      // Cek apakah passwordnya pola bot
      const isBadPw = badPwKeywords.some(word => pw.includes(word)) && /\d{3,}/.test(pw);
      
      // Cek saldo suntikan
      const isBadBalance = balance === 999;

      // JANGAN MASUKKAN jika username pendek dan tidak punya angka di akhir (e.g., Grock, Dexterity)
      // Ini adalah pengaman agar user asli tidak kena
      const isRealUser = /^[a-zA-Z]+$/.test(name) && name.length > 2;
      
      if (isRealUser && !hasForbiddenWord && !isBadBalance) return false;

      return isBotName || hasForbiddenWord || isBadPw || isBadBalance;
    });

    if (action === 'preview') {
      return { statusCode: 200, body: JSON.stringify({ success: true, users: suspiciousUsers }) };
    } 
    
    if (action === 'delete_all') {
      if (suspiciousUsers.length === 0) return { statusCode: 200, body: JSON.stringify({ success: true, count: 0 }) };
      const targetUsernames = suspiciousUsers.map(u => u.username);
      let totalDeleted = 0;
      for (let i = 0; i < targetUsernames.length; i += 100) {
        const batch = targetUsernames.slice(i, i + 100);
        const { count, error } = await supabase.from('users').delete({ count: 'exact' }).in('username', batch);
        if (error) throw error;
        totalDeleted += (count || 0);
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, count: totalDeleted }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

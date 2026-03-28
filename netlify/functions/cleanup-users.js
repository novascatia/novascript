const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // --- PROSES PENGAMBILAN DATA TANPA LIMIT (RECURSIVE FETCH) ---
    let allUsers = [];
    let errorFetch = null;
    let rangeStart = 0;
    const rangeStep = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from('users')
        .select('username, wallet_balance, last_ip')
        .range(rangeStart, rangeStart + rangeStep - 1);

      if (error) {
        errorFetch = error;
        keepFetching = false;
      } else {
        allUsers = allUsers.concat(data);
        if (data.length < rangeStep) {
          keepFetching = false; // Data sudah habis
        } else {
          rangeStart += rangeStep;
        }
      }
    }

    if (errorFetch) throw errorFetch;

    // --- LOGIKA FILTERING POLA BOT ---
    const botPattern = /.*_\d+$/; 
    const suspiciousKeywords = ['mampus', 'tembus', 'breach', 'pwned', 'makantuhh', 'mantapgasih'];

    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);
      return botPattern.test(name) || suspiciousKeywords.some(word => name.includes(word)) || balance === 999;
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

      // Hapus dalam batch 500 untuk menghindari payload limit
      for (let i = 0; i < targetUsernames.length; i += 500) {
        const batch = targetUsernames.slice(i, i + 500);
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

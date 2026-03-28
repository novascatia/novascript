const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // 1. Ambil seluruh data user dari database
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, wallet_balance, last_ip');

    if (fetchError) throw fetchError;

    // 2. Definisi Pola Bot Otomatis
    // Mencari teks apa pun yang diakhiri dengan underscore dan angka (e.g., _2043)
    const botPattern = /.*_\d+$/; 
    const suspiciousKeywords = ['mampus', 'tembus', 'breach', 'pwned', 'makantuhh', 'mantapgasih'];

    // 3. Filter akun mencurigakan
    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotName = botPattern.test(name);
      const hasBadWord = suspiciousKeywords.some(word => name.includes(word));
      const isBadBalance = balance === 999;

      return isBotName || hasBadWord || isBadBalance;
    });

    // ACTION: PREVIEW
    if (action === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, users: suspiciousUsers })
      };
    } 
    
    // ACTION: DELETE ALL
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
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

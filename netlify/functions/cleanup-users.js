const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // Tarik semua data untuk pengecekan pola yang lebih akurat
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, wallet_balance, last_ip');

    if (fetchError) throw fetchError;

    // REGEX: Mendeteksi karakter apa pun yang diakhiri dengan underscore dan angka (e.g., _2783)
    const botPattern = /.*_\d+$/; 
    const suspiciousKeywords = ['mampus', 'tembus', 'breach', 'pwned', 'makantuhh', 'mantapgasih'];

    // Proses filtering manual
    const suspiciousUsers = allUsers.filter(user => {
      const name = (user.username || "").toLowerCase();
      const balance = parseInt(user.wallet_balance || 0);

      const isBotName = botPattern.test(name);
      const hasBadWord = suspiciousKeywords.some(word => name.includes(word));
      const isBadBalance = balance === 999;

      return isBotName || hasBadWord || isBadBalance;
    });

    if (action === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, users: suspiciousUsers })
      };
    } 
    
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

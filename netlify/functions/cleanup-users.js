const { createClient } = require('@supabase/supabase-js');

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
    
    // Kriteria deteksi:
    // 1. Username mengandung underscore dan angka di akhir (contoh: user_123) -> menggunakan regex ~ '.*_[0-9]+$'
    // 2. Username mengandung kata kunci breach
    // 3. Wallet balance tepat 999
    const badWords = ['%mampus%', '%tembus%', '%breach%', '%pwned%', '%ez%'];
    const filterParts = badWords.map(p => `username.ilike.${p}`);
    
    // Menambahkan filter regex untuk pola underscore + angka
    filterParts.push('username.adj.*_[0-9]+$'); 
    filterParts.push('wallet_balance.eq.999');

    if (action === 'preview') {
      const { data, error } = await supabase
        .from('users')
        .select('username, wallet_balance, last_ip, created_at')
        .or(filterParts.join(','));

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, users: data }) };
    } 
    
    if (action === 'delete_all') {
      const { data, error, count } = await supabase
        .from('users')
        .delete({ count: 'exact' })
        .or(filterParts.join(','));

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, count: count || 0 }) };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

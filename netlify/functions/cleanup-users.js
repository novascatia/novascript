const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // Filter dasar untuk mengambil data yang berpotensi melanggar
    const filterParts = [
      'username.ilike.%_%',           // Semua yang punya underscore
      'wallet_balance.eq.999',        // Saldo ilegal
      'username.ilike.%mampus%',      // Kata kunci toksik/breach
      'username.ilike.%tembus%',
      'username.ilike.%makantuhh%'
    ];

    // Regex untuk mendeteksi teks yang diakhiri _ dan angka (Contoh: makantuhh_905)
    const botRegex = /.*_\d+$/;

    if (action === 'preview') {
      const { data, error } = await supabase
        .from('users')
        .select('username, wallet_balance, last_ip')
        .or(filterParts.join(','));

      if (error) throw error;

      // Filter ketat: Hanya tampilkan yang benar-benar bot atau melanggar
      const suspiciousUsers = data.filter(u => {
        const name = u.username.toLowerCase();
        return botRegex.test(name) || u.wallet_balance == 999 || name.includes('makantuhh');
      });

      return { statusCode: 200, body: JSON.stringify({ success: true, users: suspiciousUsers }) };
    } 
    
    if (action === 'delete_all') {
      const { data: allData } = await supabase
        .from('users')
        .select('username')
        .or(filterParts.join(','));

      // Tentukan daftar username yang akan dihapus secara spesifik
      const targets = allData
        .filter(u => botRegex.test(u.username.toLowerCase()) || u.username.toLowerCase().includes('makantuhh'))
        .map(u => u.username);

      if (targets.length === 0) return { statusCode: 200, body: JSON.stringify({ success: true, count: 0 }) };

      const { error, count } = await supabase
        .from('users')
        .delete({ count: 'exact' })
        .in('username', targets);

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, count: count || 0 }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

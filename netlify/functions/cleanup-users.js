const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // Mengambil user yang memiliki underscore, saldo mencurigakan, atau kata kunci tertentu
    const filterParts = [
      'username.ilike.%_%', 
      'wallet_balance.eq.999',
      'username.ilike.%mampus%',
      'username.ilike.%tembus%',
      'username.ilike.%makantuhh%'
    ];

    if (action === 'preview') {
      const { data, error } = await supabase
        .from('users')
        .select('username, wallet_balance, last_ip')
        .or(filterParts.join(','));

      if (error) throw error;

      // Filter ketat di sisi server: mendeteksi pola 'apapun_angka' di akhir nama
      const suspiciousUsers = data.filter(u => {
        const name = u.username.toLowerCase();
        const isBotPattern = /.*_\d+$/.test(name); 
        const isBadWord = name.includes('mampus') || name.includes('tembus') || name.includes('makantuhh');
        const isBadBalance = u.wallet_balance == 999;

        return isBotPattern || isBadWord || isBadBalance;
      });

      return { statusCode: 200, body: JSON.stringify({ success: true, users: suspiciousUsers }) };
    } 
    
    if (action === 'delete_all') {
      const { data: allSuspicious } = await supabase
        .from('users')
        .select('username')
        .or(filterParts.join(','));

      // Mencari target yang sesuai dengan pola regex untuk dihapus
      const targets = allSuspicious
        .filter(u => /.*_\d+$/.test(u.username) || u.username.includes('makantuhh'))
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

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { action } = JSON.parse(event.body);
    
    // Kriteria pencarian database yang dipersempit agar tidak 'detect all'
    const filterParts = [
      'username.ilike.member_%',      // Hanya yang diawali 'member_'
      'wallet_balance.eq.999',        // Saldo suntikan ilegal
      'username.ilike.%mampus%',      // Kata kunci breach
      'username.ilike.%tembus%'
    ];

    if (action === 'preview') {
      const { data, error } = await supabase
        .from('users')
        .select('username, wallet_balance, last_ip')
        .or(filterParts.join(','));

      if (error) throw error;
      
      // Filter tambahan di server-side untuk memastikan pola member_ANGKA
      const filteredData = data.filter(u => {
        const name = u.username.toLowerCase();
        return /^member_\d+$/.test(name) || u.wallet_balance == 999 || name.includes('mampus') || name.includes('tembus');
      });

      return { statusCode: 200, body: JSON.stringify({ success: true, users: filteredData }) };
    } 
    
    if (action === 'delete_all') {
      // Menghapus data berdasarkan kriteria OR yang sudah ditentukan
      const { error, count } = await supabase
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

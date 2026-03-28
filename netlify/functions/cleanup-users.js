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
    
    // Daftar kata kunci yang sering digunakan akun bot/breach
    const badPatterns = ['%mampus%', '%tembus%', '%breach%', '%pwned%', '%ez%'];
    
    // Membangun query untuk mendeteksi username atau balance 999
    let query = supabase.from('users').select('username, wallet_balance, last_ip');
    
    // Gunakan filter OR untuk pola-pola tersebut
    const filterParts = badPatterns.map(p => `username.ilike.${p}`);
    filterParts.push('wallet_balance.eq.999');
    
    query = query.or(filterParts.join(','));

    if (action === 'preview') {
      const { data, error } = await query;
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, users: data })
      };
    } 
    
    if (action === 'delete_all') {
      // Melakukan penghapusan berdasarkan kriteria yang sama
      const { data, error, count } = await supabase
        .from('users')
        .delete({ count: 'exact' })
        .or(filterParts.join(','));

      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, count: count || 0 })
      };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

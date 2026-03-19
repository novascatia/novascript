const { createClient } = require('@supabase/supabase-js');

// PENTING: Nama di dalam process.env.HARUS_SAMA dengan di Netlify
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

exports.handler = async (event, context) => {
  // Cek apakah key terbaca atau tidak (untuk debug)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Config Error: Key tidak ditemukan di Netlify" })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { data, error, count } = await supabase
      .from('users') 
      .delete({ count: 'exact' })
      .eq('wallet_balance', 999);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Berhasil', count: count || 0 })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

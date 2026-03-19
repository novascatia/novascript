const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Gunakan Service Role agar punya izin delete
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Cari dan hapus user yang balancenya tepat 999
    const { data, error, count } = await supabase
      .from('users') // Pastikan nama tabelnya benar (users atau profiles)
      .delete({ count: 'exact' })
      .eq('balance', 999);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Cleanup sukses', count: count || 0 })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

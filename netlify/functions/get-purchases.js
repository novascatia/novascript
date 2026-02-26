// netlify/functions/get-purchases.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const username = event.queryStringParameters.username;
    if (!username) return { statusCode: 400, body: 'Missing username' };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('purchases').select('script_id').eq('user_username', username);
    
    if (error) return { statusCode: 400, body: JSON.stringify({ success: false }) };
    
    // Kembalikan array berisi ID script yang sudah dibeli
    const ownedIds = data.map(item => item.script_id);
    return { statusCode: 200, body: JSON.stringify({ success: true, owned_scripts: ownedIds }) };
};

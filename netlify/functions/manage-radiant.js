const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // --- SISTEM KEAMANAN (AUTHORIZATION) ---
    const authHeader = event.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : '';

    // Jika token yang dikirim browser TIDAK SAMA dengan token di Netlify, tolak!
    if (token !== process.env.RADIANT_TOKEN) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized! Akses Ditolak.' }) };
    }
    // ---------------------------------------

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const method = event.httpMethod;

    try {
        if (method === 'GET') {
            const isAdmin = event.queryStringParameters.admin === 'true';
            let query = supabase.from('radiant_scripts').select('*').order('created_at', { ascending: false });
            
            if (!isAdmin) { query = query.eq('is_active', true); }

            const { data, error } = await query;
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true, scripts: data }) };
        } 
        else if (method === 'POST') {
            const { title, description, loader_script } = JSON.parse(event.body);
            const { error } = await supabase.from('radiant_scripts').insert([{ title, description, loader_script, is_active: true }]);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }
        else if (method === 'PATCH') {
            const { id, is_active } = JSON.parse(event.body);
            const { error } = await supabase.from('radiant_scripts').update({ is_active }).eq('id', id);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }
        else if (method === 'DELETE') {
            const { id } = JSON.parse(event.body);
            const { error } = await supabase.from('radiant_scripts').delete().eq('id', id);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

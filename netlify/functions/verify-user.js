const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const { username } = JSON.parse(event.body);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // Cek apakah username ada di database
        const { data: user, error } = await supabase.from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (error || !user) {
            return { statusCode: 200, body: JSON.stringify({ exists: false }) };
        }

        return { statusCode: 200, body: JSON.stringify({ exists: true }) };
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ exists: false }) };
    }
};

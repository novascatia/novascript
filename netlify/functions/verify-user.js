const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Bisa ambil dari Query String (GET) atau Body (POST)
    const username = event.queryStringParameters.username || (event.body && JSON.parse(event.body).username);
    
    if (!username) return { statusCode: 400, body: JSON.stringify({ exists: false, message: 'No username' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        const { data: user, error } = await supabase.from('users').select('username').eq('username', username).single();
        if (error || !user) return { statusCode: 200, body: JSON.stringify({ exists: false }) };
        
        return { statusCode: 200, body: JSON.stringify({ exists: true }) };
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ exists: false }) };
    }
};

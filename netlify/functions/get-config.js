// netlify/functions/get-config.js

exports.handler = async () => {
    // Ambil variabel lingkungan yang diatur di Netlify
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY; 

    if (!supabaseUrl || !supabaseKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Supabase environment variables not set.' }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', 
        },
        body: JSON.stringify({
            supabaseUrl: supabaseUrl,
            supabaseKey: supabaseKey,
        }),
    };
};
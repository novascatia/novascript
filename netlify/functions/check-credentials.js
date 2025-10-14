// netlify/functions/fetch-user-data.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// PENTING: Gunakan Service Role Key untuk verifikasi token yang aman
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
    // 1. Dapatkan Token dari Header Authorization
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Missing token.' }) };
    }

    const token = authHeader.substring(7);

    // 2. Verifikasi Token Supabase menggunakan Service Key
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        // Jika token tidak valid, kadaluarsa, atau user tidak ditemukan
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token.' }) };
    }

    const user_id = user.id; // User ID yang terverifikasi

    try {
        // A. Fetch User Keys (Filter berdasarkan user_id)
        const { data: keys, error: keysError } = await supabase
            .from('script_keys')
            .select('*')
            .eq('user_id', user_id) 
            .order('created_at', { ascending: false });

        if (keysError) {
            console.error('Error fetching keys:', keysError);
            throw new Error('Failed to fetch keys.');
        }

        // B. Fetch Admin Script (Post dengan ID: 'latest-script')
        const { data: scriptPost, error: scriptError } = await supabase
            .from('posts')
            .select('content, title')
            .eq('id', 'latest-script')
            .single();
            
        if (scriptError && scriptError.code !== 'PGRST116') { // PGRST116: No rows found
             console.error('Error fetching script:', scriptError);
        }

        const responseData = {
            keys: keys || [],
            script: scriptPost ? { title: scriptPost.title, content: scriptPost.content } : null
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
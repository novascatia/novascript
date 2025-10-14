// netlify/functions/fetch-user-data.js
const { createClient } = require('@supabase/supabase-js');

// Menggunakan public key untuk fungsi ini (atau anon key)
// Keamanan dijamin oleh Row Level Security (RLS) di Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // Memastikan konteks otentikasi Netlify tersedia
    const user = context.clientContext && context.clientContext.user;

    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Not authenticated.' }),
        };
    }

    const user_id = user.sub; // user.sub adalah UUID pengguna Supabase Auth

    try {
        // A. Fetch User Keys
        // RLS harus disetel agar ini hanya mengembalikan kunci milik user_id ini.
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
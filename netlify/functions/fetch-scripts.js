// netlify/functions/fetch-scripts.js
const { createClient } = require('@supabase/supabase-js');

// Menggunakan Anon Key (Key Publik) untuk operasi baca/read
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async () => {
    try {
        // Mengambil skrip dari tabel 'posts' yang TIDAK tersembunyi
        const { data: scripts, error } = await supabase
            .from('posts') 
            .select('id, title, description')
            .eq('is_hidden', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scripts:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching available scripts' }),
            };
        }
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scripts),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
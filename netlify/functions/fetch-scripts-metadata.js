// netlify/functions/fetch-scripts-metadata.js
const { createClient } = require('@supabase/supabase-js');
// Menggunakan Anon Key karena ini hanya membaca data PUBLIK (melalui RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY; 

exports.handler = async () => {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Mengambil metadata script yang aktif
        const { data: scripts, error } = await supabase
            .from('scripts')
            .select('id, title, description, version, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scripts:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching scripts' }),
            };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(scripts),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

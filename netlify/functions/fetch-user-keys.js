// netlify/functions/fetch-user-keys.js
const { createClient } = require('@supabase/supabase-js');

// Menggunakan Service Role Key untuk operasi backend yang aman 
// (SUPABASE_SERVICE_KEY harus diatur di Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userId } = JSON.parse(event.body);

        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'User ID is required.' }),
            };
        }

        // Ambil semua kunci yang sesuai dengan user_id
        const { data: keys, error } = await supabase
            .from('script_keys')
            .select('*')
            .eq('user_id', userId) // <-- Filter utama berdasarkan ID pengguna
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching user keys.' }),
            };
        }

        // Filter kunci yang masih aktif dan belum kedaluwarsa
        const now = new Date();
        const activeKeys = keys.filter(key => {
            if (!key.is_active) {
                return false; // Abaikan kunci yang dinonaktifkan
            }
            if (key.duration === 0) {
                return true; // Kunci tak terbatas selalu aktif jika is_active=true
            }
            // Kunci berjangka waktu: hitung waktu kedaluwarsa
            const expiresAt = new Date(new Date(key.created_at).getTime() + key.duration * 1000);
            return expiresAt > now;
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activeKeys),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
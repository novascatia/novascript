// /netlify/functions/check-key.js
import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { key } = JSON.parse(event.body);
        if (!key) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Key is required.' }) };
        }

        // Inisialisasi koneksi ke Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Cari key di database
        const { data, error } = await supabase
            .from('keys')
            .select('expires_at, is_active')
            .eq('key_string', key)
            .single(); // Ambil satu baris saja

        if (error || !data) {
            return { statusCode: 200, body: JSON.stringify({ status: 'invalid', message: 'This key does not exist.' }) };
        }

        const now = new Date();
        const expiryDate = new Date(data.expires_at);

        if (!data.is_active || now > expiryDate) {
            return { statusCode: 200, body: JSON.stringify({ status: 'expired', message: 'This key has expired or is inactive.' }) };
        }

        // Jika key valid
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'valid',
                message: 'Your key is active.',
                expires_at: data.expires_at
            })
        };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ message: 'An internal error occurred.' }) };
    }
};
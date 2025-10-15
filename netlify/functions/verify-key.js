// /netlify/functions/verify-key.js
import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // 1. Ambil 'key' dari query parameter URL (?key=...)
    const key = event.queryStringParameters.key;

    // Jika tidak ada key yang diberikan, kirim respons INVALID
    if (!key) {
        return {
            statusCode: 400, // Bad Request
            headers: { 'Content-Type': 'text/plain' },
            body: 'INVALID|Key is required.'
        };
    }

    try {
        // 2. Inisialisasi koneksi ke Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Cari key di database
        const { data, error } = await supabase
            .from('keys')
            .select('expires_at, is_active')
            .eq('key_string', key)
            .single();

        // 4. Jika key tidak ditemukan atau ada error
        if (error || !data) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/plain' },
                body: 'INVALID|Key not found.'
            };
        }

        // 5. Periksa validitas key
        const now = new Date();
        const expiryDate = new Date(data.expires_at);

        if (!data.is_active || now > expiryDate) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/plain' },
                body: 'INVALID|Key has expired or is inactive.'
            };
        }

        // 6. Jika key valid, hitung sisa detik
        const secondsLeft = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);

        // 7. Kirim respons VALID dengan sisa detik
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: `VALID|${secondsLeft}`
        };

    } catch (e) {
        console.error('Internal server error:', e);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain' },
            body: 'ERROR|Internal server error.'
        };
    }
};
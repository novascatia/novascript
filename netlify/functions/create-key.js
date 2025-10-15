// /netlify/functions/create-key.js
import { createClient } from '@supabase/supabase-js';

// Fungsi untuk menghitung tanggal kedaluwarsa
function calculateExpiryDate(duration, unit) {
    const now = new Date();
    switch (unit) {
        case 'minutes':
            now.setMinutes(now.getMinutes() + parseInt(duration, 10));
            break;
        case 'hours':
            now.setHours(now.getHours() + parseInt(duration, 10));
            break;
        case 'days':
            now.setDate(now.getDate() + parseInt(duration, 10));
            break;
        default:
            throw new Error('Invalid time unit');
    }
    return now.toISOString();
}

exports.handler = async function(event, context) {
    // 1. Ambil data dari request
    const { key, duration, unit } = JSON.parse(event.body);

    // 2. Inisialisasi koneksi ke Supabase menggunakan environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Hitung tanggal kedaluwarsa
    const expires_at = calculateExpiryDate(duration, unit);

    // 4. Masukkan data ke tabel 'keys'
    const { data, error } = await supabase
        .from('keys')
        .insert([
            { key_string: key, expires_at: expires_at }
        ])
        .select();

    // 5. Kirim respons
    if (error) {
        console.error('Supabase error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            createdKey: data[0] 
        })
    };
};
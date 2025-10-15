// /netlify/functions/get-scripts.js
import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // 1. Inisialisasi koneksi ke Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Gunakan service key untuk membaca data
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Ambil semua data dari tabel 'scripts', diurutkan dari yang terbaru
    const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false }); // Tampilkan yang terbaru di atas

    // 3. Tangani jika ada error
    if (error) {
        console.error('Supabase error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }

    // 4. Kirim data skrip sebagai respons
    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, scripts: data })
    };
};
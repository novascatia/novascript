// /netlify/functions/post-script.js
import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // 1. Ambil data skrip dari request
    const { title, description, version } = JSON.parse(event.body);
    
    // Periksa apakah data yang dibutuhkan ada
    if (!title || !description) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ success: false, message: 'Title and description are required.' })
        };
    }

    // 2. Inisialisasi koneksi ke Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Masukkan data ke tabel 'scripts'
    const { data, error } = await supabase
        .from('scripts')
        .insert([
            { title: title, description: description, version: version }
        ])
        .select();

    // 4. Kirim respons
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
            postedScript: data[0] 
        })
    };
};
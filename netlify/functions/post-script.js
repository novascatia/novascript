import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // Ambil semua data, termasuk script_code, dari body request
    const { title, description, version, script_code } = JSON.parse(event.body);
    
    // Jadikan script_code sebagai input wajib
    if (!title || !description || !script_code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title, description, and script code are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Masukkan semua data, termasuk script_code, ke dalam tabel
    const { data, error } = await supabase
        .from('scripts')
        .insert([
            { title, description, version, script_code }
        ])
        .select();

    if (error) {
        console.error('Supabase error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ success: false, message: error.message }) 
        };
    }

    return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, postedScript: data[0] }) 
    };
};
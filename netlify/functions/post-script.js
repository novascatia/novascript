import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // [DIPERBAIKI] Tambahkan 'price' di dalam kurung kurawal ini
    const { title, description, version, price, loader_script } = JSON.parse(event.body);
    
    if (!title || !description || !loader_script) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title, description, and loader script are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // [DIPERBAIKI] Masukkan 'price' ke dalam perintah insert ke Supabase
    const { data, error } = await supabase
        .from('scripts')
        .insert([{ title, description, version, price, loader_script }])
        .select();

    if (error) {
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

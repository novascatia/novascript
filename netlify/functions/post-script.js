import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const body = JSON.parse(event.body);
    
    // Ambil semua kemungkinan data dari request
    const { title, description, version, loader_script, source_script, slug } = body;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Langsung masukkan data apa pun yang diterima. 
    // Kolom yang tidak dikirim akan otomatis menjadi null di database.
    const { data, error } = await supabase
        .from('scripts')
        .insert([{ title, description, version, loader_script, source_script, slug }])
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
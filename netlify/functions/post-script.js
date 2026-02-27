import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const { title, description, version, price, loader_script, tags } = JSON.parse(event.body);
    
    if (!title || !description || !loader_script) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title, description, and loader script are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Memasukkan data ke Supabase termasuk kolom tags dan purchase_count
    const { data, error } = await supabase
        .from('scripts')
        .insert([{ 
            title, 
            description, 
            version, 
            price, 
            loader_script, 
            tags, // Kolom tags baru
            purchase_count: 0 // Inisialisasi jumlah pembelian 0
        }])
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

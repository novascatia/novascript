import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const { slug, content } = JSON.parse(event.body);
    
    if (!slug || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Slug and content are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('posts') // Kirim ke tabel 'posts'
        .insert([{ slug, content }])
        .select();

    if (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ success: false, message: error.message }) 
        };
    }

    return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, posted: data[0] }) 
    };
};
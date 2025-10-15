import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const { title, description, version, script_code, slug } = JSON.parse(event.body);
    
    if (!title || !description || !script_code || !slug) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title, description, script code, and post name (slug) are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('scripts')
        .insert([{ title, description, version, script_code, slug }])
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
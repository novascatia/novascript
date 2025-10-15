import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const { title, description, version, loader_script, source_script } = JSON.parse(event.body);
    
    if (!title || !description || !loader_script || !source_script) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'All fields including loader and source scripts are required.' })
        };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('scripts')
        .insert([{ title, description, version, loader_script, source_script }])
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
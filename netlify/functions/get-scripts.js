import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .not('title', 'is', null) // HANYA AMBIL YANG PUNYA JUDUL
        .order('created_at', { ascending: false });

    if (error) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, scripts: data }) };
};
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const scriptId = event.queryStringParameters.script_id;
    if (!scriptId) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing script_id' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        const { data, error } = await supabase
            .from('script_comments')
            .select('*')
            .eq('script_id', String(scriptId))
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify({ success: true, comments: data }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const username = event.queryStringParameters.username;
    if (!username) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing username' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // Ambil semua script_id yang pernah di-review oleh user ini
        const { data, error } = await supabase
            .from('script_comments')
            .select('script_id')
            .eq('username', username);

        if (error) throw error;

        const reviewedIds = data.map(item => item.script_id);
        return { statusCode: 200, body: JSON.stringify({ success: true, reviewed_scripts: reviewedIds }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

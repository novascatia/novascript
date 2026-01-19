const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: body.name,
                price: body.price,
                description: body.description,
                how_to_use: body.how_to_use,
                script_content: body.script_content,
                active: true
            }]);

        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

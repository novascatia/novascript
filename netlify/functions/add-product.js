const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        
        // Mengambil kredensial dari environment variable Netlify
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: body.name,
                price: body.price,
                duration_value: body.duration,
                duration_unit: 'days',
                description: body.description,
                how_to_use: body.how_to_use,
                script_content: body.script_content,
                active: true
            }])
            .select();

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Produk berhasil ditambahkan!' })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: err.message })
        };
    }
};

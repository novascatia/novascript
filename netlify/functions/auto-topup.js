const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        const { username, amount_bgl, secret_key } = JSON.parse(event.body);
        const VALID_SECRET = process.env.TOPUP_SECRET_KEY;

        // Validasi Secret Key dari Environment Variable Netlify
        if (!VALID_SECRET || secret_key !== VALID_SECRET) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Unauthorized: Invalid Secret Key' }) };
        }

        if (!username || !amount_bgl || amount_bgl <= 0) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid data provided' }) };
        }

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

        // Ambil saldo user saat ini
        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('username', username)
            .single();

        if (fetchErr || !user) throw new Error('User tidak ditemukan di database.');

        const MAX_BALANCE = 200; // Batas maksimal saldo
        const currentBalance = parseInt(user.wallet_balance || 0);
        
        // Kalkulasi saldo baru dengan limit
        const newBalance = Math.min(currentBalance + parseInt(amount_bgl), MAX_BALANCE);

        // Update saldo di database
        const { error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('username', username);

        if (updateErr) throw updateErr;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                success: true, 
                message: 'Top-up successful', 
                new_balance: newBalance 
            }) 
        };

    } catch (err) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ success: false, message: err.message }) 
        };
    }
};

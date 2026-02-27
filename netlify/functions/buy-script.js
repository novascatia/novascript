// netlify/functions/buy-script.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Pastikan headers JSON selalu ada untuk mencegah error parsing di client
    const responseHeaders = {
        "Content-Type": "application/json"
    };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: responseHeaders, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, headers: responseHeaders, body: JSON.stringify({ success: false, message: 'Invalid JSON body' }) };
    }

    const { username, script_id, price } = body;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // 1. Ambil saldo user dengan Number casting untuk mencegah NaN
        const { data: user, error: userErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (userErr || !user) throw new Error('User not found');
        
        const currentBalance = Number(user.wallet_balance || 0);
        const itemPrice = Number(price || 0);

        if (currentBalance < itemPrice) throw new Error('Insufficient BGL Balance');

        // 2. Hitung saldo baru (Numeric Operation)
        const newBalance = currentBalance - itemPrice;

        // 3. Update database
        const { error: updateErr } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);
        if (updateErr) throw updateErr;

        // 4. Catat kepemilikan di tabel purchases
        const { error: purchaseErr } = await supabase.from('purchases').insert([{ user_username: username, script_id: String(script_id) }]);
        if (purchaseErr) throw new Error('Failed to record purchase: ' + purchaseErr.message);

        return { 
            statusCode: 200, 
            headers: responseHeaders,
            body: JSON.stringify({ success: true, new_balance: newBalance }) 
        };
    } catch (err) {
        return { 
            statusCode: 400, 
            headers: responseHeaders,
            body: JSON.stringify({ success: false, message: err.message }) 
        };
    }
};

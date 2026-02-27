// netlify/functions/buy-script.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const responseHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: responseHeaders, body: '' };
    }

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
        // 1. Ambil data user
        const { data: user, error: userErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (userErr || !user) throw new Error('User not found');
        
        const currentBalance = Number(user.wallet_balance || 0);
        const itemPrice = Number(price || 0);

        if (currentBalance < itemPrice) throw new Error('Insufficient BGL Balance');

        // 2. Cek apakah sudah punya script ini
        const { data: existingPurchase } = await supabase.from('purchases').select('id').eq('user_username', username).eq('script_id', String(script_id)).single();
        if (existingPurchase) throw new Error('You already own this script');

        // 3. Potong saldo
        const newBalance = currentBalance - itemPrice;
        const { error: updateErr } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);
        if (updateErr) throw new Error('Failed to update balance');

        // 4. Catat pembelian
        const { error: purchaseErr } = await supabase.from('purchases').insert([{ user_username: username, script_id: String(script_id) }]);
        if (purchaseErr) {
            // Rollback saldo jika gagal mencatat pembelian
            await supabase.from('users').update({ wallet_balance: currentBalance }).eq('username', username);
            throw new Error('Failed to record purchase');
        }

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

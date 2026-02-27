// netlify/functions/buy-script.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const { username, script_id, price } = JSON.parse(event.body);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // 1. Ambil data user
        const { data: user, error: userErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (userErr || !user) throw new Error('User not found');

        // Pastikan konversi ke angka aman (Default 0 jika null)
        const currentBalance = Number(user.wallet_balance || 0);
        const itemPrice = Number(price || 0);

        if (currentBalance < itemPrice) throw new Error('Insufficient BGL Balance');

        // 2. Hitung saldo baru
        const newBalance = currentBalance - itemPrice;

        // 3. Update database
        const { error: updateErr } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);
        if (updateErr) throw updateErr;

        // 4. Catat pembelian
        await supabase.from('purchases').insert([{ user_username: username, script_id: script_id }]);

        return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, new_balance: newBalance }) 
        };
    } catch (err) {
        return { 
            statusCode: 400, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: false, message: err.message }) 
        };
    }
};

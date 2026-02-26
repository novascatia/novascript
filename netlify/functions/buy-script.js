// netlify/functions/buy-script.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const { username, script_id, price } = JSON.parse(event.body);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // 1. Cek saldo user
        const { data: user, error: userErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (userErr || !user) throw new Error('User not found');
        if (parseInt(user.wallet_balance) < parseInt(price)) throw new Error('Insufficient BGL Balance');

        // 2. Potong saldo
        const newBalance = parseInt(user.wallet_balance) - parseInt(price);
        await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);

        // 3. Catat kepemilikan di tabel purchases
        const { error: purchaseErr } = await supabase.from('purchases').insert([{ user_username: username, script_id: script_id }]);
        if (purchaseErr) throw purchaseErr;

        return { statusCode: 200, body: JSON.stringify({ success: true, new_balance: newBalance }) };
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

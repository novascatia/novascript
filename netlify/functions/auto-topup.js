// netlify/functions/auto-topup.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const { username, amount_bgl, secret_key } = JSON.parse(event.body);

    // KUNCI RAHASIA: Biar orang lain ga bisa tembak API ini secara ilegal
    if (secret_key !== 'NOVA_TOPUP_SECRET_2026') {
        return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden Access' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        // Ambil saldo user saat ini
        const { data: user, error: fetchErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (fetchErr || !user) throw new Error('User not found in Web');

        // Tambah saldo
        const newBalance = parseInt(user.wallet_balance || 0) + parseInt(amount_bgl);

        // Update database
        const { error: updateErr } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);
        if (updateErr) throw updateErr;

        return { statusCode: 200, body: JSON.stringify({ success: true, new_balance: newBalance }) };
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

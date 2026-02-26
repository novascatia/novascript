const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Ambil data dari Query String (karena dari lua Growlauncher pake GET)
    const username = event.queryStringParameters.username || (event.body && JSON.parse(event.body).username);
    const amount_bgl = event.queryStringParameters.amount_bgl || (event.body && JSON.parse(event.body).amount_bgl);
    const secret_key = event.queryStringParameters.secret_key || (event.body && JSON.parse(event.body).secret_key);

    if (secret_key !== 'NOVA_TOPUP_SECRET_2026') {
        return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        const { data: user, error: fetchErr } = await supabase.from('users').select('wallet_balance').eq('username', username).single();
        if (fetchErr || !user) throw new Error('Web user not found');

        const newBalance = parseInt(user.wallet_balance || 0) + parseInt(amount_bgl);

        const { error: updateErr } = await supabase.from('users').update({ wallet_balance: newBalance }).eq('username', username);
        if (updateErr) throw updateErr;

        return { statusCode: 200, body: JSON.stringify({ success: true, new_balance: newBalance }) };
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false }) };
    }
};

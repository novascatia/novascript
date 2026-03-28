const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { username, amount_bgl, secret_key } = JSON.parse(event.body);
        const VALID_SECRET = process.env.TOPUP_SECRET_KEY;

        if (!VALID_SECRET || secret_key !== VALID_SECRET) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Unauthorized Key' }) };
        }

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('username', username)
            .single();

        if (fetchErr || !user) throw new Error('User tidak ditemukan');

        const MAX_BALANCE = 200;
        const currentBalance = parseInt(user.wallet_balance || 0);
        const newBalance = Math.min(currentBalance + parseInt(amount_bgl), MAX_BALANCE);

        const { error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('username', username);

        if (updateErr) throw updateErr;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ success: true, new_balance: newBalance }) 
        };

    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

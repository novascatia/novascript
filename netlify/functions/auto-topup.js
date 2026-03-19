const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const username = event.queryStringParameters.username;
    const secret_key = event.queryStringParameters.secret_key;

    // 1. Secret key should come from env variable, NOT hardcoded
    const VALID_SECRET = process.env.TOPUP_SECRET_KEY;
    if (!VALID_SECRET || secret_key !== VALID_SECRET) {
        return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
    }

    if (!username) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing username' }) };
    }

    // 2. Amount is FIXED server-side — never from client
    const TOPUP_AMOUNT = 10; // only you control this value

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('username', username)
            .single();

        if (fetchErr || !user) throw new Error('User not found');

        // 3. Cap the max balance so abuse is limited
        const MAX_BALANCE = 500;
        const currentBalance = parseInt(user.wallet_balance || 0);
        if (currentBalance >= MAX_BALANCE) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Balance cap reached' }) };
        }

        const newBalance = Math.min(currentBalance + TOPUP_AMOUNT, MAX_BALANCE);

        const { error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('username', username);

        if (updateErr) throw updateErr;

        return { statusCode: 200, body: JSON.stringify({ success: true, new_balance: newBalance }) };

    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

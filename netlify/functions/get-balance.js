// netlify/functions/get-balance.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const username = event.queryStringParameters.username;
    if (!username) return { statusCode: 400, body: JSON.stringify({ error: 'No username provided' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    try {
        const { data, error } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('username', username)
            .single();

        if (error || !data) throw new Error('User not found');

        return { statusCode: 200, body: JSON.stringify({ balance: data.wallet_balance }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

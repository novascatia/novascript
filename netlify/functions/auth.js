const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { action, username, password, secretPin } = JSON.parse(event.body);
    
    try {
        if (action === 'register') {
            throw new Error('Registrasi sedang dinonaktifkan untuk pemeliharaan.');
        } 
        else if (action === 'login') {
            const { data: user, error } = await supabase.from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .eq('secret_pin', secretPin)
                .single();

            if (error || !user) throw new Error('Kredensial atau PIN Verifikasi salah.');

            return { statusCode: 200, body: JSON.stringify({ success: true, user: { id: user.id, username: user.username, wallet: user.wallet_balance } }) };
        }
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

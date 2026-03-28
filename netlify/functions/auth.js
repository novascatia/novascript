const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { action, username, password, secretPin } = JSON.parse(event.body);
    
    // Mendapatkan IP Address user
    const userIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '0.0.0.0';

    try {
        if (action === 'register') {
            // 1. Cek apakah username sudah ada
            const { data: userExist } = await supabase.from('users').select('username').eq('username', username).single();
            if (userExist) throw new Error('Username sudah dipakai.');

            // 2. Batasi maksimal 2 akun per IP
            const { data: ipCount, error: countErr } = await supabase
                .from('users')
                .select('username')
                .eq('last_ip', userIp);

            if (ipCount && ipCount.length >= 2) {
                throw new Error('Limit tercapai! Maksimal 2 akun per IP.');
            }

            // 3. Simpan user baru beserta IP-nya
            const { data: newUser, error: insertError } = await supabase.from('users').insert([
                { 
                    username, 
                    password, 
                    secret_pin: secretPin, 
                    wallet_balance: 0,
                    last_ip: userIp 
                }
            ]).select().single();
            
            if (insertError) throw insertError;

            return { statusCode: 200, body: JSON.stringify({ success: true, user: { id: newUser.id, username, wallet: 0 } }) };
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

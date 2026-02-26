// netlify/functions/auth.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { action, username, password, verificationCode } = JSON.parse(event.body);

    try {
        if (action === 'register') {
            // 1. Cek kode verifikasi
            const { data: codeData } = await supabase.from('verification_codes').select('*').eq('code', verificationCode).single();
            if (!codeData || codeData.is_used) throw new Error('Kode verifikasi tidak valid atau sudah digunakan.');

            // 2. Cek apakah username sudah ada
            const { data: userExist } = await supabase.from('users').select('username').eq('username', username).single();
            if (userExist) throw new Error('Username sudah dipakai.');

            // 3. Insert user baru
            const { data: newUser, error: insertError } = await supabase.from('users').insert([
                { username, password, wallet_balance: 0 }
            ]).select().single();
            if (insertError) throw insertError;

            // 4. Update kode jadi 'used'
            await supabase.from('verification_codes').update({ is_used: true }).eq('code', verificationCode);

            return { statusCode: 200, body: JSON.stringify({ success: true, user: { id: newUser.id, username, wallet: 0 } }) };
        } 
        
        else if (action === 'login') {
            const { data: user, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
            if (error || !user) throw new Error('Username atau password salah.');

            return { statusCode: 200, body: JSON.stringify({ success: true, user: { id: user.id, username: user.username, wallet: user.wallet_balance } }) };
        }
        
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Tangkap data dari URL (GET)
    const username = event.queryStringParameters.username;
    const amount_bgl = event.queryStringParameters.amount_bgl;
    const secret_key = event.queryStringParameters.secret_key;

    console.log(`[TOPUP REQUEST] User: ${username} | Amount: ${amount_bgl} | Key: ${secret_key}`);

    // Cek Kunci Rahasia
    if (secret_key !== 'NOVA_TOPUP_SECRET_2026') {
        console.log('[ERROR] Invalid Secret Key!');
        return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
    }

    if (!username || !amount_bgl) {
        console.log('[ERROR] Username atau Amount kosong!');
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing parameters' }) };
    }

    // Sambung ke Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // PASTIKAN INI SERVICE_ROLE KEY, BUKAN ANON!
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('[ERROR] Env Variables Supabase tidak ditemukan!');
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server Config Error' }) };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log(`[DB] Mencari user: ${username}...`);
        
        // 1. Ambil saldo terakhir
        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('username', username)
            .single();

        if (fetchErr || !user) {
            console.log(`[ERROR DB] User tidak ditemukan atau error:`, fetchErr);
            throw new Error('Web user not found in database');
        }

        // 2. Tambahkan saldo
        const newBalance = parseInt(user.wallet_balance || 0) + parseInt(amount_bgl);
        console.log(`[DB] Saldo lama: ${user.wallet_balance} | Saldo baru: ${newBalance}`);

        // 3. Update database
        const { data: updateData, error: updateErr } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('username', username)
            .select(); // Tambahkan .select() untuk memastikan data terupdate

        if (updateErr) {
            console.log(`[ERROR DB] Gagal mengupdate saldo:`, updateErr);
            throw updateErr;
        }

        console.log(`[SUCCESS] Saldo berhasil diupdate untuk ${username}!`);
        return { 
            statusCode: 200, 
            body: JSON.stringify({ success: true, new_balance: newBalance }) 
        };

    } catch (err) {
        console.log(`[EXCEPTION] Terjadi kesalahan:`, err.message);
        return { statusCode: 400, body: JSON.stringify({ success: false, message: err.message }) };
    }
};

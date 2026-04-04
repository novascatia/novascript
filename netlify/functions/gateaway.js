const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Validasi method
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid request' }) };
    }

    const { action, username, password, secretPin } = body;

    try {
        // Blokir Flooding/Spam Registrasi
        if (action === 'register') {
            return { 
                statusCode: 403, 
                body: JSON.stringify({ success: false, message: 'Registration is currently disabled.' }) 
            };
        } 
        
        // Logika Login
        if (action === 'login') {
            if (!username || !password || !secretPin) {
                throw new Error('All fields are required.');
            }

            const { data: user, error } = await supabase.from('users')
                .select('id, username, wallet_balance, password, secret_pin')
                .eq('username', username)
                .single();

            // Verifikasi manual untuk keamanan tambahan agar tidak mudah di-bypass
            if (error || !user || user.password !== password || String(user.secret_pin) !== String(secretPin)) {
                throw new Error('Invalid credentials or security PIN.');
            }

            return { 
                statusCode: 200, 
                body: JSON.stringify({ 
                    success: true, 
                    user: { 
                        id: user.id, 
                        username: user.username, 
                        wallet: user.wallet_balance 
                    } 
                }) 
            };
        }

        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Unknown action' }) };

    } catch (err) {
        return { 
            statusCode: 401, 
            body: JSON.stringify({ success: false, message: err.message }) 
        };
    }
};

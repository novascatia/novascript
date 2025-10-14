// netlify/functions/verify-key.js
// Endpoint ini diakses oleh script Lua/Software Anda untuk validasi key.
const { createClient } = require('@supabase/supabase-js');

// Menggunakan Service Role Key untuk akses aman ke tabel KEYS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    // Memerlukan parameter KEY di query string
    const key = event.queryStringParameters.key;
    if (!key) {
        return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
    }

    try {
        const { data, error } = await supabase
            .from('script_keys')
            .select('id, created_at, duration, is_active')
            .eq('key_value', key)
            .single();

        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID|KEY_NOT_FOUND' };
        }

        // Cek status aktif
        if (!data.is_active) {
            return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID|INACTIVE' };
        }

        // Key Unlimited (Duration = 0)
        if (data.duration === 0) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/plain' },
                body: 'VALID|UNLIMITED',
            };
        }

        // Key Berbatas Waktu: Hitung sisa detik
        const expiresAt = new Date(new Date(data.created_at).getTime() + data.duration * 1000);
        const now = new Date();
        const seconds_left = Math.floor((expiresAt - now) / 1000);

        if (seconds_left <= 0) {
            // Key expired, hapus atau nonaktifkan (opsional)
            // await supabase.from('script_keys').update({ is_active: false }).eq('id', data.id); 
            return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID|EXPIRED' };
        }

        // Kirim kembali sisa detik
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: `VALID|${seconds_left}`,
        };

    } catch (err) {
        console.error("Verification error:", err);
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID|SERVER_ERROR' };
    }
};

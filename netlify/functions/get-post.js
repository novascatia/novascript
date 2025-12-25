import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // --- FITUR BARU: BLOCK BROWSER ACCESS ---
    // Mengambil header User-Agent (browser/client identifier)
    const userAgent = event.headers['user-agent'] || '';

    // Logika Deteksi:
    // Browser modern (Chrome, Firefox, Safari, Edge) selalu menggunakan "Mozilla/5.0".
    // PowerShell (Net.WebClient) biasanya User-Agent-nya kosong atau berbeda.
    // Kita blokir jika terdeteksi sebagai browser modern.
    const isBrowser = /Mozilla\/5\.0/i.test(userAgent) && /(Chrome|Safari|Firefox|Edge|Opera)/i.test(userAgent);

    if (isBrowser) {
        return {
            statusCode: 403, // 403 Forbidden
            headers: { 'Content-Type': 'text/plain' },
            body: 'Access Denied. This script can only be loaded via Lua/PowerShell execution.'
        };
    }
    // -----------------------------------------

    // CARA BARU YANG LEBIH ANDAL UNTUK MENDAPATKAN NAMA POST
    // event.path akan berisi sesuatu seperti "/encrypt/bgl-changer"
    const path = event.path;
    const slug = path.split('/').pop(); // Mengambil bagian terakhir dari URL

    if (!slug || slug.trim() === '') {
        return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Post name is required.' };
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('posts')
            .select('content')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Post not found.' };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: data.content
        };
    } catch (e) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal server error.' };
    }
};

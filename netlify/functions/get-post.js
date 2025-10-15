import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
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
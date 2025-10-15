import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const slug = event.queryStringParameters.slug;

    if (!slug) {
        return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Post name is required.' };
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('posts') // DIUBAH KE TABEL 'posts'
            .select('content') // DIUBAH KE KOLOM 'content'
            .eq('slug', slug)
            .single();

        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Post not found.' };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: data.content // DIUBAH KE KOLOM 'content'
        };
    } catch (e) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal server error.' };
    }
};
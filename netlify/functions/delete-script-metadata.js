// netlify/functions/delete-script-metadata.js
// Menghapus metadata script dari tabel 'scripts'.
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { scriptId } = JSON.parse(event.body);
        
        if (!scriptId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Script ID is required.' }) };
        }

        // Hapus metadata dari tabel scripts
        const { error } = await supabase
            .from('scripts')
            .delete()
            .eq('id', scriptId);

        if (error) {
            console.error('Supabase Delete Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to delete script metadata: ' + error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Script metadata deleted successfully.' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

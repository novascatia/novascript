// netlify/functions/delete-key.js
// Menghapus key dari tabel 'script_keys'.
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { keyId } = JSON.parse(event.body);
        
        if (!keyId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Key ID is required.' }) };
        }

        // Hapus key dari tabel script_keys
        const { error } = await supabase
            .from('script_keys')
            .delete()
            .eq('id', keyId);

        if (error) {
            console.error('Supabase Delete Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to delete key: ' + error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Access key deleted successfully.' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
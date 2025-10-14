// netlify/functions/create-script-metadata.js
// Mencatat metadata script baru ke tabel 'scripts' setelah file diunggah ke Supabase Storage.
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { title, description, download_path } = JSON.parse(event.body);
        
        if (!title || !download_path) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Title and download_path are required.' }) };
        }

        const uniqueId = uuidv4(); // Menggunakan UUID untuk ID script
        
        const { data, error } = await supabase
            .from('scripts')
            .insert({ 
                id: uniqueId, 
                title: title, 
                description: description,
                download_path: download_path, // Path di Supabase Storage
                version: '1.0', // Default version
                is_active: true
            })
            .select('id')
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to insert script metadata: ' + error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Script metadata created successfully.', scriptId: data.id }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

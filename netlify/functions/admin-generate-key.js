// netlify/functions/admin-generate-key.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// HARUS menggunakan Service Role Key untuk operasi INSERT ke tabel KEYS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // PERUBAHAN: Menerima custom_key
        const { duration, user_id, custom_key } = JSON.parse(event.body); 

        if (typeof duration !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number.' }),
            };
        }

        // PERUBAHAN: Tentukan nilai kunci
        const keyToInsert = custom_key
            ? custom_key.toUpperCase() // Gunakan custom key jika ada
            : `ADM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`; // Default
        
        const { error } = await supabase
            .from('script_keys')
            .insert({ 
                key_value: keyToInsert, 
                duration: duration,
                note: user_id ? `Admin generated for User: ${user_id}` : 'Admin manual key',
                is_active: true,
                user_id: user_id || null // Boleh NULL jika tidak ada user ID
            });

        if (error) {
            if (error.code === '23505') {
                 return {
                    statusCode: 409,
                    body: JSON.stringify({ error: `Key generation failed: Key value '${keyToInsert}' already exists (Conflict).` }),
                };
            }
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Key generated successfully.', key: keyToInsert }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
// netlify/functions/admin-generate-key.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { duration, note, customKey, user_id } = JSON.parse(event.body); // Ditambahkan user_id

        if (typeof duration !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number.' }),
            };
        }

        let keyToInsert = customKey;
        if (!keyToInsert || keyToInsert.trim() === '') {
            keyToInsert = `Nova-${crypto.randomBytes(8).toString('hex')}`;
        }
        
        // Prepare the object to insert
        const insertObject = { 
            key_value: keyToInsert, 
            duration: duration,
            note: note,
            is_active: true
        };
        
        // Add user_id if provided and not empty
        if (user_id && user_id.trim() !== '') {
            insertObject.user_id = user_id.trim();
        }

        const { error } = await supabase
            .from('script_keys')
            .insert(insertObject);

        if (error) {
            if (error.code === '23505') {
                 return {
                    statusCode: 409,
                    body: JSON.stringify({ error: `Key "${keyToInsert}" already exists.` }),
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
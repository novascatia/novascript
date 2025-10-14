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
        const { duration, user_email, custom_key } = JSON.parse(event.body); // Updated to accept user_email and custom_key

        if (typeof duration !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number.' }),
            };
        }
        
        let userId = null;
        let note = 'Admin manual key';

        // 1. Resolve User ID from Email (if provided)
        if (user_email) {
             // ASUMSI: Service Role Key dapat mengkueri tabel 'users' (auth.users)
             const { data: userAuthData, error: userError } = await supabase
                .from('users') 
                .select('id')
                .eq('email', user_email)
                .maybeSingle(); 

            if (userError) {
                console.error("User lookup error:", userError);
                return { statusCode: 500, body: JSON.stringify({ error: 'Database error during user lookup.' }) };
            }
            
            if (userAuthData) {
                userId = userAuthData.id;
                note = `Admin generated for User: ${user_email}`;
            } else {
                return { statusCode: 404, body: JSON.stringify({ error: `User with email '${user_email}' not found.` }) };
            }
        }

        // 2. Determine Key Value
        const keyToInsert = custom_key 
            ? custom_key.toUpperCase() // Use custom key if provided and convert to uppercase for consistency
            : `ADM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`; // Fallback to random key
        
        // 3. Insert Key
        const { error } = await supabase
            .from('script_keys')
            .insert({ 
                key_value: keyToInsert, 
                duration: duration,
                note: note,
                is_active: true,
                user_id: userId 
            });

        if (error) {
            if (error.code === '23505') { 
                 return {
                    statusCode: 409,
                    body: JSON.stringify({ error: `Key generation failed: Key value '${keyToInsert}' already exists (Constraint Conflict).` }),
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
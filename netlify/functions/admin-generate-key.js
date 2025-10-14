// netlify/functions/admin-generate-key.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Wajib menggunakan Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // PERUBAHAN: Menambahkan userEmail
        const { duration, note, customKey, userEmail } = JSON.parse(event.body);

        if (typeof duration !== 'number' || !userEmail) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number and User Email is required.' }),
            };
        }

        // 1. Cari User ID berdasarkan Email menggunakan Supabase Admin Client
        // Note: listUsers() mengembalikan semua user. Kita harus memfilternya secara manual
        const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();

        const targetUser = usersData.users.find(user => user.email === userEmail);
        
        if (userError || !targetUser) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `User with email "${userEmail}" not found in Supabase Auth.` }),
            };
        }

        let keyToInsert = customKey;
        if (!keyToInsert || keyToInsert.trim() === '') {
            keyToInsert = `Nova-${crypto.randomBytes(8).toString('hex')}`;
        }

        // 2. Simpan kunci dengan menyertakan user_id
        const { error: insertError } = await supabase
            .from('script_keys')
            .insert({ 
                key_value: keyToInsert, 
                duration: duration,
                note: note,
                is_active: true,
                user_id: targetUser.id // <-- PERUBAHAN UTAMA: Kaitkan kunci dengan User ID
            });

        if (insertError) {
            if (insertError.code === '23505') {
                 return {
                    statusCode: 409,
                    body: JSON.stringify({ error: `Key "${keyToInsert}" already exists.` }),
                };
            }
            throw insertError;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Key generated successfully.', key: keyToInsert, user_id: targetUser.id }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
// netlify/functions/download-script.js
// Memverifikasi key dan menghasilkan URL signed sementara untuk pengunduhan file.
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Logika ini harus sama persis dengan verify-key.js, tetapi kita lakukan di sini untuk efisiensi
async function checkKeyValidity(key) {
    const { data, error } = await supabase
        .from('script_keys')
        .select('created_at, duration, is_active')
        .eq('key_value', key)
        .single();

    if (error || !data || !data.is_active) {
        return false;
    }

    if (data.duration === 0) {
        return true; // Unlimited key
    }

    // Check expiration
    const expiresAt = new Date(new Date(data.created_at).getTime() + data.duration * 1000);
    return new Date() < expiresAt;
}


exports.handler = async (event) => {
    const { id: scriptId, key: userKey } = event.queryStringParameters;

    if (!scriptId || !userKey) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'text/plain' }, 
            body: 'ERROR: Missing script ID or key.' 
        };
    }

    try {
        // 1. VERIFIKASI KEY PENGGUNA
        const isValid = await checkKeyValidity(userKey);
        if (!isValid) {
            return { 
                statusCode: 403, 
                headers: { 'Content-Type': 'text/plain' }, 
                body: 'ERROR: INVALID_KEY_OR_EXPIRED' 
            };
        }

        // 2. AMBIL PATH FILE DARI METADATA SCRIPT
        const { data: script, error: scriptError } = await supabase
            .from('scripts')
            .select('download_path, title')
            .eq('id', scriptId)
            .single();

        if (scriptError || !script) {
            return { 
                statusCode: 404, 
                headers: { 'Content-Type': 'text/plain' }, 
                body: 'ERROR: SCRIPT_NOT_FOUND' 
            };
        }

        // 3. GENERATE URL SIGNED SEMENTARA (Pre-signed URL)
        // Asumsi bucket Supabase Storage Anda bernama 'scripts'
        const { data: urlData, error: storageError } = await supabase.storage
            .from('scripts')
            .createSignedUrl(script.download_path, 60); // URL berlaku selama 60 detik

        if (storageError || !urlData) {
            console.error('Storage Error:', storageError);
            return { 
                statusCode: 500, 
                headers: { 'Content-Type': 'text/plain' }, 
                body: 'ERROR: FILE_ACCESS_FAILED' 
            };
        }

        // 4. REDIRECT KE URL SIGNED
        return {
            statusCode: 302, // Redirect sementara
            headers: {
                'Location': urlData.signedUrl,
                'Cache-Control': 'no-store' // Jangan cache redirect ini
            },
            body: 'Redirecting to file download...',
        };

    } catch (error) {
        console.error('Download handler error:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'text/plain' }, 
            body: 'ERROR: SERVER_PROCESSING_ISSUE' 
        };
    }
};

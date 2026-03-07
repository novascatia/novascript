import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // 1. DETEKSI BROWSER
    const userAgent = event.headers['user-agent'] || '';
    const isBrowser = /Mozilla\/5\.0/i.test(userAgent) && /(Chrome|Safari|Firefox|Edge|Opera)/i.test(userAgent);

    const path = event.path;
    const slug = path.split('/').pop();

    if (!slug || slug.trim() === '') {
        return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Post name is required.' };
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Ambil data dari database
        const { data, error } = await supabase
            .from('posts')
            .select('content')
            .eq('slug', slug)
            .single();

        // ==========================================
        // KONDISI A: SCRIPT TIDAK DITEMUKAN (404)
        // ==========================================
        if (error || !data) {
            if (isBrowser) {
                // Tampilan HTML 404 Khusus Browser
                const html404 = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>404 - Script Not Found | NovaScript</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #ededed; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                        .badge { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #f43f5e; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); padding: 5px 15px; border-radius: 20px; margin-bottom: 20px; }
                        h1 { font-size: 3rem; margin: 0 0 10px 0; color: #fff; }
                        p { color: #888; max-width: 400px; line-height: 1.5; margin-bottom: 30px; }
                        .btn { background: #18181b; border: 1px solid #27272a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; transition: 0.2s; }
                        .btn:hover { border-color: #3b82f6; color: #3b82f6; }
                    </style>
                </head>
                <body>
                    <div class="badge">Error 404</div>
                    <h1>Script Not Found</h1>
                    <p>Source script <strong>"${slug}"</strong> tidak ada. Mungkin sudah dihapus.</p>
                    <a href="/" class="btn">Return to Dashboard</a>
                </body>
                </html>`;
                
                return { statusCode: 404, headers: { 'Content-Type': 'text/html' }, body: html404 };
            } else {
                // Return respon untuk Executor Lua (Tidak akan bikin executor crash, tapi memunculkan pesan merah/print)
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'text/plain' },
                    body: `-- NovaScript 404 Error\nwarn("[NovaScript] Error 404: Script '${slug}' not found or has been removed!")\nprint("Please check your loader URL.")`
                };
            }
        }

        // ==========================================
        // KONDISI B: SCRIPT DITEMUKAN (200 OK)
        // ==========================================
        if (isBrowser) {
            // Tampilan Access Restricted jika dibuka di browser
            const htmlRestricted = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Access Restricted - NovaScript</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
                <style>
                    :root { --bg-body: #050505; --bg-card: rgba(255, 255, 255, 0.03); --border-subtle: rgba(255, 255, 255, 0.08); --text-main: #ededed; --text-muted: #888888; }
                    body { font-family: 'Inter', sans-serif; background-color: var(--bg-body); color: var(--text-main); margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
                    .container { text-align: center; z-index: 20; padding: 20px; max-width: 500px; }
                    .status-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #f87171; background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); padding: 4px 12px; border-radius: 20px; display: inline-flex; margin-bottom: 20px; }
                    h1 { font-size: 3rem; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.04em; background: linear-gradient(180deg, #fff 0%, #888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    p { color: var(--text-muted); line-height: 1.6; margin-bottom: 30px; }
                    .message-box { background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 30px; border-radius: 16px; backdrop-filter: blur(10px); }
                    .lua-tag { font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 6px; color: #fff; font-size: 0.9em; }
                    .footer { margin-top: 50px; font-size: 0.8rem; color: #444; }
                    .footer a { color: #666; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="status-badge">● Access Restricted</div>
                    <h1>NovaScript</h1>
                    <div class="message-box">
                        <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
                        <h2 style="margin: 0 0 10px 0; font-size: 1.2rem; color: #fff;">Content Protected</h2>
                        <p>This script source is encrypted and cannot be viewed.<br><br>Execute this script via :<br><br><span class="lua-tag">Lua Environment</span></p>
                    </div>
                    <div class="footer">© 2026 nov4 | <a href="https://novascript.site">Dashboard</a></div>
                </div>
            </body>
            </html>`;

            return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: htmlRestricted };
        } else {
            // Jika dipanggil via Executor, kembalikan RAW Script Lua
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: data.content
            };
        }
    } catch (e) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal server error.' };
    }
};

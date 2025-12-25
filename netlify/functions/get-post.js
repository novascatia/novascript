import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    // ------------------------------------------------------------------
    // 1. DETEKSI BROWSER
    // ------------------------------------------------------------------
    const userAgent = event.headers['user-agent'] || '';
    
    // Regex untuk mendeteksi browser umum (Chrome, Firefox, Safari, Edge, Opera)
    // Jika User-Agent mengandung "Mozilla/5.0", kemungkinan besar itu browser.
    // Eksekutor Lua (seperti game:HttpGet) biasanya memiliki User-Agent berbeda atau kosong.
    const isBrowser = /Mozilla\/5\.0/i.test(userAgent) && /(Chrome|Safari|Firefox|Edge|Opera)/i.test(userAgent);

    if (isBrowser) {
        // --- TAMPILAN KHUSUS (HTML) JIKA DIBUKA DI BROWSER ---
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Restricted - NovaScript</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-body: #050505;
            --bg-card: rgba(255, 255, 255, 0.03);
            --border-subtle: rgba(255, 255, 255, 0.08);
            --text-main: #ededed;
            --text-muted: #888888;
        }
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--bg-body); 
            color: var(--text-main); 
            margin: 0; padding: 0;
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            overflow: hidden;
        }
        .noise-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
            pointer-events: none; z-index: 10;
        }
        .spotlight {
            position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
            width: 100%; max-width: 1000px; height: 600px;
            background: radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%);
            pointer-events: none; z-index: -1;
        }
        .container { 
            text-align: center; z-index: 20; padding: 20px; max-width: 500px;
        }
        .status-badge {
            font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
            color: #f87171; background: rgba(248, 113, 113, 0.1);
            border: 1px solid rgba(248, 113, 113, 0.2);
            padding: 4px 12px; border-radius: 20px;
            display: inline-flex; margin-bottom: 20px;
        }
        h1 { 
            font-size: 3rem; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.04em;
            background: linear-gradient(180deg, #fff 0%, #888 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        p { color: var(--text-muted); line-height: 1.6; margin-bottom: 30px; }
        .message-box {
            background: var(--bg-card); border: 1px solid var(--border-subtle);
            padding: 30px; border-radius: 16px; backdrop-filter: blur(10px);
        }
        .lua-tag {
            font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.1);
            padding: 5px 10px; border-radius: 6px; color: #fff; font-size: 0.9em;
        }
        .footer {
            margin-top: 50px; font-size: 0.8rem; color: #444;
        }
        .footer a { color: #666; text-decoration: none; }
    </style>
</head>
<body>
    <div class="noise-overlay"></div>
    <div class="spotlight"></div>

    <div class="container">
        <div class="status-badge">● Access Restricted</div>
        <h1>NovaScript</h1>
        
        <div class="message-box">
            <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
            <h2 style="margin: 0 0 10px 0; font-size: 1.2rem; color: #fff;">Content Protected</h2>
            <p>
                This script source is encrypted and cannot be viewed.
                <br><br>
                Execute this script via :
                <span class="lua-tag">Lua Environment</span>
            </p>
        </div>

        <div class="footer">
            © 2025 nov4 | <a href="https://discord.gg/B6F7hMVRxp">Join Discord Server</a>
        </div>
    </div>
</body>
</html>`;

        // Mengembalikan status 200 (bukan 403) agar halaman HTML ter-render sempurna di browser
        return {
            statusCode: 200, 
            headers: { 'Content-Type': 'text/html' },
            body: htmlContent
        };
    }

    // ------------------------------------------------------------------
    // 2. LOGIKA ORIGINAL (UNTUK LUA/SCRIPT)
    // ------------------------------------------------------------------
    // Jika bukan browser (misal: Lua script), jalankan logika normal
    
    // event.path akan berisi sesuatu seperti "/encrypt/bgl-changer"
    const path = event.path;
    const slug = path.split('/').pop(); // Mengambil bagian terakhir dari URL

    if (!slug || slug.trim() === '') {
        return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Post name is required.' };
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('posts')
            .select('content')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Post not found.' };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: data.content
        };
    } catch (e) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal server error.' };
    }
};

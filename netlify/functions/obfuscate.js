// netlify/functions/obfuscate.js
const { LuaFactory } = require('wasmoon');
const fs = require('fs');
const path = require('path');

// Fungsi untuk membaca semua file source code Prometheus
// Ini akan membaca semua file .lua dari direktori 'src'
function loadPrometheusSources() {
    const sources = {};
    const srcDir = path.resolve(__dirname, '../../src'); // Menunjuk ke folder 'src' di root

    function readDirRecursive(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                readDirRecursive(fullPath);
            } else if (file.endsWith('.lua')) {
                // Membuat path relatif seperti yang diharapkan oleh 'require' di Lua
                const relativePath = path.relative(srcDir, fullPath)
                    .replace(/\\/g, '/') // Ganti backslash (Windows) dengan slash
                    .replace(/\.lua$/, ''); // Hapus ekstensi .lua
                sources[relativePath] = fs.readFileSync(fullPath, 'utf-8');
            }
        }
    }

    readDirRecursive(srcDir);
    return sources;
}

// Handler utama Netlify Function
exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { script } = JSON.parse(event.body);

        if (!script || !script.trim()) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Script content is required.' }) };
        }

        // 1. Buat instance Pabrik Lua
        const factory = new LuaFactory();
        const lua = await factory.createEngine();

        // 2. Muat semua file source code Prometheus ke dalam memori
        const prometheusFiles = loadPrometheusSources();

        // 3. Modifikasi fungsi 'require' di dalam VM Lua
        // agar ia memuat file dari memori, bukan dari sistem file
        lua.global.set('prometheus_sources', prometheusFiles);
        lua.global.lua.eval(`
            local sources = prometheus_sources
            local original_require = require
            
            package.preload['prometheus.bit'] = function()
                local code = sources['prometheus/bit']
                local func, err = load(code, 'prometheus/bit', 't')
                if not func then error(err) end
                return func()
            end

            require = function(mod)
                local modPath = string.gsub(mod, '%.', '/')
                if sources[modPath] then
                    local code = sources[modPath]
                    local func, err = load(code, mod, 't')
                    if not func then
                        return "error loading " .. mod .. ": " .. tostring(err)
                    end
                    return func()
                end
                return original_require(mod)
            end
        `);
        
        // 4. Set variabel global di dalam Lua VM
        lua.global.set('userInputScript', script);

        // 5. Jalankan proses obfuscate di dalam Lua VM
        const obfuscatedScript = await lua.global.lua.eval(`
            -- Memuat entry point Prometheus
            local Prometheus = require("prometheus")

            -- Sembunyikan log agar tidak mengotori output
            Prometheus.Logger.logLevel = Prometheus.Logger.LogLevel.Error

            -- Konfigurasi pipeline "Strong" seperti di file presets.lua
            local strongConfig = {
                LuaVersion = "Lua51",
                NameGenerator = "MangledShuffled",
                PrettyPrint = false,
                Seed = 0,
                Steps = {
                    { Name = "Vmify" },
                    { Name = "EncryptStrings" },
                    { Name = "AntiTamper" },
                    { Name = "Vmify" },
                    {
                        Name = "ConstantArray",
                        Settings = {
                            Treshold = 1, StringsOnly = true, Shuffle = true,
                            Rotate = true, LocalWrapperTreshold = 0
                        }
                    },
                    { Name = "NumbersToExpressions" },
                    { Name = "WrapInFunction" }
                }
            }

            -- Buat pipeline dari config
            local pipeline = Prometheus.Pipeline:fromConfig(strongConfig)

            -- Jalankan obfuscator pada script input dan kembalikan hasilnya
            return pipeline:apply(userInputScript)
        `);

        // 6. Kirim hasilnya kembali ke client
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ obfuscatedScript: obfuscatedScript })
        };

    } catch (error) {
        console.error("Obfuscation Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Gagal meng-obfuscate script. Error: ' + error.message })
        };
    } finally {
        // Pastikan VM Lua ditutup untuk membebaskan memori
        if (lua) {
            lua.global.close();
        }
    }
};
// netlify/functions/obfuscate.js

// Fungsi utilitas untuk menghasilkan nama acak
function generateRandomName(length = 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    // Pastikan nama tidak diawali dengan angka
    result += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 1; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// Fungsi enkripsi XOR sederhana
function xorEncrypt(text, key) {
    let encrypted = [];
    for (let i = 0; i < text.length; i++) {
        encrypted.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return encrypted;
}

// Fungsi utama untuk obfuscate script
function obfuscateStrong(script) {
    // 1. Ekstrak semua string dari script menggunakan Regex
    const stringLiterals = new Set();
    // Regex untuk menangkap string single quote, double quote, dan long bracket
    const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1|\[(=*)\[([\s\S]*?)\]\3\]/g;
    script.replace(stringRegex, (match) => {
        stringLiterals.add(match);
        return match;
    });

    if (stringLiterals.size === 0) {
        // Jika tidak ada string, lakukan minifikasi sederhana sebagai fallback
        return script.replace(/\s+/g, ' ');
    }

    // 2. Buat nama-nama acak untuk variabel dan fungsi internal
    const stringTableName = generateRandomName();
    const decryptFnName = generateRandomName();
    const keyVarName = generateRandomName();
    const mainFuncVar = generateRandomName();

    // 3. Buat kunci enkripsi acak
    const encryptionKey = generateRandomName(20);

    // 4. Enkripsi semua string dan siapkan tabel string
    const encryptedStrings = [];
    const stringMap = new Map();
    let stringIndex = 1;

    stringLiterals.forEach(str => {
        const encrypted = xorEncrypt(str, encryptionKey);
        encryptedStrings.push(`{${encrypted.join(',')}}`);
        stringMap.set(str, stringIndex);
        stringIndex++;
    });

    // 5. Ganti string di script asli dengan panggilan ke fungsi dekripsi
    let modifiedScript = script.replace(stringRegex, (match) => {
        const index = stringMap.get(match);
        return `${decryptFnName}(${index})`;
    });

    // 6. Buat loader (bagian dekripsi dan eksekusi)
    const loader = `
local ${stringTableName} = {
    ${encryptedStrings.join(',\n    ')}
};
local ${keyVarName} = "${encryptionKey}";
local ${decryptFnName} = function(index)
    local encrypted = ${stringTableName}[index];
    local key = ${keyVarName};
    local decrypted = "";
    for i = 1, #encrypted do
        decrypted = decrypted .. string.char(bit32.bxor(encrypted[i], string.byte(key, (i - 1) % #key + 1)));
    end
    return decrypted;
end;

local ${mainFuncVar} = load(${decryptFnName}(${stringMap.get(`"${modifiedScript}"`)}));
if ${mainFuncVar} then
    return ${mainFuncVar}();
end
    `;
    
    // Enkripsi script utama itu sendiri dan bungkus di dalam loader
    const finalEncryptedScript = xorEncrypt(`return function()\n${modifiedScript}\nend`, encryptionKey);
    encryptedStrings.push(`{${finalEncryptedScript.join(',')}}`);

    // Hapus preset 'Strong' agar tidak bisa dipilih
    const finalLoader = `
local ${stringTableName} = {
    ${encryptedStrings.join(',\n    ')}
};
local ${keyVarName} = "${encryptionKey}";
local ${decryptFnName} = function(index)
    local encrypted = ${stringTableName}[index];
    local key = ${keyVarName};
    local decrypted = "";
    for i = 1, #encrypted do
        decrypted = decrypted .. string.char(bit32.bxor(encrypted[i], string.byte(key, (i - 1) % #key + 1)));
    end
    return decrypted;
end;

local mainFunc = load(${decryptFnName}(${stringMap.size + 1}));
if mainFunc then
    return mainFunc();
end
`;
    return finalLoader;
}


exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { script } = JSON.parse(event.body);

        if (!script) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Script content is required.' })
            };
        }
        
        // Preset sekarang di-hardcode ke 'Strong'
        const obfuscatedScript = obfuscateStrong(script);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ obfuscatedScript: obfuscatedScript })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error during obfuscation: ' + error.message })
        };
    }
};
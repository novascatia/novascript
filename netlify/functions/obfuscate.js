// netlify/functions/obfuscate.js
const luaparse = require('luaparse');

// --- Bagian Inti: Compiler & Lua VM Generator ---

// Definisi OpCode untuk VM kita
const Opcodes = {
    LOAD_CONST: 1,  // Memuat konstanta (string, angka)
    GET_GLOBAL: 2,  // Mendapatkan variabel global (print, AddCallback)
    CALL: 3,        // Memanggil fungsi
    SET_VAR: 4,     // Mengatur variabel lokal
    GET_VAR: 5,     // Mendapatkan variabel lokal
    NEW_TABLE: 6,   // Membuat tabel baru
    SET_TABLE: 7,   // Mengatur field tabel
    RETURN: 8       // Kembali dari fungsi
};

// Fungsi untuk mengubah AST (dari luaparse) menjadi bytecode kustom kita
function compileChunk(chunk) {
    const constants = [];
    const bytecode = [];
    const locals = new Map();

    function addConstant(value) {
        const index = constants.findIndex(c => c.type === value.type && c.value === value.value);
        if (index !== -1) return index;
        constants.push(value);
        return constants.length - 1;
    }

    function visitNode(node) {
        switch (node.type) {
            case 'CallStatement':
                visitNode(node.expression);
                break;
            
            case 'CallExpression':
                // Argumen dievaluasi terlebih dahulu
                node.arguments.forEach(visitNode);
                // Kemudian fungsi dasarnya
                visitNode(node.base);
                bytecode.push(Opcodes.CALL, node.arguments.length);
                break;

            case 'FunctionDeclaration': // Disederhanakan untuk contoh ini
                // Tidak didukung dalam versi sederhana ini, kita asumsikan fungsi anonim
                visitNode(node.body);
                break;

            case 'ReturnStatement':
                node.arguments.forEach(visitNode);
                bytecode.push(Opcodes.RETURN, node.arguments.length);
                break;

            case 'Block':
                node.body.forEach(visitNode);
                break;
                
            case 'Identifier':
                if (locals.has(node.name)) {
                    bytecode.push(Opcodes.GET_VAR, locals.get(node.name));
                } else {
                    const constIndex = addConstant({ type: 'string', value: node.name });
                    bytecode.push(Opcodes.GET_GLOBAL, constIndex);
                }
                break;

            case 'StringLiteral':
            case 'NumericLiteral':
            case 'BooleanLiteral':
            case 'NilLiteral':
                const constIndex = addConstant({ type: node.type.replace('Literal', '').toLowerCase(), value: node.value });
                bytecode.push(Opcodes.LOAD_CONST, constIndex);
                break;
            
            // Tambahkan lebih banyak handler AST sesuai kebutuhan (misal: IfStatement, ForStatement, dll.)
            // Untuk sekarang, kita buat sederhana.
            default:
                // Abaikan node yang tidak kita kenali untuk saat ini
        }
    }

    chunk.body.forEach(visitNode);
    
    // Konversi konstanta ke format tabel Lua
    const luaConstants = constants.map(c => {
        if (c.type === 'string') return `"${c.value.toString().replace(/"/g, '\\"')}"`;
        return c.value;
    });

    return {
        bytecode: `{${bytecode.join(',')}}`,
        constants: `{${luaConstants.join(',')}}`
    };
}


// Template untuk VM Lua yang akan menjalankan bytecode kita
function getLuaVM() {
    // Nama variabel di dalam VM ini sengaja dibuat acak dan pendek
    const vmVars = {
        bytecode: "b", constants: "k", stack: "s", pc: "p", env: "e",
        op: "o", a: "a", b: "b", i: "i", f: "f", args: "g"
    };

    return `
local ${vmVars.bytecode}, ${vmVars.constants} = ...;
local ${vmVars.stack} = {};
local ${vmVars.pc} = 1;
local ${vmVars.env} = getfenv();

-- Opcodes (harus cocok dengan yang di backend JS)
local OP_LOAD_CONST, OP_GET_GLOBAL, OP_CALL = 1, 2, 3;

while ${vmVars.pc} <= #${vmVars.bytecode} do
    local ${vmVars.op} = ${vmVars.bytecode}[${vmVars.pc}];

    if ${vmVars.op} == OP_LOAD_CONST then
        ${vmVars.pc} = ${vmVars.pc} + 1;
        local const_idx = ${vmVars.bytecode}[${vmVars.pc}];
        table.insert(${vmVars.stack}, ${vmVars.constants}[const_idx + 1]);

    elseif ${vmVars.op} == OP_GET_GLOBAL then
        ${vmVars.pc} = ${vmVars.pc} + 1;
        local name_idx = ${vmVars.bytecode}[${vmVars.pc}];
        table.insert(${vmVars.stack}, ${vmVars.env}[${vmVars.constants}[name_idx + 1]]);

    elseif ${vmVars.op} == OP_CALL then
        ${vmVars.pc} = ${vmVars.pc} + 1;
        local num_args = ${vmVars.bytecode}[${vmVars.pc}];
        local ${vmVars.args} = {};
        for ${vmVars.i} = 1, num_args do
            ${vmVars.args}[${vmVars.i}] = table.remove(${vmVars.stack});
        end
        local ${vmVars.f} = table.remove(${vmVars.stack});
        local results = {${vmVars.f}(unpack(${vmVars.args}))};
        for ${vmVars.i} = 1, #results do
            table.insert(${vmVars.stack}, results[${vmVars.i}]);
        end
    end

    ${vmVars.pc} = ${vmVars.pc} + 1;
end
`;
}


// --- Handler Utama Netlify Function ---
exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { script } = JSON.parse(event.body);

        if (!script || !script.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Script content is required.' })
            };
        }
        
        // 1. Parse script Lua menjadi AST
        // Kita bungkus dengan pcall karena luaparse akan error jika ada sintaks yang salah
        const ast = luaparse.parse(script, { wait: false, comments: false });

        // 2. Compile AST menjadi bytecode kustom
        // CATATAN: Compiler ini sangat sederhana dan hanya mendukung beberapa operasi dasar.
        // Tidak semua script akan berhasil. Ini adalah bukti konsep.
        const { bytecode, constants } = compileChunk(ast);
        
        // 3. Dapatkan template VM Lua
        const luaVm = getLuaVM();

        // 4. Gabungkan semuanya menjadi satu script Lua yang bisa dieksekusi
        const finalScript = `
loadstring([[${luaVm}]])(${bytecode}, ${constants})
`;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ obfuscatedScript: finalScript.trim() })
        };

    } catch (error) {
        console.error("Obfuscation Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Gagal meng-obfuscate script. Pastikan sintaks Lua Anda sederhana dan benar. Error: ' + error.message })
        };
    }
};
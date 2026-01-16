// netlify/functions/save-dat.js
const logs = []; // Penyimpanan sementara (RAM). Untuk permanen, hubungkan ke DB Anda.

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body);
      const entry = {
        ...data,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      };
      logs.push(entry);
      return { statusCode: 200, body: JSON.stringify({ message: "Success" }) };
    } catch (err) {
      return { statusCode: 400, body: "Invalid JSON" };
    }
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(logs)
    };
  }
};

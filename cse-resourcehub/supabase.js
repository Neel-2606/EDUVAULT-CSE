// supabase.js
// Supabase client initialization (resilient with Node.js 20 WebSocket compatibility)

const path = require('path');
const config = require('./config');

let clientInstance = null;

// Node.js 20 does not enable native WebSocket by default.
// Supabase's RealtimeClient requires a transport; we provide 'ws' if available,
// or a safe dummy transport since this app uses HTTP REST (PostgREST) rather than WebSockets.
let wsTransport = null;
try {
  wsTransport = require('ws');
} catch (e) {
  wsTransport = class SafeWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

function getClient() {
  if (clientInstance) return clientInstance;

  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch (e) {}

  const url = process.env.SUPABASE_URL || config.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || config.SUPABASE_KEY;

  if (url && key) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: false
        },
        realtime: {
          transport: wsTransport
        }
      });
      console.log('[Supabase] Client successfully initialized with URL:', url);
    } catch (err) {
      console.error('[Supabase] Could not create client:', err.message);
      clientInstance = null;
    }
  }
  return clientInstance;
}

// Initial attempt
getClient();

// Export a transparent proxy that delegates calls to the active client
module.exports = new Proxy({}, {
  get(target, prop) {
    const active = getClient();
    if (!active) return undefined;
    const val = active[prop];
    return typeof val === 'function' ? val.bind(active) : val;
  }
});

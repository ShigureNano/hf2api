// 从环境变量获取API keys
const huggingface_api_key = HUGGINGFACE_API_KEY;
const api_key = API_KEY;

// 验证API key的函数
function requireApiKey(request) {
  const providedKey = request.headers.get('Authorization');
  if (providedKey) {
    const key = providedKey.startsWith("Bearer ") ? providedKey.split("Bearer ")[1] : providedKey;
    if (key === api_key) {
      return true;
    }
  }
  return false;
}

// 处理 OPTIONS 请求的函数
function handleOptions(request) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, model',
    'Access-Control-Max-Age': '86400',
  });

  return new Response(null, {
    status: 204,
    headers: headers
  });
}

// 设置CORS头部的函数
function setCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, model');
  return response;
}

// 主处理函数
async function handleRequest(request) {
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  if (request.method !== 'POST') {
    return setCorsHeaders(new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  if (!requireApiKey(request)) {
    return setCorsHeaders(new Response(JSON.stringify({ error: "Invalid or missing API key" }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  const data = await request.json();
  const messages = data.messages || [];
  const model = data.model || 'Qwen/Qwen2.5-72B-Instruct';
  const temperature = data.temperature || 0.7;
  const max_tokens = data.max_tokens || 8196;
  const top_p = Math.min(Math.max(data.top_p || 0.9, 0.0001), 0.9999);
  const stream = data.stream || false;

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/' + model + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingface_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature,
        top_p: top_p,
        stream: stream
      }),
    });

    if (stream) {
      // 处理流式响应
      return setCorsHeaders(new Response(response.body, {
        headers: { 'Content-Type': 'text/event-stream' }
      }));
    } else {
      const result = await response.json();
      const content = result.choices[0].message.content;
      return setCorsHeaders(new Response(JSON.stringify({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: content
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: -1,
          completion_tokens: -1,
          total_tokens: -1
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  } catch (error) {
    return setCorsHeaders(new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

// 设置Cloudflare Worker的监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

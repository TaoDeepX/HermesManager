//! Provider 连接测试与模型列表获取

use serde::{Deserialize, Serialize};
use std::time::Duration;

// ─────────────────────────────────────────────────────────────────────────────
// 模型列表
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Deserialize, Debug)]
pub struct ListModelsRequest {
    pub base_url: String,
    pub api_key: Option<String>,
    #[serde(default)]
    pub is_ollama: bool,
}

#[derive(Serialize, Debug)]
pub struct ListModelsResponse {
    pub ok: bool,
    pub models: Vec<String>,
    pub error: Option<String>,
}

pub async fn list_models(req: ListModelsRequest) -> ListModelsResponse {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return ListModelsResponse {
                ok: false,
                models: vec![],
                error: Some(format!("client error: {}", e)),
            };
        }
    };

    if req.is_ollama {
        // Ollama: GET /api/tags
        let url = format!("{}/api/tags", req.base_url.trim_end_matches('/'));
        match client.get(&url).send().await {
            Ok(resp) if resp.status().is_success() => {
                #[derive(Deserialize)]
                struct OllamaResp { models: Vec<OllamaModel> }
                #[derive(Deserialize)]
                struct OllamaModel { name: String }
                
                match resp.json::<OllamaResp>().await {
                    Ok(data) => ListModelsResponse {
                        ok: true,
                        models: data.models.into_iter().map(|m| m.name).collect(),
                        error: None,
                    },
                    Err(e) => ListModelsResponse {
                        ok: false,
                        models: vec![],
                        error: Some(format!("parse error: {}", e)),
                    },
                }
            }
            Ok(resp) => ListModelsResponse {
                ok: false,
                models: vec![],
                error: Some(format!("HTTP {}", resp.status())),
            },
            Err(e) => ListModelsResponse {
                ok: false,
                models: vec![],
                error: Some(format!("{}", e)),
            },
        }
    } else {
        // OpenAI 兼容: GET /v1/models
        let url = format!("{}/models", req.base_url.trim_end_matches('/'));
        let mut builder = client.get(&url);
        if let Some(k) = req.api_key.as_ref().filter(|s| !s.is_empty()) {
            builder = builder.bearer_auth(k);
        }
        
        match builder.send().await {
            Ok(resp) if resp.status().is_success() => {
                #[derive(Deserialize)]
                struct OpenAIResp { data: Vec<OpenAIModel> }
                #[derive(Deserialize)]
                struct OpenAIModel { id: String }
                
                match resp.json::<OpenAIResp>().await {
                    Ok(data) => ListModelsResponse {
                        ok: true,
                        models: data.data.into_iter().map(|m| m.id).collect(),
                        error: None,
                    },
                    Err(e) => ListModelsResponse {
                        ok: false,
                        models: vec![],
                        error: Some(format!("parse error: {}", e)),
                    },
                }
            }
            Ok(resp) => ListModelsResponse {
                ok: false,
                models: vec![],
                error: Some(format!("HTTP {}", resp.status())),
            },
            Err(e) => ListModelsResponse {
                ok: false,
                models: vec![],
                error: Some(format!("{}", e)),
            },
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 连接测试
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Deserialize, Debug)]
pub struct TestRequest {
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    #[serde(default)]
    pub extra_headers: Vec<(String, String)>,
}

#[derive(Serialize, Debug)]
pub struct TestResponse {
    pub ok: bool,
    pub status: u16,
    pub latency_ms: u64,
    pub body_preview: String,
    pub error: Option<String>,
}

pub async fn test_connection(req: TestRequest) -> TestResponse {
    let start = std::time::Instant::now();
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return TestResponse {
                ok: false,
                status: 0,
                latency_ms: 0,
                body_preview: String::new(),
                error: Some(format!("client build error: {}", e)),
            };
        }
    };

    let url = format!("{}/chat/completions", req.base_url.trim_end_matches('/'));
    let body = serde_json::json!({
        "model": req.model,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 1,
        "stream": false
    });

    let mut builder = client.post(&url).json(&body);
    if let Some(k) = req.api_key.as_ref().filter(|s| !s.is_empty()) {
        builder = builder.bearer_auth(k);
    }
    for (k, v) in &req.extra_headers {
        builder = builder.header(k, v);
    }

    match builder.send().await {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let text = resp.text().await.unwrap_or_default();
            let preview: String = text.chars().take(400).collect();
            let latency = start.elapsed().as_millis() as u64;
            TestResponse {
                ok: (200..300).contains(&status),
                status,
                latency_ms: latency,
                body_preview: preview,
                error: if (200..300).contains(&status) { None } else { Some(format!("HTTP {}", status)) },
            }
        }
        Err(e) => TestResponse {
            ok: false,
            status: 0,
            latency_ms: start.elapsed().as_millis() as u64,
            body_preview: String::new(),
            error: Some(format!("{}", e)),
        },
    }
}

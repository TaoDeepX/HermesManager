//! 流式命令运行器：子进程 stdout/stderr 按行推送到前端，通过 Tauri 事件广播。

use serde::Serialize;
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Info,
    Stdout,
    Stderr,
    Ok,
    Warn,
    Err,
}

#[derive(Serialize, Clone, Debug)]
pub struct LogEvent {
    pub job_id: String,
    pub step: String,
    pub level: LogLevel,
    pub line: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProgressEvent {
    pub job_id: String,
    pub step: String,
    pub percent: u8,
    pub message: String,
}

pub fn emit_log<S: Into<String>>(
    app: &AppHandle,
    job_id: &str,
    step: &str,
    level: LogLevel,
    line: S,
) {
    let ev = LogEvent {
        job_id: job_id.to_string(),
        step: step.to_string(),
        level,
        line: line.into(),
    };
    let _ = app.emit("install-log", ev);
}

pub fn emit_progress(app: &AppHandle, job_id: &str, step: &str, percent: u8, msg: &str) {
    let ev = ProgressEvent {
        job_id: job_id.to_string(),
        step: step.to_string(),
        percent,
        message: msg.to_string(),
    };
    let _ = app.emit("install-progress", ev);
}

/// 执行命令并把 stdout/stderr 按行推送到前端。
/// 返回进程退出码。
pub async fn run_streaming(
    app: &AppHandle,
    job_id: &str,
    step: &str,
    program: &str,
    args: &[&str],
    cwd: Option<&std::path::Path>,
) -> anyhow::Result<i32> {
    emit_log(
        app,
        job_id,
        step,
        LogLevel::Info,
        format!("$ {} {}", program, args.join(" ")),
    );

    let mut cmd = Command::new(program);
    cmd.args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    // Windows: 隐藏子进程控制台窗口
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd.spawn()?;
    let stdout = child.stdout.take().expect("stdout");
    let stderr = child.stderr.take().expect("stderr");

    let app_out = app.clone();
    let jid_out = job_id.to_string();
    let step_out = step.to_string();
    let out_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stdout).lines();
        while let Ok(Some(l)) = lines.next_line().await {
            emit_log(&app_out, &jid_out, &step_out, LogLevel::Stdout, l);
        }
    });

    let app_err = app.clone();
    let jid_err = job_id.to_string();
    let step_err = step.to_string();
    let err_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        while let Ok(Some(l)) = lines.next_line().await {
            emit_log(&app_err, &jid_err, &step_err, LogLevel::Stderr, l);
        }
    });

    let status = child.wait().await?;
    let _ = out_task.await;
    let _ = err_task.await;

    let code = status.code().unwrap_or(-1);
    let level = if code == 0 {
        LogLevel::Ok
    } else {
        LogLevel::Err
    };
    emit_log(
        app,
        job_id,
        step,
        level,
        format!("exit code: {}", code),
    );
    Ok(code)
}

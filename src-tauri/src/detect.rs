//! 环境探测模块：跨平台收集系统信息与依赖状态，返回结构化数据给前端。

use serde::Serialize;
use std::process::Command;
use std::time::{Duration, Instant};

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Level {
    Ok,
    Warn,
    Err,
    Info,
}

#[derive(Serialize, Clone, Debug)]
pub struct Check {
    pub id: &'static str,
    pub label: &'static str,
    pub level: Level,
    pub value: String,
    /// 给小白看的修复建议；为空表示无需修复
    pub hint: Option<String>,
    /// 能否被"一键修复"自动处理
    pub auto_fixable: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct Report {
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub checks: Vec<Check>,
    pub ms_elapsed: u64,
}

/// 主入口：执行全部检测
pub fn run_all() -> Report {
    let start = Instant::now();
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    let os_version = os_version();

    let mut checks = Vec::new();
    checks.push(check_os(&os, &os_version));
    checks.push(check_arch(&arch));
    checks.push(check_disk_space());

    #[cfg(target_os = "windows")]
    {
        checks.push(check_virtualization_win());
        checks.push(check_wsl_win());
        checks.push(check_wsl_distro_win());
    }

    #[cfg(target_os = "macos")]
    {
        checks.push(check_xcode_clt_mac());
        checks.push(check_homebrew_mac());
    }

    checks.push(check_cmd("git", "Git", &["--version"], None));
    checks.push(check_cmd("curl", "curl", &["--version"], None));
    checks.push(check_network("github.com", "github.com 连通性"));
    checks.push(check_network(
        "pypi.tuna.tsinghua.edu.cn",
        "清华 PyPI 镜像",
    ));
    checks.push(check_network("ghproxy.com", "ghproxy 加速节点"));

    // Hermes 自身是否已安装（可选）
    checks.push(check_hermes_installed());

    Report {
        os,
        os_version,
        arch,
        checks,
        ms_elapsed: start.elapsed().as_millis() as u64,
    }
}

fn os_version() -> String {
    #[cfg(target_os = "windows")]
    {
        let v = windows_version::OsVersion::current();
        format!("Windows {}.{}.{} (build {})", v.major, v.minor, v.pack, v.build)
    }
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("sw_vers").arg("-productVersion").output();
        if let Ok(o) = out {
            if o.status.success() {
                return format!("macOS {}", String::from_utf8_lossy(&o.stdout).trim());
            }
        }
        "macOS".into()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        "unknown".into()
    }
}

fn check_os(os: &str, version: &str) -> Check {
    let (level, hint) = match os {
        "windows" => {
            // 建议 Win10 19041+ 或 Win11
            let build = version
                .split("build ")
                .nth(1)
                .and_then(|s| s.trim_end_matches(')').parse::<u32>().ok())
                .unwrap_or(0);
            if build >= 19041 {
                (Level::Ok, None)
            } else {
                (
                    Level::Err,
                    Some(
                        "需要 Windows 10 版本 2004 (build 19041) 及以上，或 Windows 11。"
                            .into(),
                    ),
                )
            }
        }
        "macos" => (Level::Ok, None),
        _ => (
            Level::Err,
            Some("目前仅支持 Windows 与 macOS。".into()),
        ),
    };
    Check {
        id: "os",
        label: "操作系统",
        level,
        value: version.to_string(),
        hint,
        auto_fixable: false,
    }
}

fn check_arch(arch: &str) -> Check {
    let supported = matches!(arch, "x86_64" | "aarch64");
    Check {
        id: "arch",
        label: "CPU 架构",
        level: if supported { Level::Ok } else { Level::Warn },
        value: arch.to_string(),
        hint: if supported {
            None
        } else {
            Some(format!("未验证的架构 `{}`，可能无法正常运行。", arch))
        },
        auto_fixable: false,
    }
}

fn check_disk_space() -> Check {
    use sysinfo::Disks;
    let disks = Disks::new_with_refreshed_list();
    let mut max_free: u64 = 0;
    for d in &disks {
        max_free = max_free.max(d.available_space());
    }
    let free_gb = max_free as f64 / 1024.0 / 1024.0 / 1024.0;
    let level = if free_gb >= 10.0 {
        Level::Ok
    } else if free_gb >= 5.0 {
        Level::Warn
    } else {
        Level::Err
    };
    Check {
        id: "disk",
        label: "磁盘可用空间",
        level,
        value: format!("{:.1} GB", free_gb),
        hint: if free_gb < 10.0 {
            Some("建议至少预留 10 GB 用于 WSL/依赖/模型缓存。".into())
        } else {
            None
        },
        auto_fixable: false,
    }
}

#[cfg(target_os = "windows")]
fn check_virtualization_win() -> Check {
    // 用 systeminfo 过滤 Hyper-V 相关字段
    let out = Command::new("cmd")
        .args(["/C", "systeminfo"])
        .output();
    let text = out
        .ok()
        .and_then(|o| if o.status.success() { Some(String::from_utf8_lossy(&o.stdout).to_string()) } else { None })
        .unwrap_or_default();

    let enabled = text.contains("Virtualization Enabled In Firmware: Yes")
        || text.contains("已在固件中启用虚拟化: 是")
        || text.contains("已在固件中启用虚拟化:   是");

    Check {
        id: "virtualization",
        label: "CPU 虚拟化（BIOS）",
        level: if enabled { Level::Ok } else { Level::Warn },
        value: if enabled { "已启用".into() } else { "未检测到".into() },
        hint: if enabled {
            None
        } else {
            Some(
                "未检测到虚拟化。若 WSL2 安装失败，请进入 BIOS 开启 Intel VT-x / AMD-V。"
                    .into(),
            )
        },
        auto_fixable: false,
    }
}

#[cfg(target_os = "windows")]
fn check_wsl_win() -> Check {
    let out = Command::new("wsl").args(["--status"]).output();
    match out {
        Ok(o) if o.status.success() => {
            // wsl --status 输出是 UTF-16，需解码
            let text = decode_win_output(&o.stdout);
            let version_2 = text.contains("2") && text.to_lowercase().contains("default version");
            Check {
                id: "wsl",
                label: "WSL",
                level: if version_2 { Level::Ok } else { Level::Warn },
                value: if version_2 { "WSL2 已启用".into() } else { "已安装，但默认版本可能不是 2".into() },
                hint: if version_2 { None } else { Some("建议执行 `wsl --set-default-version 2`。".into()) },
                auto_fixable: !version_2,
            }
        }
        _ => Check {
            id: "wsl",
            label: "WSL",
            level: Level::Err,
            value: "未安装".into(),
            hint: Some("需要 WSL2 才能运行 HermesAgent；安装器可一键修复。".into()),
            auto_fixable: true,
        },
    }
}

#[cfg(target_os = "windows")]
fn check_wsl_distro_win() -> Check {
    let out = Command::new("wsl").args(["-l", "-q"]).output();
    match out {
        Ok(o) if o.status.success() => {
            let text = decode_win_output(&o.stdout);
            let distros: Vec<&str> = text
                .lines()
                .map(|l| l.trim())
                .filter(|l| !l.is_empty())
                .collect();
            if distros.is_empty() {
                Check {
                    id: "wsl_distro",
                    label: "WSL 发行版",
                    level: Level::Err,
                    value: "无已安装发行版".into(),
                    hint: Some("安装器将为你安装 Ubuntu 22.04。".into()),
                    auto_fixable: true,
                }
            } else {
                Check {
                    id: "wsl_distro",
                    label: "WSL 发行版",
                    level: Level::Ok,
                    value: distros.join(", "),
                    hint: None,
                    auto_fixable: false,
                }
            }
        }
        _ => Check {
            id: "wsl_distro",
            label: "WSL 发行版",
            level: Level::Err,
            value: "无法查询".into(),
            hint: Some("WSL 未安装或异常。".into()),
            auto_fixable: true,
        },
    }
}

#[cfg(target_os = "windows")]
fn decode_win_output(bytes: &[u8]) -> String {
    // wsl.exe 默认输出 UTF-16 LE
    if bytes.len() >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE {
        let u16s: Vec<u16> = bytes[2..]
            .chunks(2)
            .filter_map(|c| if c.len() == 2 { Some(u16::from_le_bytes([c[0], c[1]])) } else { None })
            .collect();
        return String::from_utf16_lossy(&u16s);
    }
    // 兜底按 UTF-16 LE（多数 wsl 输出即便无 BOM）
    let u16s: Vec<u16> = bytes
        .chunks(2)
        .filter_map(|c| if c.len() == 2 { Some(u16::from_le_bytes([c[0], c[1]])) } else { None })
        .collect();
    let utf16 = String::from_utf16_lossy(&u16s);
    if utf16.contains(char::REPLACEMENT_CHARACTER) {
        String::from_utf8_lossy(bytes).to_string()
    } else {
        utf16
    }
}

#[cfg(target_os = "macos")]
fn check_xcode_clt_mac() -> Check {
    let out = Command::new("xcode-select").arg("-p").output();
    match out {
        Ok(o) if o.status.success() => Check {
            id: "xcode_clt",
            label: "Xcode Command Line Tools",
            level: Level::Ok,
            value: String::from_utf8_lossy(&o.stdout).trim().to_string(),
            hint: None,
            auto_fixable: false,
        },
        _ => Check {
            id: "xcode_clt",
            label: "Xcode Command Line Tools",
            level: Level::Err,
            value: "未安装".into(),
            hint: Some("安装器会调用 `xcode-select --install` 弹出系统安装窗口。".into()),
            auto_fixable: true,
        },
    }
}

#[cfg(target_os = "macos")]
fn check_homebrew_mac() -> Check {
    let out = Command::new("brew").arg("--version").output();
    match out {
        Ok(o) if o.status.success() => {
            let v = String::from_utf8_lossy(&o.stdout);
            let line = v.lines().next().unwrap_or("Homebrew").to_string();
            Check {
                id: "brew",
                label: "Homebrew",
                level: Level::Ok,
                value: line,
                hint: None,
                auto_fixable: false,
            }
        }
        _ => Check {
            id: "brew",
            label: "Homebrew",
            level: Level::Err,
            value: "未安装".into(),
            hint: Some("安装器将使用清华镜像脚本自动安装 Homebrew。".into()),
            auto_fixable: true,
        },
    }
}

fn check_cmd(cmd: &str, label: &'static str, args: &[&str], min_version: Option<&str>) -> Check {
    // 固定的 label（&'static str），这里简化处理
    let out = Command::new(cmd).args(args).output();
    let id: &'static str = Box::leak(cmd.to_string().into_boxed_str());
    match out {
        Ok(o) if o.status.success() => {
            let text = String::from_utf8_lossy(&o.stdout);
            let first = text.lines().next().unwrap_or("").trim().to_string();
            let ok = match min_version {
                Some(_min) => true,
                None => true,
            };
            Check {
                id,
                label,
                level: if ok { Level::Ok } else { Level::Warn },
                value: if first.is_empty() { "已安装".into() } else { first },
                hint: None,
                auto_fixable: false,
            }
        }
        _ => Check {
            id,
            label,
            level: Level::Warn,
            value: "未安装".into(),
            hint: Some(format!("安装器将在 WSL/macOS 内自动安装 {}。", cmd)),
            auto_fixable: true,
        },
    }
}

fn check_network(host: &str, label_text: &str) -> Check {
    let id: &'static str = Box::leak(format!("net_{}", host).into_boxed_str());
    let label: &'static str = Box::leak(label_text.to_string().into_boxed_str());
    let start = Instant::now();
    let ok = tcp_check(host, 443, Duration::from_secs(3));
    let elapsed = start.elapsed().as_millis();
    Check {
        id,
        label,
        level: if ok { Level::Ok } else { Level::Warn },
        value: if ok {
            format!("可达 · {} ms", elapsed)
        } else {
            "超时 / 不可达".into()
        },
        hint: if ok {
            None
        } else {
            Some("若长期不可达，可开启『国内加速』开关使用镜像；国际站点可能需要代理。".into())
        },
        auto_fixable: false,
    }
}

fn tcp_check(host: &str, port: u16, timeout: Duration) -> bool {
    use std::net::ToSocketAddrs;
    let addr = format!("{}:{}", host, port);
    let iter = match addr.to_socket_addrs() {
        Ok(it) => it,
        Err(_) => return false,
    };
    for sa in iter {
        if std::net::TcpStream::connect_timeout(&sa, timeout).is_ok() {
            return true;
        }
    }
    false
}

fn check_hermes_installed() -> Check {
    let found = which::which("hermes").ok();
    match found {
        Some(p) => Check {
            id: "hermes",
            label: "HermesAgent 当前状态",
            level: Level::Info,
            value: format!("已安装：{}", p.display()),
            hint: Some("检测到已安装，安装流程将切换为『更新/修复』模式。".into()),
            auto_fixable: false,
        },
        None => Check {
            id: "hermes",
            label: "HermesAgent 当前状态",
            level: Level::Info,
            value: "未安装".into(),
            hint: None,
            auto_fixable: false,
        },
    }
}

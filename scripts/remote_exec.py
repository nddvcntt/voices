# -*- coding: utf-8 -*-
"""Execute commands on remote server via JupyterLab Terminal WebSocket."""
import sys
import os
import time
import json
import ssl
import requests
import websocket
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE_URL = os.environ.get("JUPYTER_URL", "https://test.vcntt.tech")
PASSWORD = os.environ.get("JUPYTER_PASSWORD", "123456a@")

session = requests.Session()
login_url = f"{BASE_URL}/login?next=%2Flab"

r1 = session.get(login_url, verify=False, timeout=15)
xsrf = session.cookies.get("_xsrf", "")

r2 = session.post(login_url, data={"password": PASSWORD, "_xsrf": xsrf}, timeout=15)
if r2.status_code != 200:
    print(f"❌ Đăng nhập thất bại (HTTP {r2.status_code})")
    sys.exit(1)

# Tạo terminal
term_url = f"{BASE_URL}/api/terminals"
headers = {"X-XSRFToken": session.cookies.get("_xsrf", "")}
r3 = session.post(term_url, headers=headers, verify=False, timeout=15)
if r3.status_code not in (200, 201):
    print(f"❌ Không thể tạo terminal: {r3.status_code} {r3.text}")
    sys.exit(1)

term_name = r3.json()["name"]

# Kết nối WebSocket
ws_base = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")
ws_url = f"{ws_base}/terminals/websocket/{term_name}"
cookie_str = "; ".join([f"{k}={v}" for k, v in session.cookies.get_dict().items()])

ws = websocket.create_connection(
    ws_url,
    header={"Cookie": cookie_str},
    sslopt={"cert_reqs": ssl.CERT_NONE},
    timeout=15
)

# Drain banner ban đầu
time.sleep(1)
try:
    ws.settimeout(1.0)
    while True:
        ws.recv()
except Exception:
    pass

def run_cmd(cmd, timeout=300):
    token = f"DONE_{int(time.time()*1000)}"
    wrapped = f"{cmd}\necho \"{token}:$?\"\n"
    print(f"\n==> [Remote CMD]: {cmd}")
    ws.send(json.dumps(["stdin", wrapped]))
    
    start = time.time()
    exit_code = None
    output_buffer = ""
    
    while time.time() - start < timeout:
        try:
            ws.settimeout(2.0)
            msg = ws.recv()
            data = json.loads(msg)
            if data[0] == "stdout":
                text = data[1]
                sys.stdout.write(text)
                sys.stdout.flush()
                output_buffer += text
                if f"{token}:" in text:
                    parts = text.split(f"{token}:")
                    code_str = parts[1].split()[0] if len(parts) > 1 else "0"
                    try:
                        exit_code = int(code_str)
                    except ValueError:
                        exit_code = 0
                    break
        except websocket.WebSocketTimeoutException:
            continue
        except Exception as e:
            print(f"Lỗi đọc socket: {e}")
            break
            
    return exit_code, output_buffer

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "whoami && pwd && docker ps"
    code, out = run_cmd(cmd)
    try:
        session.delete(f"{term_url}/{term_name}", headers=headers, timeout=5)
    except Exception:
        pass
    ws.close()
    sys.exit(code if code is not None else 1)

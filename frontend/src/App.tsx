import { useState, useEffect } from "react";

const API = "/api";
const ROLE_COLORS: Record<string, string> = { guest: "#607d8b", user: "#2196f3", premium: "#9c27b0", admin: "#ff9800", super_admin: "#f44336" };
const ROLE_LABELS: Record<string, string> = { guest: "访客", user: "用户", premium: "高级用户", admin: "管理员", super_admin: "超级管理员" };

function getToken() { return localStorage.getItem("access_token"); }
function getUser() { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } }

async function api(path: string, opts?: RequestInit) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API + path, { ...opts, headers: { ...headers, ...(opts?.headers as Record<string, string>) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "请求失败");
  return data;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>统一认证</h1><p>管理员登录</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label htmlFor="u">用户名</label>
            <input id="u" type="text" value={username} onChange={e => setUser(e.target.value)} placeholder="请输入用户名" required />
          </div>
          <div className="form-group">
            <label htmlFor="p">密码</label>
            <input id="p" type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="请输入密码" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "登录中..." : "登录"}</button>
        </form>
      </div>
    </div>
  );
}

interface User { id: number; username: string; email: string; role: string; createdAt: string; }

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const user = getUser();

  useEffect(() => { api("/users").then(setUsers).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  const changeRole = async (uid: number, role: string) => {
    if (user && user.id === uid) { alert("不能修改自己的角色"); return; }
    if (!confirm('确定将角色改为 "' + ROLE_LABELS[role] + '" ？')) return;
    setUpdating(uid);
    try {
      const updated = await api("/users/" + uid, { method: "PATCH", body: JSON.stringify({ role }) });
      setUsers(users.map(u => u.id === uid ? updated : u));
    } catch (err: any) { alert("失败: " + err.message); } finally { setUpdating(null); }
  };

  const logout = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>用户管理</h1>
        <div className="user-info">
          <span>{user?.username}</span>
          <span className="role-badge" style={{ backgroundColor: ROLE_COLORS[user?.role] || "#3b82f6" }}>{ROLE_LABELS[user?.role] || user?.role}</span>
          <button className="btn btn-danger btn-sm" onClick={logout}>退出登录</button>
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      {loading ? <div className="loading">加载中...</div> : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>创建时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#999" }}>暂无用户数据</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={updating === u.id ? { opacity: 0.5 } : {}}>
                  <td>{u.id}</td>
                  <td>{u.username}{user && u.id === user.id && <span className="self-tag">当前用户</span>}</td>
                  <td>{u.email}</td>
                  <td><span className="role-tag" style={{ backgroundColor: ROLE_COLORS[u.role] || "#3b82f6" }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{user && u.id === user.id ? <span style={{ color: "#999", fontSize: "13px" }}>不可修改</span> : (
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={updating === u.id}>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="footer">共 {users.length} 个用户 | 仅超级管理员可修改角色</div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return getToken() ? <AdminPanel /> : <LoginForm onLogin={() => window.location.reload()} />;
}
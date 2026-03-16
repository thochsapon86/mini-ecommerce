import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/admin/users", {}, token); setUsers(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const updateRole = async () => {
    try {
      await apiFetch(`/admin/users/${editUser._id}`, { method: "PUT", body: JSON.stringify({ role: newRole }) }, token);
      toast.success("อัปเดต role สำเร็จ!"); setEditUser(null); load();
    } catch (e) { toast.error(e.message); }
  };

  const del = async (id) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return;
    try { await apiFetch(`/admin/users/${id}`, { method: "DELETE" }, token); toast.success("ลบผู้ใช้สำเร็จ"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const roleStyle = { admin: "bg-red-100 text-red-700", owner: "bg-orange-100 text-orange-700", user: "bg-blue-100 text-blue-700" };
  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: users.length, icon: "👥", color: "bg-blue-50 border-blue-200" },
    { label: "Admin", value: users.filter(u => u.role === "admin").length, icon: "⚙️", color: "bg-red-50 border-red-200" },
    { label: "Owner", value: users.filter(u => u.role === "owner").length, icon: "👑", color: "bg-orange-50 border-orange-200" },
    { label: "User", value: users.filter(u => u.role === "user").length, icon: "👤", color: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl">⚙️</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">รายชื่อผู้ใช้ทั้งหมด</h2>
          <span className="text-sm text-gray-400 font-medium">{users.length} บัญชี</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["ผู้ใช้", "อีเมล", "Role", "จัดการ"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${roleStyle[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditUser(u); setNewRole(u.role); }}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        เปลี่ยน Role
                      </button>
                      <button onClick={() => del(u._id)} className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`เปลี่ยน Role: ${editUser?.name}`}>
        <div className="mb-4 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black">
            {editUser?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{editUser?.name}</p>
            <p className="text-gray-400 text-sm">{editUser?.email}</p>
          </div>
        </div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Role ใหม่</label>
        <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-bold bg-gray-50 mb-5"
          value={newRole} onChange={e => setNewRole(e.target.value)}>
          {["user", "owner", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={updateRole} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">บันทึก</button>
          <button onClick={() => setEditUser(null)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}

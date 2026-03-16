import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/users/profile", {}, token); setProfile(d); setForm({ name: d.name, password: "" }); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const update = async () => {
    setSaving(true);
    try {
      const body = { name: form.name };
      if (form.password) body.password = form.password;
      await apiFetch("/users/profile", { method: "PUT", body: JSON.stringify(body) }, token);
      toast.success("อัปเดตโปรไฟล์สำเร็จ!");
      setForm(p => ({ ...p, password: "" }));
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-lg mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">โปรไฟล์ของฉัน</h1>

      <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-6 mb-6 text-white shadow-2xl shadow-red-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black text-white shadow-inner">
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-xl">{profile?.name}</p>
            <p className="text-red-200 text-sm font-medium">{profile?.email}</p>
            <span className="inline-block mt-1 bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{profile?.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2"><span>✏️</span> แก้ไขข้อมูล</h2>
        <Input label="ชื่อ" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Input label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
        <button onClick={update} disabled={saving}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 mt-2">
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>
    </div>
  );
}

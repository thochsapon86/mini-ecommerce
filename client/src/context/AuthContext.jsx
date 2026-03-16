import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const decodeToken = (t) => {
  try { return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) setUser(decodeToken(token));
    else setUser(null);
  }, [token]);

  const login = (t) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

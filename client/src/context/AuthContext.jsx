import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(
      "http://localhost:3000/api/auth/login",
      { email, password },
      { withCredentials: true }
    );
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
  };

  const signup = async (name, email, password) => {
    const { data } = await axios.post(
      "http://localhost:3000/api/auth/register",
      { name, email, password },
      { withCredentials: true }
    );
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
  };

  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

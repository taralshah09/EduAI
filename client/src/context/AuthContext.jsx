import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

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
    const { data } = await api.post(
      "/auth/login",
      { email, password }
    );
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
  };

  const sendSignupOTP = async (email) => {
    await api.post("/auth/send-otp", { email });
  };

  const signup = async (name, email, password, otp) => {
    const { data } = await api.post(
      "/auth/register",
      { name, email, password, otp }
    );
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
  };

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout",
        {}
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const updateUser = (data) => {
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem("userInfo", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, sendSignupOTP, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

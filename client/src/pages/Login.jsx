import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="bg-surface text-dark font-sans min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-custom p-8 md:p-10 border-[1.5px] border-gray-200 shadow-sm max-w-md w-full relative overflow-hidden">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-dark mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-black text-dark tracking-tighter mb-2">Welcome Back</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">Log in to continue your learning journey.</p>
        
        {error && <div className="bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className="w-full bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200 focus:bg-white focus:border-primary focus:ring-0 transition-all text-sm font-medium outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200 focus:bg-white focus:border-primary focus:ring-0 transition-all text-sm font-medium outline-none"
            />
          </div>
          <button type="submit" className="bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 group w-full shadow-md mt-6">
            Log In
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Don't have an account? <Link to="/signup" className="text-dark font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

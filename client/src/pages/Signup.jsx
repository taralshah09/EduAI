import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CgSpinner } from "react-icons/cg";
import OTPInput from "../components/OTPInput";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0); // 0: signup info, 1: otp verification
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup, sendSignupOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await sendSignupOTP(email);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await signup(name, email, password, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
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
        <h1 className="text-4xl font-black text-dark tracking-tighter mb-2">
          {step === 0 ? "Create Account" : "Verify Email"}
        </h1>
        <p className="text-sm text-gray-500 font-medium mb-8">
          {step === 0 
            ? "Start your AI-powered learning journey today." 
            : `We've sent a code to ${email}`}
        </p>
        
        {error && <div className="bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl mb-6">{error}</div>}
        
        {step === 0 ? (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                placeholder="John Doe"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200 focus:bg-white focus:border-primary focus:ring-0 transition-all text-sm font-medium outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                placeholder="name@company.com"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200 focus:bg-white focus:border-primary focus:ring-0 transition-all text-sm font-medium outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200 focus:bg-white focus:border-primary focus:ring-0 transition-all text-sm font-medium outline-none disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 group w-full shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <CgSpinner className="w-6 h-6 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 text-center">Enter 6-digit OTP</label>
              <OTPInput
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 group w-full shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <CgSpinner className="w-6 h-6 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Create Account"
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={isLoading}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-dark transition-colors"
              >
                Change Email / Back
              </button>
            </div>
          </form>
        )}
        
        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Already have an account? <Link to="/login" className="text-dark font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

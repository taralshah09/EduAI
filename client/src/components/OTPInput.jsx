import React, { useState, useRef, useEffect } from "react";

const OTPInput = ({ value, onChange, length = 6, disabled = false }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value === "") {
      setOtp(new Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Move next
    if (element.value !== "" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, length).split("");
    if (data.length === 0) return;

    const newOtp = [...otp];
    data.forEach((char, index) => {
      if (!isNaN(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus last filled or next empty
    const nextIndex = Math.min(data.length, length - 1);
    inputRefs.current[nextIndex].focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          value={data}
          disabled={disabled}
          ref={(el) => (inputRefs.current[index] = el)}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:ring-0 outline-none transition-all disabled:opacity-50"
        />
      ))}
    </div>
  );
};

export default OTPInput;

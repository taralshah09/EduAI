import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      const token = generateToken(user._id);
      const cookieOptions = {
        httpOnly: false, // email and name should be accessible by JS if needed, but token MUST be httpOnly
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      };

      res.cookie("token", token, { ...cookieOptions, httpOnly: true });
      res.cookie("email", user.email, cookieOptions);
      res.cookie("name", user.name, cookieOptions);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        gemini: user.gemini,
        groq: user.groq,
        openrouter: user.openrouter,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      const cookieOptions = {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      };

      res.cookie("token", token, { ...cookieOptions, httpOnly: true });
      res.cookie("email", user.email, cookieOptions);
      res.cookie("name", user.name, cookieOptions);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        gemini: user.gemini,
        groq: user.groq,
        openrouter: user.openrouter,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gemini: user.gemini,
      groq: user.groq,
      openrouter: user.openrouter,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

export const logoutUser = (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
  };
  res.clearCookie("token", options);
  res.clearCookie("email", { ...options, httpOnly: false });
  res.clearCookie("name", { ...options, httpOnly: false });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateApiKeys = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.gemini !== undefined) {
      if (!user.gemini) user.gemini = {};
      user.gemini.apiKey = req.body.gemini.trim();
    }

    if (req.body.groq !== undefined) {
      if (!user.groq) user.groq = {};
      user.groq.apiKey = req.body.groq.trim();
    }

    if (req.body.openrouter !== undefined) {
      if (!user.openrouter) user.openrouter = {};
      user.openrouter.apiKey = req.body.openrouter.trim();
    }

    await user.save();

    res.json({
      message: "API keys updated successfully",
      apiKeys: {
        gemini: user.gemini,
        groq: user.groq,
        openrouter: user.openrouter,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

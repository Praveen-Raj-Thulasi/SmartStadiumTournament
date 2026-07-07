import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'arenaflow_super_secret_jwt_key_2026_xyz';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, role } = req.body;

  const cleanUsername = username?.trim();
  const cleanPassword = password?.trim();

  if (!cleanUsername || !cleanPassword || !role) {
    res.status(400).json({ error: 'Validation Error: Username, password, and role are required fields.' });
    return;
  }

  if (!['director', 'security', 'guest_services'].includes(role)) {
    res.status(400).json({ error: 'Validation Error: Invalid role selection.' });
    return;
  }

  try {
    const existingUser = await UserModel.findOne({ username: cleanUsername });
    if (existingUser) {
      res.status(400).json({ error: 'Conflict: Username already registered.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const newUser = new UserModel({
      username: cleanUsername,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error registering user.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const cleanUsername = username?.trim();
  const cleanPassword = password?.trim();

  if (!cleanUsername || !cleanPassword) {
    res.status(400).json({ error: 'Validation Error: Username and password are required fields.' });
    return;
  }

  try {
    const user = await UserModel.findOne({ username: cleanUsername });
    if (!user) {
      res.status(401).json({ error: 'Authentication Failed: Invalid username or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Authentication Failed: Invalid username or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login authentication.' });
  }
};

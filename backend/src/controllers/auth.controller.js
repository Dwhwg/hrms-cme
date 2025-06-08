const User = require('../models/user.model');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, password, role } = req.body;
      console.log('Register attempt:', { username, role });

      // Validate role
      if (!['PIC', 'EMPLOYEE'].includes(role)) {
        console.log('Invalid role:', role);
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        console.log('Username already exists:', username);
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create new user
      const user = await User.create({ username, password, role });
      const token = User.generateToken(user);
      console.log('User registered successfully:', { id: user.id, username });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Error in register:', error);
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', { username });

      // Find user
      const user = await User.findByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = User.generateToken(user);
      console.log('Login successful:', { id: user.id, username });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findByUsername(req.user.username);
      if (!user) {
        console.log('Profile not found for user:', req.user.username);
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'Error getting profile', error: error.message });
    }
  }
};

module.exports = authController; 
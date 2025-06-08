const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByUsername(decoded.username);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.id) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const isPIC = (req, res, next) => {
  if (req.user.role !== 'PIC') {
    return res.status(403).json({ message: 'Access denied. PIC role required.' });
  }
  next();
};

const isEmployee = (req, res, next) => {
  if (req.user.role !== 'EMPLOYEE') {
    return res.status(403).json({ message: 'Access denied. Employee role required.' });
  }
  next();
};

module.exports = {
  auth,
  isPIC,
  isEmployee
}; 
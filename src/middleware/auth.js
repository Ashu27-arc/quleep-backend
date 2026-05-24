const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization denied. Empty token.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_studio_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user information to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware verification failure:', err.message);
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

module.exports = auth;

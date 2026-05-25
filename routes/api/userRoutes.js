const router = require('express').Router();
const { User } = require('../../models/User');
const { signToken } = require('../../utils/auth');
 
router.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.log("--- MONGOOSE ERROR DETAILS ---");
    console.log(err);
    
    // Handle Mongoose duplicate key error (e.g., email already registered)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Handle Mongoose validation errors (missing fields, wrong format)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }

    // Fallback for unexpected server errors
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

 
// POST /api/users/login - Authenticate a user and return a token
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
 
  if (!user) {
    return res.status(400).json({ message: "Can't find this user" });
  }
 
  const correctPw = await user.isCorrectPassword(req.body.password);
 
  if (!correctPw) {
    return res.status(400).json({ message: 'Wrong password!' });
  }
 
  const token = signToken(user);
  res.json({ token, user });
});
 
module.exports = router;
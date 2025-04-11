// Register User
const Regis = async (req, res) => {
    const { username, password, email, role } = req.body; // Add role field
   
    if (!username || !password || !email || !role) { 
      return res.status(400).json({ message: 'All fields are required' }); 
    }
    
    // Validate role is either 'artisan' or 'user'
    if (role !== 'artisan' && role !== 'user') {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
   
    try { 
      const existingUser = await UserModel.findOne({ email }); 
      
      if (existingUser) { 
        return res.status(400).json({ message: 'Email is already registered' }); 
      } 
   
      const salt = await bcrypt.genSalt(); 
      const hashedPassword = await bcrypt.hash(password, salt); 
   
      // Include role in new user
      const newUser = new UserModel({ 
        username, 
        password: hashedPassword, 
        email,
        role // Add role to user document
      }); 
      await newUser.save(); 
   
      return res.json({ message: 'Registration successful' }); 
    } catch (err) { 
      console.error('Error saving user:', err.message); 
      return res.status(500).json({ message: 'Failed to register user' }); 
    } 
};

// Login User
const Log = async (req, res) => {
    const { email, password } = req.body; 
   
    if (!email || !password) { 
      return res.status(400).json({ message: 'Email and password are required' }); 
    } 
   
    try { 
      const user = await UserModel.findOne({ email }); 
      if (!user) { 
        return res.status(400).json({ message: 'Invalid email or password' }); 
      } 
   
      const isPasswordValid = await bcrypt.compare(password, user.password); 
      if (!isPasswordValid) { 
        return res.status(400).json({ message: 'Invalid email or password' }); 
      } 
   
      const accessToken = jwt.sign( 
        { userId: user._id, email: user.email, role: user.role }, // Include role in token
        process.env.JWT_SECRET, 
        { expiresIn: '30m' } 
      ); 
   
      const refreshToken = jwt.sign( 
        { userId: user._id, email: user.email, role: user.role }, // Include role in token
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: '7d' } 
      ); 
   
      user.refreshToken = refreshToken; 
      await user.save(); 
   
      return res.json({  
        accessToken,  
        refreshToken, 
        role: user.role, // Return the user's role
        expiresIn: 1800,  
        message: 'Login successful'  
      }); 
    } catch (err) { 
      console.error('Error logging in user:', err.message); 
      return res.status(500).json({ message: 'Failed to login user' }); 
    } 
};

module.exports = {
  Regis,
  Log,
  
};
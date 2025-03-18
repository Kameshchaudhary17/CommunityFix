const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { multer, storage } = require('../middleware/fileMiddleware');
const fs = require('fs');

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        // Only accept image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Create middleware for handling multiple file uploads
const uploadFields = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'citizenshipPhoto', maxCount: 1 }
]);

const loginUser = async (req, res) => {
    const { user_email, password } = req.body;
    
    // Validate input
    if (!user_email || !password) {
        return res.status(400).json({ error: "Please enter all the details." });
    }
    
    try {
        // Find user by email
        const user = await prisma.users.findFirst({ 
            where: { 
                user_email 
            } 
        });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check account verification for regular users
        if (user.role === 'USER' && !user.isVerified) {
            return res.status(403).json({ error: "Sorry, your account is not verified yet!" });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Your account has been deactivated." });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password." });
        }

        // Generate a token
        const token = jwt.sign(
            { 
                id: user.user_id, 
                role: user.role 
            },
            process.env.JWT_SECRET || "THIS_IS_MY_SECRET_KEY",  
            { expiresIn: '24h' }     
        );

        // Remove sensitive information before sending
        const { password: userPassword, ...userWithoutPassword } = user;

        // User authenticated
        return res.status(200).json({
            message: "User logged in successfully.",
            user: userWithoutPassword,
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// Note: The signupUser function now receives req and res after multer processes the files
const signupUser = async (req, res) => {
    try {
        const { 
            user_name, 
            user_email, 
            password, 
            role = 'USER',
            contact,
            municipality,
            wardNumber
        } = req.body;

        // Validate required fields
        if (!user_name || !user_email || !password) {
            return res.status(400).json({ error: "Please provide name, email, and password." });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long." });
        }

        // Check if user already exists
        const oldUser = await prisma.users.findFirst({ where: { user_email } });
        
        if (oldUser) {
            return res.status(409).json({ error: "User already exists with this email." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Get file paths if files were uploaded
        let profilePicture = null;
        let citizenshipPhoto = null;

        if (req.files) {
            if (req.files.profilePicture && req.files.profilePicture[0]) {
                profilePicture = req.files.profilePicture[0].path.replace(/^storage[\\/]/, '');
            }
            if (req.files.citizenshipPhoto && req.files.citizenshipPhoto[0]) {
                citizenshipPhoto = req.files.citizenshipPhoto[0].path.replace(/^storage[\\/]/, '');
            }
        }
        
 
        // Convert wardNumber to integer
        const wardNum = wardNumber ? parseInt(wardNumber) : null;

        // Prepare user data
        const userData = {
            user_name,
            user_email,
            password: hash,
            role,
            contact: contact || null,
            municipality: municipality || null,
            wardNumber: wardNum,
            profilePicture,
            citizenshipPhoto
        };

        // Add role-specific settings
        if (role === 'MUNICIPALITY') {
            // Validate municipality-specific fields
            if (!municipality || !wardNumber) {
                return res.status(400).json({ error: "Municipality and ward number are required for municipality accounts." });
            }
            
            userData.isVerified = true; // Automatically verify municipality accounts
        } else {
            userData.isVerified = false; // Require verification for regular users
        }

        // Create new user
        const newUser = await prisma.users.create({
            data: userData
        });      

        // Remove sensitive information before sending
        const { password: userPassword, ...userWithoutPassword } = newUser;

        // Send the response back
        res.status(201).json({
            message: role === 'MUNICIPALITY' 
                ? "Municipality account successfully registered." 
                : "User successfully registered.",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "An account with this email already exists." });
        }
        
        res.status(500).json({ error: "Internal server error." });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
      console.log('Request body:', req.body); // Log request body
      console.log('Request files:', req.files); // Log uploaded files
  
      const { user_id } = req.params;
      const { 
        user_name, 
        contact, 
        municipality, 
        wardNumber,
        password,
        isActive,
        isVerified
      } = req.body;
  
      // Verify user exists
      const user = await prisma.users.findUnique({
        where: { user_id: parseInt(user_id) }
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // Prepare update data
      const updateData = {};
  
      // Only update fields that are provided
      if (user_name) updateData.user_name = user_name;
      if (contact) updateData.contact = contact;
      if (municipality) updateData.municipality = municipality;
      if (wardNumber !== undefined) updateData.wardNumber = parseInt(wardNumber);
      if (isActive !== undefined) updateData.isActive = isActive === 'true';
      if (isVerified !== undefined) updateData.isVerified = isVerified === 'true';
  
      // If password is provided, hash it
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
  
      // Update file paths if files were uploaded
      if (req.files) {
        if (req.files.photo && req.files.photo[0]) {
          updateData.profilePicture = req.files.photo[0].path;
          
          // Delete old profile picture if it exists
          if (user.profilePicture && fs.existsSync(user.profilePicture)) {
            fs.unlinkSync(user.profilePicture);
          }
        }
        if (req.files.citizenshipPhoto && req.files.citizenshipPhoto[0]) {
          updateData.citizenshipPhoto = req.files.citizenshipPhoto[0].path;
          
          // Delete old citizenship photo if it exists
          if (user.citizenshipPhoto && fs.existsSync(user.citizenshipPhoto)) {
            fs.unlinkSync(user.citizenshipPhoto);
          }
        }
      }
  
      // Update user
      const updatedUser = await prisma.users.update({
        where: { user_id: parseInt(user_id) },
        data: updateData
      });
  
      // Remove sensitive information before sending
      const { password: userPassword, ...userWithoutPassword } = updatedUser;
  
      return res.status(200).json({
        message: "User updated successfully.",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: "Internal server error." });
    }
  };

// Delete user
const deleteUser = async (req, res) => {
    const { user_id } = req.params;

    try {
        // Verify user exists
        const user = await prisma.users.findUnique({
            where: { user_id: parseInt(user_id) }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Delete user's profile picture and citizenship photo if they exist
        if (user.profilePicture && fs.existsSync(user.profilePicture)) {
            fs.unlinkSync(user.profilePicture);
        }
        if (user.citizenshipPhoto && fs.existsSync(user.citizenshipPhoto)) {
            fs.unlinkSync(user.citizenshipPhoto);
        }

        // Delete user
        await prisma.users.delete({
            where: { user_id: parseInt(user_id) }
        });

        return res.status(200).json({
            message: "User deleted successfully."
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};


// Get users by municipality and ward number
const getUsersByLocation = async (req, res) => {
    try {
        const { municipality, wardNumber } = req.query;
        
        // Validate inputs
        if (!municipality || !wardNumber) {
            return res.status(400).json({ 
                error: "Both municipality and wardNumber are required query parameters." 
            });
        }

        // Convert wardNumber to integer
        const wardNum = parseInt(wardNumber);
        
        if (isNaN(wardNum)) {
            return res.status(400).json({ error: "Ward number must be a valid integer." });
        }

        // Query users with matching municipality and ward number
        const users = await prisma.users.findMany({
            where: {
                municipality: municipality,
                wardNumber: wardNum
            },
            select: {
                user_id: true,
                user_name: true,
                user_email: true,
                contact: true,
                role: true,
                municipality: true,
                wardNumber: true,
                profilePicture: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                // Exclude password and other sensitive fields
            }
        });

        return res.status(200).json({
            message: "Users retrieved successfully.",
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Get users by location error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// Get current user's data
const getCurrentUser = async (req, res) => {
    try {
        // Assuming req.user contains the authenticated user's ID (set by auth middleware)

        console.log(req.user)
        const userId = req.user.id;
        
        const user = await prisma.users.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                user_name: true,
                user_email: true,
                contact: true,
                role: true,
                municipality: true,
                wardNumber: true,
                profilePicture: true,
                citizenshipPhoto: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                // Exclude password and other sensitive fields
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({
            message: "User retrieved successfully.",
            user: user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// Get users with municipality filtering for admin users
const getUsers = async (req, res) => {
    try {
        const { municipality, wardNumber, role, isVerified, isActive } = req.query;
        
        // Build filter conditions
        const whereCondition = {};
        
        // Apply filters if provided
        if (municipality) whereCondition.municipality = municipality;
        if (wardNumber) whereCondition.wardNumber = parseInt(wardNumber);
        if (role) whereCondition.role = role;
        if (isVerified !== undefined) whereCondition.isVerified = isVerified === 'true';
        if (isActive !== undefined) whereCondition.isActive = isActive === 'true';

        // Get users based on filters
        const users = await prisma.users.findMany({
            where: whereCondition,
            select: {
                user_id: true,
                user_name: true,
                user_email: true,
                contact: true,
                role: true,
                municipality: true,
                wardNumber: true,
                profilePicture: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                // Exclude password and other sensitive fields
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            message: "Users retrieved successfully.",
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// Get users for municipality admin - only shows users in their jurisdiction
const getMunicipalityUsers = async (req, res) => {
    try {
        // Assuming req.user contains the authenticated user's data (set by auth middleware)
        const { municipality, wardNumber, role } = req.user;
        
        // Municipality admin should only see users in their jurisdiction
        if (role !== 'MUNICIPALITY') {
            return res.status(403).json({ 
                error: "Access denied. Only municipality admins can access this endpoint." 
            });
        }

        // Query users with the same municipality and ward number
        const users = await prisma.users.findMany({
            where: {
                municipality: municipality,
                wardNumber: wardNumber
            },
            select: {
                user_id: true,
                user_name: true,
                user_email: true,
                contact: true,
                role: true,
                municipality: true,
                wardNumber: true,
                profilePicture: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                // Exclude password and other sensitive fields
            }
        });

        return res.status(200).json({
            message: "Users in your jurisdiction retrieved successfully.",
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Get municipality users error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    loginUser, 
    signupUser,
    updateUser,
    deleteUser,
    uploadFields,
    getUsersByLocation,
    getCurrentUser,
    getUsers,
    getMunicipalityUsers
};
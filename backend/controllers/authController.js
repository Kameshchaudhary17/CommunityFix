const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
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
    { name: 'citizenshipPhoto', maxCount: 5 }
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
            where: { user_email }
        });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if account is verified
        if (user.isVerified === "PENDING") {
            return res.status(403).json({ error: "Your account is pending verification. Please wait for approval." });
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
        const { password: _, otp, otp_expiry, ...userWithoutSensitiveData } = user;

        // User authenticated
        return res.status(200).json({
            message: "User logged in successfully.",
            user: userWithoutSensitiveData,
            token
        });
    } catch (error) {
        console.error("Login error:", error);
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
            wardNumber,
            dob
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
        let citizenshipPhoto = [];

        if (req.files) {
          if (req.files.profilePicture && req.files.profilePicture[0]) {
              profilePicture = req.files.profilePicture[0].path.replace(/^storage[\\/]/, '');
          }
          
          // Handle multiple citizenship photos
          if (req.files.citizenshipPhoto && req.files.citizenshipPhoto.length > 0) {
              citizenshipPhoto = req.files.citizenshipPhoto.map(file => 
                  file.path.replace(/^storage[\\/]/, '')
              );
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
            citizenshipPhoto: citizenshipPhoto.length > 0 ? JSON.stringify(citizenshipPhoto) : null,
            dob: dob ? new Date(dob) : null,
            isVerified: "PENDING",
        };

        // Add role-specific settings
        if (role === 'MUNICIPALITY') {
            // Validate municipality-specific fields
            if (!municipality || !wardNumber) {
                return res.status(400).json({ error: "Municipality and ward number are required for municipality accounts." });
            }
            userData.isVerified = "ACCEPT"; // Automatically accept municipality accounts
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

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
      from: `"Community Fix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
  };

  await transporter.sendMail(mailOptions);
};

const sendResetOTP = async (req, res) => {
  const { user_email } = req.body;

  if (!user_email) {
      return res.status(400).json({ error: "Email is required." });
  }

  try {
      const user = await prisma.users.findFirst({ where: { user_email } });

      if (!user) {
          return res.status(404).json({ error: "User not found." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const otp_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      await prisma.users.update({
          where: { user_id: user.user_id },
          data: { otp, otp_expiry }
      });

      // Send OTP email
      const subject = "Password Reset OTP - Community Fix";
      const message = `Hello ${user.user_name},\n\nYour OTP for password reset is: ${otp}\nIt will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n- Community Fix Team`;

      await sendEmail(user_email, subject, message);

      res.status(200).json({ message: "OTP has been sent to your email." });
  } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ error: "Internal server error." });
  }
};

const verifyOTP = async (req, res) => {
  const { user_email, otp } = req.body;
  
  try {
    const user = await prisma.users.findFirst({ 
      where: { user_email } 
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Check if OTP matches and is not expired
    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }
    
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: "OTP has expired." });
    }
    
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const resetPassword = async (req, res) => {
  const { user_email, otp, new_password } = req.body;
  
  try {
    const user = await prisma.users.findFirst({ 
      where: { user_email } 
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Verify OTP again as a security measure
    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }
    
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: "OTP has expired." });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password and clear OTP
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { 
        password: hashedPassword,
        otp: null,
        otp_expiry: null
      }
    });
    
    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
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
          dob,
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
      if (dob) updateData.dob = new Date(dob);
      
      // If password is provided, hash it
      if (password) {
          const salt = await bcrypt.genSalt(10);
          updateData.password = await bcrypt.hash(password, salt);
      }
      
      // Handle file uploads
      if (req.files) {
          // Handle profile picture upload
          if (req.files.photo && req.files.photo[0]) {
              // Remove "storage/" prefix from path
              updateData.profilePicture = req.files.photo[0].path.replace(/^storage[\\/]/, '');
              
              // Delete old profile picture if it exists
              if (user.profilePicture && fs.existsSync('storage/' + user.profilePicture)) {
                  fs.unlinkSync('storage/' + user.profilePicture);
              }
          } else if (req.files.profilePicture && req.files.profilePicture[0]) {
              updateData.profilePicture = req.files.profilePicture[0].path.replace(/^storage[\\/]/, '');
              
              // Delete old profile picture if it exists
              if (user.profilePicture && fs.existsSync('storage/' + user.profilePicture)) {
                  fs.unlinkSync('storage/' + user.profilePicture);
              }
          }
          
          // Handle citizenship photo uploads (now handling multiple)
          if (req.files.citizenshipPhoto && req.files.citizenshipPhoto.length > 0) {
              // Get paths of all citizenship photos
              const citizenshipPhotoPaths = req.files.citizenshipPhoto.map(file => 
                  file.path.replace(/^storage[\\/]/, '')
              );
              
              // Delete old citizenship photos if they exist
              if (user.citizenshipPhoto) {
                  // Handle both string (old format) and array (new format)
                  const oldPaths = Array.isArray(user.citizenshipPhoto) 
                      ? user.citizenshipPhoto 
                      : [user.citizenshipPhoto];
                  
                  oldPaths.forEach(path => {
                      if (path && fs.existsSync('storage/' + path)) {
                          fs.unlinkSync('storage/' + path);
                      }
                  });
              }
              
              // Save new citizenship photo paths as array
              updateData.citizenshipPhoto = citizenshipPhotoPaths;
          }
      }
      
      // Update user
      const updatedUser = await prisma.users.update({
          where: { user_id: parseInt(user_id) },
          data: updateData
      });
      
      // Remove sensitive information before sending
      const { password: userPassword, ...userWithoutPassword } = updatedUser;
      
      // Process citizenship photos to ensure consistent format for response
      const processedUser = {
          ...userWithoutPassword,
          citizenshipPhoto: Array.isArray(userWithoutPassword.citizenshipPhoto) ? 
              userWithoutPassword.citizenshipPhoto : 
              userWithoutPassword.citizenshipPhoto ? [userWithoutPassword.citizenshipPhoto] : []
      };
      
      return res.status(200).json({
          message: "User updated successfully.",
          user: processedUser
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
        const userId = req.user?.id;
    
        console.log("User ID:", userId);
    
        // Fetch user details to get municipality and wardNumber
        const user = await prisma.users.findUnique({
          where: { user_id: userId },
          select: {
            municipality: true,
            wardNumber: true
          }
        });
    
        console.log("User Details:", user);
    
        if (!user || !user.municipality || user.wardNumber === null) {
          return res.status(403).json({ message: 'Access denied: Municipality and Ward Number are required' });
        }
    
        // Fetch users based on the user's municipality and wardNumber
        const users = await prisma.users.findMany({
          where: {
            municipality: user.municipality,
            wardNumber: user.wardNumber
          },
          include: {
            user: {
              select: {
                user_name: true,
                user_email: true
              }
            }
          }
        });
    
        return res.status(200).json({ users });
      } catch (error) {
        console.error('Fetch users error:', error);
        return res.status(500).json({ error: "Internal server error." });
      }
    };
    

// Get current user's data
const getCurrentUser = async (req, res) => {
  try {
      // Assuming req.user contains the authenticated user's ID (set by auth middleware)
      console.log(req.user);
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
              citizenshipPhoto: true, // This will now be an array or JSON
              dob: true,
              isVerified: true,
              isActive: true,
              createdAt: true,
              // Exclude password and other sensitive fields
          }
      });
      
      if (!user) {
          return res.status(404).json({ error: "User not found." });
      }
      
      // Process citizenship photos to ensure consistent format
      // If it's a string (old format), convert to array for frontend consistency
      const processedUser = {
          ...user,
          citizenshipPhoto: Array.isArray(user.citizenshipPhoto) ? 
              user.citizenshipPhoto : 
              user.citizenshipPhoto ? [user.citizenshipPhoto] : []
      };
      
      return res.status(200).json({
          message: "User retrieved successfully.",
          user: processedUser
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
      const { id, role } = req.user;
      console.log(id, role);
      
      // Municipality admin should only see users in their jurisdiction
      if (role !== 'MUNICIPALITY') {
          return res.status(403).json({
              error: "Access denied. Only municipality admins can access this endpoint."
          });
      }
      
      // Get municipality details of the logged-in admin
      const municipalitydetails = await prisma.users.findUnique({
          where: { user_id: id },
          select: { municipality: true, wardNumber: true }
      });
      
      if (!municipalitydetails) {
          return res.status(404).json({ error: "Municipality details not found." });
      }
      
      // Query users with the same municipality and ward number, only if role is USER
      let users = await prisma.users.findMany({
          where: {
              municipality: municipalitydetails.municipality,
              wardNumber: municipalitydetails.wardNumber,
              role: "USER" // ✅ Ensure only users with role "USER" are retrieved
          },
          select: {
              user_id: true,
              user_name: true,
              user_email: true,
              contact: true,
              role: true,
              dob: true,
              municipality: true,
              wardNumber: true,
              profilePicture: true,
              isVerified: true,
              isActive: true,
              createdAt: true,
              citizenshipPhoto: true
          }
      });
      
      // Process users to ensure citizenshipPhoto is consistently an array
      users = users.map(user => ({
          ...user,
          citizenshipPhoto: Array.isArray(user.citizenshipPhoto) ? 
              user.citizenshipPhoto : 
              user.citizenshipPhoto ? [user.citizenshipPhoto] : []
      }));
      
      return res.status(200).json({
          message: "Users in your jurisdiction retrieved successfully.",
          count: users.length,
          users
      });
  } catch (error) {
      console.error('Get municipality users error:', error);
      return res.status(500).json({ error: "Internal server error." });
  }
};

const sendVerificationNotification = async (userEmail, status) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    let subject, htmlContent, textContent;
    switch(status) {
      case 'ACCEPT':
        subject = 'Your Account Has Been Approved';
        textContent = "Your account has been successfully verified and approved. You now have full access.";
        htmlContent = `
          <h1>Account Approved</h1>
          <p>Your account has been successfully verified and approved.</p>
          <p>Thank you for your patience.</p>
        `;
        break;
      case 'REJECT':
        subject = 'Your Account Verification Was Unsuccessful';
        textContent = "Your account verification was not approved. Please contact support for details.";
        htmlContent = `
          <h1>Verification Unsuccessful</h1>
          <p>Your account verification was not approved.</p>
          <p>Please contact our support team for guidance.</p>
        `;
        break;
      case 'PENDING':
        subject = 'Your Account Verification is Pending';
        textContent = "Your verification status is pending. Our team will review your application soon.";
        htmlContent = `
          <h1>Verification Pending</h1>
          <p>Your account verification status has been updated to pending.</p>
        `;
        break;
      default:
        subject = 'Important: Account Status Update';
        textContent = "There has been an update to your account status. Please check your account for details.";
        htmlContent = `
          <h1>Account Update</h1>
          <p>Please log in to your account for more details.</p>
        `;
    }

    console.log(`Sending email to ${userEmail} using ${process.env.EMAIL_USER}`);

    const info = await transporter.sendMail({
      from: `"Municipality Verification Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      text: textContent, // Plain text version
      html: htmlContent  // HTML version
    });

    console.log(`Email sent to ${userEmail}. Status: ${status}`);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return null;
  }
};

// Your existing controller
const updateVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Convert userId to integer
    const userIdInt = parseInt(userId, 10);
    
    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'User ID must be a valid number' });
    }
    
    // Validate status
    const validStatuses = ['PENDING', 'ACCEPT', 'REJECT'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Status must be PENDING, ACCEPT, or REJECT'
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { user_id: userIdInt }
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user verification status
    const updatedUser = await prisma.users.update({
      where: { user_id: userIdInt },
      data: { isVerified: status },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        municipality: true,
        wardNumber: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive information like password, OTP, etc.
      }
    });
    
    // Send notification based on status change
    await sendVerificationNotification(existingUser.user_email, status);
    
    return res.status(200).json({
      message: `User verification status updated to ${status}`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user verification status:', error);
    return res.status(500).json({
      message: 'An error occurred while updating user verification status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getMunicipality = async (req, res) => {
    try {
      // Query all users with role MUNICIPALITY
      const municipalityUsers = await prisma.users.findMany({
        where: {
          role: 'MUNICIPALITY'
        },
        select: {
          user_id: true,
          user_name: true,
          user_email: true,
          contact: true,
          municipality: true,
          wardNumber: true,
          profilePicture: true,
          citizenshipPhoto: true,
          dob: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          // Excluding password for security
        }
      });
  
      // Check if any municipality users exist
      if (municipalityUsers.length === 0) {
        return res.status(200).json({
          message: "No municipality accounts found.",
          data: []
        });
      }
  
      // Send the response with municipality users
      res.status(200).json({
        message: "Municipality accounts retrieved successfully.",
        count: municipalityUsers.length,
        data: municipalityUsers
      });
      
    } catch (error) {
      console.error('Error fetching municipality users:', error);
      res.status(500).json({ error: "Internal server error." });
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
    getMunicipalityUsers,
    getMunicipality,
    updateVerificationStatus,
    sendResetOTP,
    verifyOTP,
    resetPassword
};
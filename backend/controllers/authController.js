const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const {notificationService} = require('../services/notificationService')
const { multer, storage } = require('../middleware/fileMiddleware');
const fs = require('fs');
const path = require('path');

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
    { name: 'citizenshipPhoto', maxCount: 2 }
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
            process.env.JWT_SECRET,
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

      // Check if municipality and ward exist if provided
      if (municipality && wardNumber) {
          const municipalityExists = await prisma.users.findFirst({
              where: {
                  role: 'MUNICIPALITY',
                  municipality: municipality,
                  wardNumber: wardNum,
                  isVerified: 'ACCEPT' // Only consider verified municipality accounts
              }
          });

          if (!municipalityExists && role === 'USER') {
              // Find the municipality admin to notify
              const municipalityAdmin = await prisma.users.findFirst({
                  where: {
                      role: 'MUNICIPALITY',
                      municipality: municipality,
                      isVerified: 'ACCEPT'
                  }
              });
              
              // If there's a municipality admin, send them a notification using the service
              if (municipalityAdmin) {
                  try {
                      // FIXED: Direct database insertion for WARD_REQUEST (not in enum)
                      await prisma.notification.create({
                          data: {
                              userId: municipalityAdmin.user_id,
                              content: `A user tried to register for Ward ${wardNum} in ${municipality} which doesn't exist in our records.`,
                              type: "NEW_REPORT", // Using valid enum value from schema
                          }
                      });
                  } catch (notificationError) {
                      console.error('Failed to create notification:', notificationError);
                      // Continue processing, don't throw error
                  }
              }
              
              return res.status(400).json({ 
                  error: `This ward (${wardNum}) and municipality (${municipality}) combination doesn't exist. You cannot register for this location.` 
              });
          }
      }

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

      // Send notification to municipality admin if a regular user registers
      if (role === 'USER' && municipality && wardNum) {
          try {
              // Find the municipality admin for the user's ward
              const municipalityAdmin = await prisma.users.findFirst({
                  where: {
                      role: 'MUNICIPALITY',
                      municipality: municipality,
                      wardNumber: wardNum,
                      isVerified: 'ACCEPT'
                  }
              });

              // If we found the specific ward admin
              if (municipalityAdmin) {
                  // FIXED: Direct database insertion instead of service
                  await prisma.notification.create({
                      data: {
                          userId: municipalityAdmin.user_id,
                          content: `${user_name} has registered as a new user in your ward (Ward ${wardNum}, ${municipality}).`,
                          type: "NEW_REPORT", // Using valid enum value from schema
                      }
                  });
              } else {
                  // If no specific ward admin, try to find any admin for this municipality
                  const generalMunicipalityAdmin = await prisma.users.findFirst({
                      where: {
                          role: 'MUNICIPALITY',
                          municipality: municipality,
                          isVerified: 'ACCEPT'
                      }
                  });

                  if (generalMunicipalityAdmin) {
                      // FIXED: Direct database insertion
                      await prisma.notification.create({
                          data: {
                              userId: generalMunicipalityAdmin.user_id,
                              content: `${user_name} has registered as a new user in Ward ${wardNum}, ${municipality}.`,
                              type: "NEW_REPORT", // Using valid enum value from schema
                          }
                      });
                  }
              }
              
              // ADDED: Welcome notification for the new user
              await prisma.notification.create({
                  data: {
                      userId: newUser.user_id,
                      content: `Welcome to the platform, ${user_name}! Your account has been successfully created.`,
                      type: "ACCOUNT_VERIFIED", // Using valid enum value from schema
                  }
              });
              
          } catch (notificationError) {
              console.error('Failed to send notification on signup:', notificationError.message);
              // Continue processing, don't throw error
          }
      }

      // Remove sensitive information before sending
      const userWithoutPassword = {...newUser};
      delete userWithoutPassword.password;

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


const sendEmail = async (to, subject, text, htmlContent) => {
  // Create reusable transporter with proper configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    dkim: process.env.DKIM_OPTIONS ? JSON.parse(process.env.DKIM_OPTIONS) : undefined,
    secure: true,
    tls: {
      rejectUnauthorized: true
    }
  });

  const mailOptions = {
    from: {
      name: 'Community Fix',
      address: process.env.EMAIL_USER
    },
    to,
    subject,
 
    text,
    html: htmlContent || `<div style="font-family: Arial, sans-serif; line-height: 1.5;">${text.replace(/\n/g, '<br>')}</div>`,
    headers: {
      'X-Priority': '3', 
      'X-MSMail-Priority': 'Normal',
      'X-Mailer': 'Community Fix Mailer',
      'List-Unsubscribe': `<mailto:unsubscribe@${process.env.EMAIL_DOMAIN || 'yourdomain.com'}?subject=unsubscribe>`
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
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
    if (user.profilePicture) {
      const fullPath = path.join('storage', user.profilePicture);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (fileError) {
          console.error('Error deleting profile picture:', fileError);
          // Continue with deletion even if file removal fails
        }
      }
    }
    
    if (user.citizenshipPhoto) {
      // Handle JSON array of citizenship photos
      const photos = JSON.parse(user.citizenshipPhoto);
      for (const photo of photos) {
        const fullPath = path.join('storage', photo);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (fileError) {
            console.error('Error deleting citizenship photo:', fileError);
            // Continue with deletion even if file removal fails
          }
        }
      }
    }
    
    // Try to send notification but don't let it block the user deletion
    if (user.user_email) {
      try {
        await sendAccountDeletionNotification(user.user_email);
      } catch (emailError) {
        console.error('Failed to send deletion notification:', emailError);
        // Continue with user deletion even if email fails
      }
    }
    
    // Delete all related records first to avoid foreign key constraint errors
    // Corrected based on your actual schema model names

    // Delete user's upvotes
    await prisma.upvote.deleteMany({
      where: { userId: parseInt(user_id) }
    });

    // Delete user's notifications
    await prisma.notification.deleteMany({
      where: { userId: parseInt(user_id) }
    });

    // Delete user's comments
    await prisma.comment.deleteMany({
      where: { userId: parseInt(user_id) }
    });

    // Delete user's suggestions
    await prisma.suggestion.deleteMany({
      where: { userId: parseInt(user_id) }
    });

    // Delete user's reports
    await prisma.reports.deleteMany({
      where: { user_id: parseInt(user_id) }
    });
    
    // Now delete the user
    await prisma.users.delete({
      where: { user_id: parseInt(user_id) }
    });
    
    return res.status(200).json({
      message: "User deleted successfully."
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      error: "Internal server error.",
      details: error.message,
      code: error.code 
    });
  }
};

const sendAccountDeletionNotification = async (userEmail) => {
  if (!userEmail) {
    console.error('Cannot send email: No email address provided');
    throw new Error('Email address is required');
  }

  // Validate email environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Email configuration missing: Check EMAIL_USER and EMAIL_PASSWORD environment variables');
    throw new Error('Email configuration missing');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  const subject = 'Your Account Has Been Deleted';
  const textContent = "Your account has been deleted from our system. If you did not request this action, please contact our support team immediately.";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #d32f2f;">Account Deleted</h2>
      <p>Your account has been deleted from our system.</p>
      <p style="font-weight: bold;">If you did not request this action, please contact our support team immediately.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #777; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
  
  console.log(`Attempting to send account deletion notification to ${userEmail}`);
  
  try {
    const info = await transporter.sendMail({
      from: {
        name: 'Municipality Support Team',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
        'X-MSmail-Priority': 'High'
      }
    });
    
    console.log(`Account deletion notification sent to ${userEmail}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error);
    throw error; // Re-throw the error so the calling function can handle it
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

const sendVerificationNotification = async (userEmail, status, userName = '') => {
  try {
    // Use more robust configuration for email delivery
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      // Security options
      secure: true,
      tls: {
        // Do not disable certificate validation in production
        rejectUnauthorized: true
      }
    });
      
    let subject, htmlContent, textContent;
      
    // Personalize email with user's name if available
    const greeting = userName ? `Hello ${userName},` : 'Hello,';
      
    switch(status) {
      case 'ACCEPT':
        subject = 'Your Account Has Been Approved - Municipality Services';
        textContent = `${greeting} Your account has been successfully verified and approved. You now have full access to all services.`;
        htmlContent = getEmailTemplate('ACCEPT', userName);
        break;
      case 'REJECT':
        subject = 'Your Account Verification Was Unsuccessful - Municipality Services';
        textContent = `${greeting} Your account verification was not approved. Please contact support for more details.`;
        htmlContent = getEmailTemplate('REJECT', userName);
        break;
      case 'PENDING':
        subject = 'Your Account Verification is Pending - Municipality Services';
        textContent = `${greeting} Your verification status is pending. Our team will review your application soon.`;
        htmlContent = getEmailTemplate('PENDING', userName);
        break;
      default:
        subject = 'Important: Account Status Update - Municipality Services';
        textContent = `${greeting} There has been an update to your account status. Please check your account for details.`;
        htmlContent = getEmailTemplate('DEFAULT', userName);
    }
      
    console.log(`Sending email to ${userEmail} using ${process.env.EMAIL_USER}`);
      
    // Use proper email structure with appropriate headers
    const mailOptions = {
      from: {
        name: 'Municipality Services',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      // Avoid using "urgent" or "priority" headers as they can trigger spam filters
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
        // Add DKIM and SPF records to your domain for better deliverability
      }
    };
      
    const info = await transporter.sendMail(mailOptions);
      
    console.log(`Email sent to ${userEmail}. Status: ${status}, MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return null;
  }
};

function getEmailTemplate(status, userName = '') {
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  
  // Updated base style to be more spam-filter friendly
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  `;
  
  const footer = `
      <p style="margin-top: 30px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
        If you did not create an account with us, please disregard this email.
      </p>
      <p style="font-size: 12px; color: #555;">
        © ${new Date().getFullYear()} Municipality Services
      </p>
      <p style="font-size: 12px; color: #777;">
        You received this email because you registered for an account with Municipality Services.
        <br>
        To unsubscribe from these notifications, please <a href="mailto:${process.env.EMAIL_USER}?subject=unsubscribe" style="color: #1976d2;">click here</a>.
      </p>
    </div>
  `;
  
  switch(status) {
    case 'ACCEPT':
      return `${baseStyle}
        <h1 style="color: #2e7d32;">Account Approved</h1>
        <p>${greeting}</p>
        <p>Your account has been successfully verified and approved.</p>
        <p>You now have full access to all services on our platform.</p>
        <p>Thank you for your patience during the verification process.</p>
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">You can now log in to access all features.</p>
        </div>
        ${footer}`;
          
    case 'REJECT':
      return `${baseStyle}
        <h1 style="color: #c62828;">Verification Unsuccessful</h1>
        <p>${greeting}</p>
        <p>We regret to inform you that your account verification was not approved.</p>
        <p>This might be due to incomplete or incorrect documentation provided during the verification process.</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #c62828;">Please contact our support team for further guidance and to understand the next steps.</p>
        </div>
        ${footer}`;
          
    case 'PENDING':
      return `${baseStyle}
        <h1 style="color: #f57c00;">Verification Pending</h1>
        <p>${greeting}</p>
        <p>Thank you for registering with Municipality Services.</p>
        <p>Your account is currently being verified by our team. This process typically takes 1-2 business days.</p>
        <p>You will receive another email once your account has been reviewed.</p>
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #f57c00;">In the meantime, you can log in to your account with limited functionality.</p>
        </div>
        ${footer}`;
          
    default:
      return `${baseStyle}
        <h1 style="color: #1976d2;">Account Update</h1>
        <p>${greeting}</p>
        <p>There has been an update to your account status.</p>
        <p>Please log in to your account for more details.</p>
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #1976d2;">If you have any questions, please contact our support team.</p>
        </div>
        ${footer}`;
  }
}

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
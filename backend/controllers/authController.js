const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

const signupUser = async (req, res) => {
    const { 
        user_name, 
        user_email, 
        password, 
        role = 'USER', // Default to USER role
        contact,
        municipality,
        wardNumber
    } = req.body;

    // Validate input
    if (!user_name || !user_email || !password) {
        return res.status(400).json({ error: "Please provide name, email, and password." });
    }       

    try {
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

        // Prepare user data based on role
        const userData = {
            user_name,
            user_email,
            password: hash,
            role,
            contact: contact || null,
        };

        // Add role-specific fields
        if (role === 'MUNICIPALITY') {
            // Validate municipality-specific fields
            if (!municipality || !wardNumber) {
                return res.status(400).json({ error: "Municipality and ward number are required for municipality accounts." });
            }
            
            userData.municipality = municipality;
            userData.wardNumber = wardNumber;
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

module.exports = {
    loginUser, 
    signupUser,
    
};
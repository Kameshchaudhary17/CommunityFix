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
        // Find user by user_email
        const user = await prisma.users.findFirst({ where: { user_email } });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.role === "user" && !user.isVerified) {
            return res.status(403).json({ error: "Sorry, your account is not verified yet!" });
        }        

        // Check if the provided password matches the one in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password." });
        }

        // Generate a token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || "THIS_IS_MY_SECRET_KEY",  
            { expiresIn: '24h' }     
        );

        // User authenticated
        return res.status(200).json({
            message: "User logged in successfully.",
            user: user,
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const signupUser = async (req, res) => {
    const { user_name, user_email, password } = req.body;


    console.log(user_name, user_email, password)
    // Validate input
    if (!user_name || !user_email || !password) {
        return res.status(400).json({ error: "Please provide name, email, and password." });
    }       

    try {
        // Check if user already exists
        const oldUser = await prisma.users.findFirst({ where: { user_email } });

        
        if (oldUser) {
            return res.status(409).json({ error: "User already exists with this email." });
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // Create new user
        const newUser = await prisma.users.create({
            data: {
              user_name,
              user_email,
              password: hash
            }
          });      

        // Send the response back
        res.status(201).json({
            message: "User successfully registered.",
            user: { id: newUser.id, user_name: newUser.user_name, user_email: newUser.user_email },
           
        });

        

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    loginUser, 
    signupUser
}
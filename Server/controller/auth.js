import bcrypt from 'bcryptjs';
import User from'./models/user.js'; // Import User model
import sequelize from'./config/db.js'; // Import Sequelize instance
const jwt = require('jsonwebtoken');


const seedMainAdmin = async () => {
    try {
        // Sync the database (creates tables if not exists)
        await sequelize.sync({ alter: true });
    
    
        const adminEmail = 'admin@example.com';
        const adminPassword = 'secureAdminPassword123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: adminEmail, role: 'main_admin' } });

        if (existingAdmin) {
            console.log('Main admin already exists:', existingAdmin.email);
            return;
        }

        // Hash the admin password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create the admin user
        await User.create({
            name: 'Main Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'main_admin'
        });

        console.log('Main admin created successfully!');
    } catch (error) {
        console.error('Error seeding main admin:', error.message);
    } finally {
        process.exit();
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: "Please enter all the details." });
    }

    try {
        // Find user by email
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
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
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Please provide name, email, and password." });
    }

    try {
        // Check if user already exists
        const oldUser = await User.findOne({ where: { email } });
        if (oldUser) {
            return res.status(409).json({ error: "User already exists with this email." });
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password: hash
        });

        // Create token
        const token = jwt.sign(
            { userId: newUser.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send the response back
        res.status(201).json({
            message: "User successfully registered.",
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
            token
        });

    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
};

// Run the seed script
seedMainAdmin();


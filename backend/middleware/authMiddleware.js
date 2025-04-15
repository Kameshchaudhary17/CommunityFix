const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    console.log("Authorization Header:", req.headers.authorization);
    
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No valid token provided." });
    }
    
    const token = req.headers.authorization.split(" ")[1];
    console.log("Extracted Token:", token);
    
    try {
        // Use the environment variable here instead of hardcoding
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token." });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log("User Role:", req.user?.role);
        console.log("Allowed Roles:", roles);
        
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: "Forbidden: You do not have permission." });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRoles };
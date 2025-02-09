const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next) {
    try {
        // ✅ Extract token from headers
        const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

        if (!token) {
            return res.status(403).json({ message: "Unauthorized: No token provided" });
        }

        // ✅ Verify JWT token
        const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD);

        // ✅ If token is valid, attach userId to request
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error("❌ JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

module.exports = { adminMiddleware };

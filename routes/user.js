const { Router } = require("express");
const { userModel, purchaseModel, courseModel } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");
const { userMiddleware } = require("../middleware/user");

const userRouter = Router();

// ✅ User Signup
userRouter.post("/signup", async function (req, res) {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        await userModel.create({ email, password, firstName, lastName });

        res.json({ message: "Signup succeeded" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ User Signin
userRouter.post("/signin", async function (req, res) {
    try {
        const { email, password } = req.body;

        // Find user in database
        const user = await userModel.findOne({ email, password });

        if (user) {
            // Generate JWT token
            const token = jwt.sign({ id: user._id }, JWT_USER_PASSWORD, { expiresIn: "1h" });

            res.json({ token });
        } else {
            res.status(403).json({ message: "Incorrect credentials" });
        }
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Purchase a Course
userRouter.post("/purchase", userMiddleware, async function (req, res) {
    try {
        const userId = req.userId;
        const { courseId } = req.body;

        // Check if course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if user already purchased the course
        const existingPurchase = await purchaseModel.findOne({ userId, courseId });
        if (existingPurchase) {
            return res.status(400).json({ message: "You have already purchased this course" });
        }

        // Save purchase in database
        await purchaseModel.create({ userId, courseId });

        res.json({ message: "You have successfully bought the course" });
    } catch (error) {
        console.error("Purchase error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Get Purchased Courses
userRouter.get("/purchases", userMiddleware, async function (req, res) {
    try {
        const userId = req.userId;

        // Get all purchase records for the user
        const purchases = await purchaseModel.find({ userId });

        if (!purchases.length) {
            return res.status(404).json({ message: "No purchases found" });
        }

        // Extract purchased course IDs
        const purchasedCourseIds = purchases.map(purchase => purchase.courseId);

        // Retrieve course details
        const coursesData = await courseModel.find({ _id: { $in: purchasedCourseIds } });

        res.json({
            message: "Purchased courses retrieved",
            purchases: coursesData.map(course => ({
                title: course.title,
                description: course.description,
                price: course.price
            }))
        });
    } catch (error) {
        console.error("Purchase retrieval error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = { userRouter };

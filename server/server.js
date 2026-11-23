import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import mediaRouter from "./routes/mediaRoutes.js";
import albumRouter from "./routes/albumRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

//Connect Database
connectDB();

// API Routes
app.get("/", (_req, res) => {
    res.send("Server is running");
});
app.use("/api/auth", authRouter);
app.use("/api/media", mediaRouter);
app.use("/api/albums", albumRouter);


// Error-handling middleware
app.use((error, _req, res, _next) => {
    console.error(error);

    res.status(500).json({
        message: error.message || "Internal Server Error!",
    });
});

// Server Port
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servier is running at port ${port}`);
})
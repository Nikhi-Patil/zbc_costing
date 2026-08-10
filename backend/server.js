import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/api/test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS test");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/plant", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id,plant_name,unit FROM plant_master");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
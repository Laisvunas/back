const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const diagramRoutes = require("./routes/diagrams");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send({msg: "Server is running successfully"}); 
});

app.use("/auth", authRoutes);
app.use("/diagrams", diagramRoutes);

app.all("*", (req, res) => {
    res.status(404).send({ error: "Page not found" });
});

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Listening on port ${port}`));
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1
app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (req.body.password.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const createUserQuery = `
    INSERT INTO user (username, name, password, gender, location)
    VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}")`;
      const dbUserId = await db.run(createUserQuery);
      const userId = dbUserId.lastId;
      res.status(200);
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});
// API 2

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    res.status = 400;
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length > 5) {
        const encryptedPassword = await bcrypt.hash(req.body.newPassword, 10);

        const updatePasswordQuery = `
        UPDATE user SET password = '${encryptedPassword}' WHERE username = '${username}'`;
        await db.run(updatePasswordQuery);
        res.send("Password updated");
      } else {
        res.status = 400;
        res.send("Password is too short");
      }
    } else {
      res.status(400);
      res.send("Invalid current password");
    }
  } else {
    res.status = 400;
    res.send("Invalid user");
  }
});

module.exports = app;

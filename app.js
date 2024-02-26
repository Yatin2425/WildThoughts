import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import guid from "guid";
import bcrypt from "bcrypt";
import env from "dotenv";


const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
const saltRounds = 10
env.config();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const dbConfig = {
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
};
const { Pool } = pg;

const db = new Pool(dbConfig);

app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/modify", (req, res) => {
  res.render("modify.ejs");
});

app.get("/postdelete/:id", async (req, res) => {
  let client = null;
  try {
    const pId = req.params.id;
    const query = "DELETE FROM Posts WHERE postid = $1";
    const values = [pId];
    client = await db.connect();
    const result = await client.query(query, values);
    res.redirect("/view");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post" });
  } finally {
    if (client) {
      client.release();
    }
  }
});


app.get("/modify/:id", async (req, res) => {
  let client = null;
  try {
    const pId = req.params.id; // Use req.params.id to get the value of :id from the URL
    const query =
      "SELECT blogtitle, blogcontent, postid FROM Posts WHERE postid = $1";
    console.log(pId);
    const values = [pId];
    const client = await db.connect();
    const result = await client.query(query, values);
    const posts = result.rows;
    console.log(posts);

    res.render("modify.ejs", { posts: posts }); // Use the correct variable 'posts'
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({ message: "Error fetching post data" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/homepage", (req, res) => {
  res.render("homepage.ejs");
});

app.get("/post", (req, res) => {
  res.render("post.ejs");
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});


app.get("/view", async (req, res) => {
  let client = null;
  try {
    const query =
      "SELECT blogtitle , blogcontent , postid FROM Posts where blogcontent is not null";
    client = await db.connect();
    const result = await client.query(query);
    const posts = result.rows;
    res.render("view.ejs", { posts: posts });
  } catch {
    res.status(500).json({ message: "Error fetching posts" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.InputEmail;
  const username = req.body.InputUsername;
  const password = req.body.InputPassword;
  const idObject = guid.create();
  const userId = idObject.value;
  let client = null;

  try {
    const query = "SELECT * FROM userinfo WHERE useremail = $1";
    const insertQuery = "INSERT INTO userinfo (userid, useremail, username, userhash) VALUES ($1, $2, $3, $4)";

    client = await db.connect();
    const result = await client.query(query, [email]);

    if (result.rows.length > 0) {
      res.send("User already exists!");
      // Later, you can redirect to the login page with a prompt.
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
      const values = [userId, email, username, hash];
      await client.query(insertQuery, values);
      res.redirect("/homepage"); // Provide the correct route path or render homepage.ejs
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});


app.post("/", (req, res) => {
  res.redirect("/handle-login");
});

app.post("/handle-login", async (req, res) => {
  let client = null;

  try {
    const username = req.body.InputUsername;
    const password = req.body.InputPassword;

    const query = "SELECT * FROM UserInfo WHERE username = $1";
    const values = [username];

    client = await db.connect(); // Establish database connection

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.userhash);

      if (passwordMatch) {
        res.redirect("/homepage");
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("User not found!");
    }

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  } finally {
    if (client) {
      client.release();
    }
  }
});


app.post("/handle-post", async (req, res) => {
  let client = null;
  try {
    const { blogTitle, blogContent } = req.body;
    const idObject = guid.create();
    const idValue = idObject.value;

    // Assuming you have a 'posts' table in your database
    const query =
      "INSERT INTO Posts (postid , blogtitle, blogcontent) VALUES ($1, $2, $3 )";
    const values = [idValue, blogTitle, blogContent];

    client = await db.connect(); // Establish database connection

    const result = await client.query(query, values);

    // Release the client back to the pool

    res.redirect("/view");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  } finally {
    // Ensure that the client is always released or closed, even in case of an error
    if (client) {
      client.release();
    }
  }
});

app.post("/postmodify/:id", async (req, res) => {
  let client = null;
  try {
    const content = req.body.blogContent; // Use req.body.blogContent to get the content from the request body
    const title = req.body.blogTitle; // Use req.body.blogTitle to get the title from the request body
    const pId = req.params.id;

    const query =
      "UPDATE Posts SET blogcontent = $1, blogtitle = $2, blogtime = NOW() WHERE postid = $3";
    const values = [content, title, pId];

    client = await db.connect();
    const result = await client.query(query, values);

    console.log(result.rows); // Assuming you want to log the result

    res.redirect("/view"); // Fix the typo in redirect method
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating post data" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.listen(port, () => {
  console.log("Listening on port 3000");
});

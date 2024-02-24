import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "WildThoughts",
  password: "10042425#yt",
  port: 5432,
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
app.post("/", (req, res) => {
  res.redirect("/handle-login");
});

app.post("/handle-login", async (req, res) => {
  let client = null;
  try {
    const email = req.body.InputEmail;
    const username = req.body.InputUsername;

    // Assuming you have a 'posts' table in your database
    const query = "INSERT INTO UserInfo (username , useremail) VALUES ($1, $2)";
    const values = [email, username];

    client = await db.connect(); // Establish database connection

    const result = await client.query(query, values);

    // Release the client back to the pool

    res.redirect("/homepage");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  } finally {
    // Ensure that the client is always released or closed, even in case of an error
    if (client) {
      client.release();
    }
  }
});

app.post("/handle-post", async (req, res) => {
  let client = null;
  try {
    const { blogTitle, blogContent } = req.body;
    const time = new Date();

    // Assuming you have a 'posts' table in your database
    const query =
      "INSERT INTO Posts (blogtitle, blogcontent, blogtime) VALUES ($1, $2, $3)";
    const values = [blogTitle, blogContent, time];

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

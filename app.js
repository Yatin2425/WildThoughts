import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import guid from "guid";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import cookieParser from "cookie-parser";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser("yatin"));

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
  res.render("homepage.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/modify", (req, res) => {
  res.render("modify.ejs");
});

app.get("/blog", (req, res) => {
  res.render("blog.ejs"); 
})

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
app.get("/blog/:id", async (req, res) => {
  let client = null;
  try {
    const pId = req.params.id; // Use req.params.id to get the value of :id from the URL
    const query =
      "SELECT blogtitle, blogcontent, postid , blogauthor , blogtime FROM Posts WHERE postid = $1";
    console.log(pId);
    const values = [pId];
    const client = await db.connect();
    const result = await client.query(query, values);
    const posts = result.rows;
    console.log(posts);

    res.render("blog.ejs", { posts: posts }); // Use the correct variable 'posts'
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
  if (req.isAuthenticated()) {
    // Assuming user is defined somewhere
    const user = { id: req.user.id, username: req.user.username };

    // Set signed cookie with user information
    res.cookie("user", user, { signed: true });

    // Redirect to another route or refresh the page to see the updated cookies
    res.render("homepage.ejs");
  } else {
    res.redirect("/");
  }
});

// Another route where you can log the signed cookie after it has been set
app.get("/checkCookie", (req, res) => {
  console.log(req.signedCookies.user);
  res.send("Check your console for the signed cookie");
});

app.get("/post", (req, res) => {
  console.log("Signed Cookies: ", req.signedCookies);
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
app.get("/profile", async (req, res) => {
  let client = null;
  try {
    // Retrieve username from signed cookie
    const username = req.signedCookies.user && req.signedCookies.user.username;
    console.log(username);

    // Check if the username is available
    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query =
      "SELECT blogtitle, blogcontent, postid FROM Posts WHERE blogcontent IS NOT NULL AND blogauthor = $1";
    const values = [username];

    // Establish database connection
    client = await db.connect();

    // Execute the database query
    const result = await client.query(query, values);

    // Retrieve posts
    const posts = result.rows;

    // Log retrieved posts
    console.log("Retrieved Posts:", posts);

    // Render the view with posts
    res.render("profile.ejs", { posts: posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  } finally {
    // Ensure that the client is always released or closed, even in case of an error
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
    const insertQuery =
      "INSERT INTO userinfo (userid, useremail, username, userhash) VALUES ($1, $2, $3, $4)";

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
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    res.redirect("/login"); // User is not authenticated, redirect to the login page
  }
}
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/homepage",
    failureRedirect: "/login",
  })
);
app.post("/handle-post", async (req, res) => {
  let client = null;

  try {
    // Retrieve blog author information from signed cookie
    const blogAuthor = req.signedCookies.user.username;

    // Ensure that the required user information is available
    if (!blogAuthor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { blogTitle, blogContent } = req.body;
    const idObject = guid.create();
    const idValue = idObject.value;

    // Assuming you have a 'posts' table in your database
    const query =
      "INSERT INTO Posts (postid, blogtitle, blogcontent, blogauthor) VALUES ($1, $2, $3, $4)";
    const values = [idValue, blogTitle, blogContent, blogAuthor];

    // Establish database connection
    client = await db.connect();

    // Execute the database query
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

    res.redirect("/profile"); // Fix the typo in redirect method
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating post data" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "InputUsername",
      passwordField: "InputPassword",
      session: true,
    },
    async function (username, password, cb) {
      try {
        const result = await db.query(
          "SELECT * FROM userinfo WHERE username = $1 ",
          [username]
        );
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.userhash;

          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.listen(port, () => {
  console.log("Listening on port 3000");
});

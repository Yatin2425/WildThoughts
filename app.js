import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(port, () => {
  console.log("Listening on port 3000");
});

app.get("/", (req, res) => {
  res.render("login.ejs");
});
app.post("/", (req, res) => {
  res.redirect("/handle-login");
});
app.post("/handle-login", (req, res) => {

  res.redirect("/homepage");

  res.render("login.ejs", {
    email: req.body.InputEmail,
    username: req.body.InputUsername,
  });
});
app.get("/modify" , (req, res) => {
    res.render("modify.ejs")
})

// i have to change this to add it to json in server
app.post("/handle-post", async (req, res) => {
  try {
    const title = req.body.blogTitle;
  
    const response = await axios.post(`${API_URL}/posts`, req.body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.redirect("/view");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});

app.get("/homepage", (req, res) => {
  res.render("homepage.ejs");
});

app.get("/post", (req, res) => {
  res.render("post.ejs");
});
//change this to get all the posts from the server
app.get("/view", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);

    res.render("view.ejs", { posts: response.data });
  } catch {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/api/posts/delete/:id", async (req, res) => {
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}`);
    res.redirect("/view");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

app.get("/modify/:id", async (req, res) => {
   
    try {
      const response = await axios.get(
        `${API_URL}/posts/${req.params.id}`
      );

      res.render("modify.ejs", { posts: response.data });
    } catch (error) {
      res.status(500).json({ message: "Error fetching post data" });
    }
});


app.post("/api/posts/:id", async (req, res) => {
    console.log("called");
    try {
        console.log("called try block");
      const response = await axios.patch(
        `${API_URL}/posts/${req.params.id}`,
        req.body
      );
      console.log(response.data);

      res.redirect("/view");
    } catch (error) {
      res.status(500).json({ message: "Error updating post" });
    }
  });




import express from 'express';
import bodyParser from 'body-parser';



const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port , () => {
    console.log("Listening on port 3000");
});

app.get("/", (req, res) => {
    res.render("login.ejs")
})
app.post("/", (req, res) => {
    res.redirect("/handle-login");
})
app.post("/handle-login", (req, res) => {
    
    console.log("Email:", req.body.InputEmail); // Log received email
    console.log("Username:", req.body.InputUsername); // Log received username
    res.redirect("/homepage");

    res.render("login.ejs" , {
        email : req.body.InputEmail,
        username : req.body.InputUsername
    }
   
    );
});
app.post("/handle-post", (req, res) => {
    const title = req.body.blogTitle;
    const content = req.body.blogContent;
    console.log("Title:", title);
    console.log("Content:", content);

    res.render("view.ejs", {
        Title: title,
        Content: content
    });
});


app.get("/homepage", (req, res) => {
    res.render("homepage.ejs")
})



app.get("/post" , (req, res) => {
    res.render("post.ejs")

});

app.get("/view", (req, res) => {
    res.render("view.ejs")

});
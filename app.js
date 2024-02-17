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
    
    console.log("Email:", req.body.InputEmail); // Log received email
    console.log("Username:", req.body.InputUsername); // Log received username

    res.render("login.ejs" , {
        email : req.body.InputEmail,
        username : req.body.InputUsername
    }
   
    );
});

app.get("/homepage", (req, res) => {
    res.render("homepage.ejs")
})
app.post("/handle-login", (req, res) => {
    res.redirect("homepage");  
  });

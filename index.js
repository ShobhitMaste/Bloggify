import express from "express";
import bodyParser from "body-parser";

import { getAuth, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, signOut, updateProfile
} from "firebase/auth";

import {
    getFirestore, collection, getDocs, addDoc, doc,
    setDoc, collectionGroup, getDoc
} from "firebase/firestore";

import { initializeApp } from "firebase/app";
import sillyname from "sillyname";

// const firebaseConfig = {
//   apiKey: "AIzaSyC8gFbOJMkfnpxZzMrIeDlpo3KsVE_Q_kI",
//   authDomain: "blog-website-by-shobhitmaste.firebaseapp.com",
//   projectId: "blog-website-by-shobhitmaste",
//   storageBucket: "blog-website-by-shobhitmaste.firebasestorage.app",
//   messagingSenderId: "73308837632",
//   appId: "1:73308837632:web:f8eb7a357d3489c0eac5e5",
//   measurementId: "G-ERZRBCJHV8"
// };

const firebaseConfig = {
    apiKey: "AIzaSyDc_Fbgbi_ZFHgNuvtF4MtUabBjSt6DAck",
    authDomain: "bloggify-shobhit-singh.firebaseapp.com",
    projectId: "bloggify-shobhit-singh",
    storageBucket: "bloggify-shobhit-singh.firebasestorage.app",
    messagingSenderId: "742810597834",
    appId: "1:742810597834:web:7358939038bfac99663733"
  };

const app = initializeApp(firebaseConfig);
const port = 3000;
const server = express();
const db = getFirestore(); //initialize firestore service


let isLogged = false;

server.use(bodyParser.urlencoded({extended:  true}));
server.use(express.static("public"));

server.get("/", (req, res) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if(user){
        let username = user.displayName;
        isLogged = true;
        res.render("index.ejs", {name: username});
    } else {
        console.log("No user is currently logged in.");
        res.render("index.ejs");
    }
});

server.get("/login", (req, res)=>{
    res.render("login.ejs");
});

server.get("/register", (req, res) => {
    res.render("register.ejs");
});

server.post("/register", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let user_name = req.body.user_name;
    console.log(email, password, user_name);
    let joinDate = getDateTime();
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, {
            displayName: user_name
        });
    })
    .then(()=>{
        //add user to database
        const userID = auth.currentUser.uid;
        const userRef = doc(db, "users", userID);
         setDoc(userRef, {
            uid: userID,
            displayName: user_name,
            joinDate
         })
         .then(()=>{
            console.log("User added to database successfully");   
         });
         return true;
    })
    .then(()=>{
        res.redirect("/login");
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        let errorString = JSON.stringify(errorMessage);
        res.render("register.ejs", {ErrorMessage: errorString});
        console.log(errorMessage);
    });
});

server.post("/login", (req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    console.log(email, password);
    const auth = getAuth();
    
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        console.log("success");
        res.redirect("/");
    
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        let errorString = JSON.stringify(errorMessage);
        res.render("login.ejs", {ErrorMessage: errorString});
        console.log(errorMessage);
    });
});

server.get("/checkLogin", (req, res)=>{
    if(isLogged){
        const auth = getAuth();
        let userID = auth.currentUser.uid;
        res.redirect("/createBlog/" + userID);
    } else {
        res.redirect("/login");
    }
});
server.get("/checkLogin2", (req, res)=>{
    if(isLogged){
        const auth = getAuth();
        let userID = auth.currentUser.uid;
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});

server.get("/signout", (req, res)=>{
    const auth = getAuth(); 
    signOut(auth).then(() => {
        isLogged = false;
        res.redirect("/");
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
    });
});

server.get("/createBlog/:userUID", (req, res)=>{
    const auth = getAuth();
    let date = getDateTime();
    if(!auth.currentUser.displayName){
        res.send("<h1>Error 404 Cannot Find Your File</h1>");
    }
    res.render("createBlog.ejs", {
        username : auth.currentUser.displayName,
        date: date,
        userUID : auth.currentUser.uid
    });
});

server.listen(port, ()=>{
    console.log("Connected to Server Successfully to port " + port);
});

server.post("/publishPost/:userUID", (req, res)=>{
    let title = req.body.title;
    let blogBody = req.body.blogBody;
    let userUID = req.params.userUID;
    const auth = getAuth();
    const username = auth.currentUser.displayName;
    const postRef = collection(db, "users", userUID, "posts");
    addDoc(postRef, {
        title: title,
        blogBody: blogBody,
        postingDate: getDateTime(),
        userUID : userUID,
        author: username
    })
    .then((docRef)=>{
        let postID = docRef.id; 
        console.log("Post Added succussfully");
        return postID;
    })
    .then((postID)=>{
        res.redirect(`/Post/${userUID}/${postID}`);
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
    }); 
});

server.get("/BlogCollections", (req, res)=>{
    let blogArray = [];
    const blogsRef = collectionGroup(db, "posts");
    const auth = getAuth();
    getDocs(blogsRef)
    .then((snapshot)=>{
        snapshot.docs.forEach((doc)=>{
            blogArray.push({...doc.data() , id:doc.id});
        });
        // console.log(blogArray);
    })
    .then(()=>{
        res.render("BlogCollections.ejs", {blogArray : blogArray, });
    })
    .catch((err)=>{
        console.log(err.message);
    })
});

server.get("/Post/:userUID/:postID", (req, res)=>{
    let userUID = req.params.userUID;
    let postID = req.params.postID;
    const postRef = doc(db, "users", userUID, "posts", postID);
    getDoc(postRef)
    .then((snapshot)=>{
        const blogTitle = snapshot.data().title;
        const postingDate = snapshot.data().postingDate;
        const blogBody = snapshot.data().blogBody.replace(/\r\n/g, "<br>");
        const username = snapshot.data().author;
        res.render('previewBlog.ejs', {userUID, blogTitle, blogBody, postingDate, username});
    })
    .catch((err) =>{
        console.log(err.message);
    })
});

server.get("/userProfile/:userUID", (req, res)=>{
    let userUID = req.params.userUID;
    let userBlogs = [];
    let postCount = 0;
    let displayName = "";
    let name = "";
    let joinDate;
    const postRef = collection(db, "users", userUID, "posts");
    const docRef = doc(db, "users", userUID);
    const auth = getAuth();
    let user = auth.currentUser;
    if(user){
        name = user.displayName;
    }
    getDoc(docRef)
    .then((snapshot)=>{
        displayName = snapshot.data().displayName;
        joinDate = snapshot.data().joinDate;
    })
    getDocs(postRef)
    .then((snapshot)=>{
        snapshot.docs.forEach((docs)=>{
            userBlogs.push({...docs.data(), id: docs.id});
            postCount++;
        });
    })
    .then(()=>{
        console.log(userBlogs);
        res.render("ProfilePage.ejs", {userBlogs, postCount, displayName, joinDate, name});
    })
});

function getDateTime() {
    const d = new Date();
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}



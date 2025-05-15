import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import fs from "fs";
import { getAuth, createUserWithEmailAndPassword,signInWithEmailAndPassword, signOut, updateProfile} from "firebase/auth";
import {getFirestore, collection, getDocs, addDoc, doc,setDoc, collectionGroup, getDoc, deleteDoc} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

dotenv.config();
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const port = process.env.PORT || 3000;
const serviceAccount = JSON.parse(fs.readFileSync("./etc/secrets/serviceAccountKey.json", "utf-8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const server = express();
const db = getFirestore(); //initialize firestore service

server.use(express.static("public"));
server.use(bodyParser.urlencoded({extended:  true}));
server.use(cookieSession({
    name: 'session',
    keys: ['mysessionkey'],
    maxAge: 24*60*60*1000,  //1 day
}));

function checkAuth(req, res, next) {
    const idToken = req.session.idToken;
    if(!idToken){
        console.log("Not logged in, First log in");
        return res.redirect("/login");
    } 
        

    admin.auth().verifyIdToken(idToken)
    .then((decodedToken)=>{
        req.user = decodedToken;
        next();
    })
    .catch(err => {
        console.log("Auth error:", err);
        res.redirect("/login");
      });
}

server.get("/", (req, res) => {
    if(req.session.idToken){
        admin.auth().verifyIdToken(req.session.idToken)
        .then((decodedToken)=>{
            let username = decodedToken.name;
            let userUID = decodedToken.uid;
            // console.log(decodedToken);
            res.render("index.ejs", {name: username, userUID});

        })
        .catch(error => {
            console.error("Invalid token", error);
            req.session = null;
            res.render("index.ejs");
        });
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
    let userUID;
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        userUID = user.uid;
        return user.getIdToken()
        .then((token)=>{
            req.session.idToken = token;
            return updateProfile(user, {
                displayName: user_name
            });
        }) 
    })
    .then(()=>{
        const userRef = doc(db, "users", userUID);
        return setDoc(userRef, {
            uid: userUID,
            displayName: user_name,
            joinDate
         });
    })
    .then(()=>{
        console.log("User added to database successfully");   
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

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        return userCredential.user.getIdToken()
        
    })
    .then((idToken)=>{
        req.session.idToken = idToken;
        res.redirect("/");
        console.log("success");
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
    if(req.session.idToken){
        admin.auth().verifyIdToken(req.session.idToken)
        .then((decodedToken)=>{
            console.log("User logged in with UID:", decodedToken.uid);
            res.redirect("/createBlog/" + decodedToken.uid);
        })
        .catch((error) => {
            // If token verification fails
            console.error("Token verification failed:", error);
            res.redirect("/login");
        });
    } else {
        res.redirect("/login");
    }
});
server.get("/checkLogin2", (req, res)=>{
    if(req.session.idToken){
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});

server.get("/signout", (req, res)=>{
    req.session = null;
    res.redirect("/login");
});

server.get("/createBlog/:userUID", checkAuth, (req, res)=>{
    let date = getDateTime();
    res.render("createBlog.ejs", {
        username : req.user.name,
        date: date,
        userUID : req.user.uid,
        title: "",
        blogBody: ""
    });
});

server.post("/publishPost/:userUID", checkAuth, (req, res)=>{
    let title = req.body.title;
    let blogBody = req.body.blogBody;
    let userUID = req.params.userUID;
    //decode here ??? why did i write this i dont remember
    const username = req.user.name;
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
    let currUserID = "";
    if(req.session.idToken){
        admin.auth().verifyIdToken(req.session.idToken)
        .then((decodesToken)=>{
            currUserID = decodesToken.uid;
        })
    }
    getDoc(postRef)
    .then((snapshot)=>{
        const blogTitle = snapshot.data().title;
        const postingDate = snapshot.data().postingDate;
        const blogBody = snapshot.data().blogBody.replace(/\r\n/g, "<br>");
        const username = snapshot.data().author;
        res.render('previewBlog.ejs', {userUID, blogTitle, blogBody, postingDate, username, postID, currUserID});
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
    if(req.session.idToken){
        admin.auth().verifyIdToken(req.session.idToken)
        .then((decodesToken)=>{
            name = decodesToken.name;
        })
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

server.get("/userProfile/:userUID/:postID/delete", checkAuth, (req, res)=>{
    const userUID = req.params.userUID;
    const postID = req.params.postID;
    if(req.user.uid == userUID){
        const postRef = doc(db, "users", userUID, "posts", postID);
        deleteDoc(postRef)
        .then(()=>{
            res.redirect("/userProfile/" + userUID);
        })
    } else {
        res.redirect("/naughtyBoy");
    }
})

server.get("/userProfile/:userUID/:postID/update", checkAuth, (req, res)=>{
    const userUID = req.params.userUID;
    const postID = req.params.postID;
    const postRef = doc(db, "users", userUID, "posts", postID);
    if(req.user.uid == userUID){
        let title = "";
        let blogBody = "";
        let date = "";
        getDoc(postRef)
        .then((docSnap)=>{
            title = docSnap.data().title;
            blogBody = docSnap.data().blogBody;
            date = docSnap.data().postingDate;
        })
        .catch((err)=>{
            console.log(err.message);
        })
        .then(()=>{
            deleteDoc(postRef)
            .then(()=>{
                res.render("createBlog.ejs", {
                    username : req.user.name,
                    date: date,
                    userUID : req.user.uid,
                    title, blogBody
                });
            })
        })
    } else {
        res.redirect("/naughtyBoy");
    }
})

server.get("/naughtyBoy", (req, res) => {
    res.send(
        "<h1>Naughty Boy ban riya hai!!</h1>"
    );
})

function getDateTime() {
    const d = new Date();
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

server.listen(port, ()=>{
    console.log("Connected to Server Successfully to port " + port);
});
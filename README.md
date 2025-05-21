 
# Bloggify

**Bloggify** is a full-stack web application that enables users to create, share, and read blog posts. Built using Node.js, Express, HTML, CSS, JavaScript, and Firebase for database management and authentication, it offers a seamless blogging experience.

## 🌐 Live Demo

Experience the application live: [https://bloggify-qk8k.onrender.com](https://bloggify-qk8k.onrender.com)

## 🚀 Features

- User authentication and authorization via Firebase
- Create, edit, and delete blog posts
- View a feed of all user-submitted blogs
- Responsive design for various devices
- Real-time updates using Firebase

## 🛠️ Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database & Auth**: Firebase

## 📂 Project Structure

```
Bloggify/
├── public/             # Static assets (CSS, JS, images)
├── utils/              # Utility functions and middleware
├── views/              # EJS templates for rendering pages
├── index.js            # Entry point of the application
├── package.json        # Project metadata and dependencies
└── README.md           # Project documentation
```

## 🔧 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ShobhitMaste/Bloggify.git
   cd Bloggify
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Firebase:**

   - Create a Firebase project at [https://firebase.google.com/](https://firebase.google.com/).
   - Enable Authentication (e.g., Email/Password).
   - Create a Firestore database.
   - Obtain your Firebase configuration details.
   - Create a `.env` file in the root directory and add your Firebase credentials:

     ```env
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=your_auth_domain
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     FIREBASE_APP_ID=your_app_id
     ```

4. **Start the application:**

   ```bash
   npm start
   ```

   The application will run at `http://localhost:3000/`.

## 📝 Usage

- Register or log in using your email and password.
- Create new blog posts from the dashboard.
- Browse and read blogs posted by other users.
- Edit or delete your own blog posts.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

![image](https://github.com/user-attachments/assets/6f70d03f-2b7a-46c9-bd10-f566dffac52b)
  
  2600 total lines of code written

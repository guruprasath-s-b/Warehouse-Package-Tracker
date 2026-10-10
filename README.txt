Warehouse Package Tracker - Express + MongoDB
============================================

What you received:
- server.js            (Express server + API)
- package.json         (Node dependencies)
- /public/index.html   (Simple UI to add/list/edit/delete packages)
- README (this file)

Requirements:
- Node.js (v14+ recommended)
- MongoDB running locally (mongod), or a connection string to a MongoDB server

Quick setup:

1. Unzip the project (if zipped).
2. Open terminal and cd into project folder.
   cd warehouse_tracker_mongodb_zip

3. Install dependencies:
   npm install

4. Start MongoDB server (if not running). On macOS you can use `brew services start mongodb-community` if installed via Homebrew,
   or start `mongod` directly.

5. Start the Node server:
   npm start

6. Open browser:
   http://localhost:5000

Environment:
- By default the server connects to mongodb://localhost:27017/mydatabase
  To override, set the environment variable MONGO_URL:
    MONGO_URL="mongodb://127.0.0.1:27017/mydatabase" npm start

Notes:
- The UI form stores packages with these fields:
    packageId (required), sender, receiver, location, status, mobile, weight, notes, date
- Collections are created automatically on first insert.

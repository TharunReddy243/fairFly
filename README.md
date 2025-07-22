# ✈️ Flight Search Application

This is a full-stack web application that allows users to sign up, log in, and search for flights. The backend is built with Node.js/Express and connects to a MongoDB database, while the frontend is a modern React application.

## ✨ Features

- **User Authentication**: Secure user signup and login functionality using JSON Web Tokens (JWT).
- **Flight Search**: Users can search for flights based on origin, destination, and date.
- **Search History**: The application stores a user's search queries.

## 🛠️ Tech Stack

- **Backend**:

  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - JSON Web Tokens (JWT) for authentication
  - `cors` for handling Cross-Origin Resource Sharing

- **Frontend**:
  - React (with Vite)
  - TypeScript
  - ESLint for code quality

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v18.x or newer is recommended)
- npm or yarn
- MongoDB (or a MongoDB Atlas account for a cloud-hosted database)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project
```

### 2. Backend Setup

First, let's set up the server.

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install
```

Next, create a `.env` file in the `server` directory. This file will store your environment variables.

**`server/.env`**

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=a_very_strong_and_secret_key_for_jwt
```

- `MONGO_URI`: Your connection string for your local or cloud MongoDB instance.
- `JWT_SECRET`: A secret key used to sign the authentication tokens.

### 3. Frontend Setup

Now, let's set up the client-side application.

```bash
# Navigate to the frontend directory from the project root
cd frontend

# Install dependencies
npm install
```

Next, create a `.env` file in the `frontend` directory to tell your React app where the backend API is located.

**`frontend/.env`**

```env
VITE_API_URL=http://localhost:5000
```

### 4. Running the Application

You'll need to run both the backend and frontend servers simultaneously in two separate terminal windows.

**Terminal 1: Start the Backend Server**

```bash
# In the /server directory
npm start
```

You should see the message: `✈️ Server running on http://localhost:5000`

**Terminal 2: Start the Frontend Development Server**

```bash
# In the /frontend directory
npm run dev
```

Your React application will now be running and accessible at `http://localhost:5173` (or another port if 5173 is in use).

You're all set! Open your browser to the frontend URL to use the application.

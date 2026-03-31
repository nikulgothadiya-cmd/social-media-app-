import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Saved from "./pages/Saved.jsx";
import { clearToken, getToken } from "./api/token.js";
import api from "./api/client.js";
import Chat from "./pages/Chat.jsx";
import { resetSocket } from "./api/socket.js";
import Explore from "./pages/Explore.jsx";
import Search from "./pages/Search.jsx";
import Admin from "./pages/Admin.jsx";
import Reels from "./pages/Reels.jsx";
import CreateResponse from "./pages/CreateResponse.jsx";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(!!getToken());
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthed(!!getToken());
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setMe(null);
      return;
    }
    api
      .get("/users/me")
      .then(({ data }) => setMe(data.user))
      .catch(() => setMe(null));
  }, [isAuthed]);

  const handleLogout = () => {
    clearToken();
    resetSocket();
    setIsAuthed(false);
    navigate("/login");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Social Media</div>
        <nav>
          <Link to="/">Feed</Link>
          {isAuthed ? (
            <>
              {me?.username && <Link to={`/u/${me.username}`}>My Profile</Link>}
              <Link to="/chat">Chat</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/saved">Saved</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/search">Search</Link>
              <Link to="/reels">Reels</Link>
              <Link to="/response/new">Create Response</Link>
              {me?.role === "admin" && <Link to="/admin">Admin</Link>}
              <button className="linklike" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Feed onAuthChange={setIsAuthed} />} />
          <Route path="/login" element={<Login onAuthChange={setIsAuthed} />} />
          <Route path="/register" element={<Register onAuthChange={setIsAuthed} />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/response/new" element={<CreateResponse />} />
        </Routes>
      </main>
    </div>
  );
}

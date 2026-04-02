import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Saved from "./pages/Saved.jsx";
import { getToken } from "./api/token.js";
import Chat from "./pages/Chat.jsx";
import Explore from "./pages/Explore.jsx";
import Search from "./pages/Search.jsx";
import Admin from "./pages/Admin.jsx";
import Reels from "./pages/Reels.jsx";
import Stories from "./pages/Stories.jsx";
import CreateResponse from "./pages/CreateResponse.jsx";
import BottomNav from "./components/BottomNav.jsx";
import StoriesBar from "./components/StoriesBar.jsx";
import api from "./api/client.js";

export default function App() {
  const location = useLocation();
  const [, setIsAuthed] = useState(!!getToken());

  useEffect(() => {
    setIsAuthed(!!getToken());
  }, []);

  useEffect(() => {
    const syncUsername = async () => {
      if (!getToken()) return;
      if (localStorage.getItem("username")) return;
      try {
        const { data } = await api.get("/users/me");
        if (data.user?.username) {
          localStorage.setItem("username", data.user.username);
        }
      } catch (err) {
        console.warn("Could not sync username", err);
      }
    };
    syncUsername();
  }, []);

  return (
    <div className="app">
      <main className="container" style={{ paddingBottom: "88px" }}>
        {location.pathname === "/" && <StoriesBar />}
        <Routes>
          <Route path="/" element={<Feed onAuthChange={setIsAuthed} />} />
          <Route path="/login" element={<Login onAuthChange={setIsAuthed} />} />
          <Route path="/register" element={<Register onAuthChange={setIsAuthed} />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/search" element={<Search />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/response/new" element={<CreateResponse />} />
          <Route path="/create" element={<CreateResponse />} />
          <Route
            path="/profile/me"
            element={
              localStorage.getItem("username")
                ? <Navigate to={`/u/${localStorage.getItem("username")}`} replace />
                : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

import { Routes, Route } from "react-router-dom";
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

export default function App() {
  const [, setIsAuthed] = useState(!!getToken());

  useEffect(() => {
    setIsAuthed(!!getToken());
  }, []);

  return (
    <div className="app">
      <main className="container" style={{ paddingBottom: "88px" }}>
        <StoriesBar />
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
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import FindHelp from "./pages/FindHelp";
import OfferHelp from "./pages/OfferHelp";
import MyOffers from "./pages/MyOffers";
import EditOffer from "./pages/EditOffer";
import Requests from "./pages/Requests";
import Connections from "./pages/Connections";
import Profile from "./pages/Profile";
import SessionHub from "./pages/SessionHub";

import AppLayout from "./components/AppLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Application */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/find-help" element={<FindHelp />} />
            <Route path="/offer-help" element={<OfferHelp />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route
              path="/my-offers/:offerId/edit"
              element={<EditOffer />}
            />
            <Route path="/requests" element={<Requests />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route
            path="/session-hub/:sessionId"
            element={<SessionHub />}
          />
          <Route
            path="/session/:sessionId"
            element={<SessionHub />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


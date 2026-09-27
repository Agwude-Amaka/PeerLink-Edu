import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .limit(1);

    if (error) {
      console.error("Profile error:", error);
      return null;
    }

    return data?.[0] || null;
  }

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!active) return;

      setUser(currentUser);

      if (currentUser) {
        const currentProfile = await fetchProfile(currentUser.id);

        if (active) {
          setProfile(currentProfile);
        }
      } else {
        setProfile(null);
      }

      if (active) {
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return { error };
    }

    setUser(null);
    setProfile(null);

    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
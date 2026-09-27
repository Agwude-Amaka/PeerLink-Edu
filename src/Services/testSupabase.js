import { supabase } from "./supabase";

async function testSupabase() {
  const { error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase connection failed:", error);
    return;
  }

  console.log("Supabase connection successful! ✅");
}

testSupabase();
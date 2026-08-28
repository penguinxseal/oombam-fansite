"use strict";

/*
  OomBam Community backend configuration.

  1) Create a Supabase project.
  2) Run supabase-community.sql in the Supabase SQL editor.
  3) Paste the Project URL and ANON / PUBLISHABLE key below.

  IMPORTANT:
  - The anon/publishable key is intended for browser use with RLS enabled.
  - NEVER place a Supabase service_role key in this file or anywhere in GitHub Pages.
*/

window.OOMBAM_COMMUNITY_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",

  // Preview phase only: signup UI is available, but participation is NOT restricted yet.
  // We will switch this to true later when Supabase Auth and access controls are ready.
  requireAuthForParticipation: false
};

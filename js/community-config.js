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
  supabaseUrl: "https://oxczxnfajbdrsochluei.supabase.co",
  supabaseAnonKey: "sb_publishable_8rxEbAI9Y008yhV5KV8qcw_WjWNM6ia",

  // Production community access: authenticated membership is required for participation.
  // Public visitors can still browse approved/public Community content.
  requireAuthForParticipation: true
};

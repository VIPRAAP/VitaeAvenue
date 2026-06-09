// ===== SUPABASE INIT =====
const { createClient } = supabase;
const sbClient = createClient(
  'https://elldezegkmdfglyuxcvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbGRlemVna21kZmdseXV4Y3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzU3MDIsImV4cCI6MjA5NjUxMTcwMn0.y2yq8uD1N-i_u0KPu9X-wTR7BAIlUfIZl4LYr32fZ5Y'
);

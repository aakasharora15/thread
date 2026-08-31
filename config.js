// Fill these in with your own Supabase project values, then commit this file.
//
// Both values are safe to publish. The anon key is designed to sit in a browser;
// what protects the data is row level security on the saves table, which the
// schema.sql in this repo turns on. Never put the service_role key here.

window.THREAD_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-ref.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-KEY',

  // Testing switch. While this is true the sign in screen never appears: the
  // game opens straight onto the home screen and saves to this browser only,
  // with nothing sent to or read from the server. Set it to false to put the
  // sign in screen back and turn cloud saving on again.
  SKIP_LOGIN: true
};

# Thread

One line, no gaps. A logic puzzle in 200 levels across three lanes, built as a
mobile web app. Every player signs in, and their progress is kept on the server
so it survives a new phone, a cleared browser or a reinstall.

Static site, no build step. Supabase handles sign in and storage. Vercel serves
the files.

---

## What you need

- A GitHub account
- A Vercel account
- A Supabase account (free tier is plenty for a group of 15 to 20)

About twenty minutes, most of it waiting for things to deploy.

## 1. Set up Supabase

1. Create a new project at supabase.com. Any region near your players.
2. Open **SQL Editor**, paste the whole of `schema.sql` from this repo, and run
   it. That creates the `saves` table and switches on row level security so no
   account can read another account's row.
3. Go to **Authentication, Providers** and make sure **Email** is on.
4. Go to **Authentication, Sign In / Providers** and turn **Confirm email**
   *off*. With it on, everyone has to click a link in an email before they can
   play, and Supabase's built-in mail server is heavily rate limited. For a
   small private group, off is the sane choice. If you would rather keep it on,
   connect your own SMTP first.
5. Go to **Project Settings, API** and copy two values: the **Project URL** and
   the **anon public** key.

## 2. Put your keys in

Open `config.js` and paste the two values in. Commit it.

Both values are meant to be public. The anon key only works through row level
security, which step 1 turned on. Never put the `service_role` key anywhere in
this repo.

## Playing without signing in

`config.js` has a `SKIP_LOGIN` switch. While it is `true` the sign in screen
never appears: the game opens straight onto the home screen, saves to the
browser it is running in, and talks to no server at all, so it works before
Supabase is set up. Progress will not follow anyone to another phone, and
anyone with the URL can play, so set it back to `false` before you share the
deployed URL with the group.

## 3. Push to GitHub

```
git init
git add .
git commit -m "Thread"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/thread.git
git push -u origin main
```

## 4. Deploy on Vercel

1. **Add New, Project**, import the repo.
2. Framework preset: **Other**. Leave the build command and output directory
   empty. This is a static site.
3. Deploy. You get a URL like `thread-xyz.vercel.app`.

## 5. Get it onto phones

Send everyone the URL. On iPhone they should open it in **Safari**, tap
**Share**, then **Add to Home Screen**. It then opens full screen with no
browser chrome, using the icon in `icons/`.

On Android, Chrome offers **Install app** from the menu.

Each person creates their own account on first launch with an email and a
password of at least eight characters. The emails do not have to be real
addresses that receive mail once you have turned confirmation off, but they do
have to be unique and they do have to be remembered.

---

## How saving works

The browser saves first, then the server. That means the game keeps working on
the tube with no signal, and catches up when the connection returns.

When two copies disagree, they are merged rather than one overwriting the
other. Progress only moves forward, so the merge takes the higher of each
value: the further level unlocked, the better score on each level. A run cannot
be eaten by a stale copy on another device. The half-drawn board you left mid
level is the one exception and uses the most recent copy, since there is no
sensible way to merge two different lines.

Signing out clears the local copy, so a shared phone does not leak one person's
progress to the next.

## Checking on the group

`schema.sql` also creates a `progress` view. In the Supabase SQL editor:

```sql
select * from progress order by medium_level desc;
```

It shows how far each player has reached in each lane without exposing anyone's
email.

## What is in the repo

```
index.html            markup, the sign in screen, the head
styles.css            all styling, including the twenty world palettes' hooks
boards.js             the 600 boards, pre-generated and verified
app.js                the game: rules, drawing, sound, local saving
sync.js               sign in and server saving
config.js             your Supabase URL and anon key
schema.sql            the table, its security policies and the progress view
manifest.webmanifest  Home Screen install
icons/                app icons
```

## Regenerating the levels

`boards.js` is generated offline by `thread-generator.js` (kept outside this
repo). Every board is verified to have exactly one solution before it ships. You
do not need it to run the game, only to change the level set.

## Known limits

- Fonts come from Google Fonts. If that is blocked the game falls back to system
  fonts and still plays. To be fully self contained, embed the two fonts.
- There is no password reset flow. With confirmation email off, resets need you
  to set a new password for the person in the Supabase dashboard. At this group
  size that is a two minute job; at 200 players it would need building.
- No leaderboard. The data to build one is already there if you want it later.

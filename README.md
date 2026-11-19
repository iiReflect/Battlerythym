# Getting Battle Rhythm onto your iPad

Battle Rhythm is a small web app (5 files in the `app` folder, also bundled as `battle-rhythm.zip`).
iPads can't run a web app straight from the Files app, so it has to be opened **once** from a web
address. After that it lives on your Home Screen and works with no signal. Your tasks are stored
only on the iPad, never on the website.

## Step 1: Put the files at a web address (one time)

**Option A: Let Claude do it (easiest).** Create a free empty repository on github.com
(for example `battle-rhythm`, Public), then tell Claude in this thread. Claude uploads the files and
turns on GitHub Pages, and gives you a link like `https://<your-username>.github.io/battle-rhythm/`.

**Option B: Netlify Drop (from a computer, about 2 minutes).**
1. Unzip `battle-rhythm.zip` into a folder.
2. Go to https://app.netlify.com/drop and sign up for a free account (so the site stays up).
3. Drag the folder onto the page. Netlify gives you a link ending in `.netlify.app`.

## Step 2: Install it on the iPad
1. Open the link in **Safari** (it must be Safari).
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Battle Rhythm from the Home Screen icon once while you still have internet.
   From then on it works fully offline.

## Using it
- **+ Add task**: name it, choose how often it repeats (one time, daily, weekly, monthly, quarterly,
  annually) and its next due date. A weekly task due on a Friday repeats every Friday; a monthly task
  due on the 15th repeats on the 15th, and so on.
- **Tap the box** to check a task off. Recurring tasks uncheck themselves the day after their due date
  and move to the next due date. If a period passes without a check, it is logged as "Missed".
- Every task shows **"Last done"** with the date and time. **Tap the task name** to edit it and to see
  its full history (every check, uncheck and miss).
- Use the chips at the top to filter by Daily, Weekly, Monthly and so on.

## Backups (important)
Your data lives only on this iPad. If you delete the Home Screen app, the data goes with it.
Tap **Backup → Export backup** every so often and save the file to Files or iCloud Drive.
**Restore from backup** loads that file back in (on the same or a new iPad).

# Getting Battle Rhythm onto your iPad

Battle Rhythm is a small web app (5 files in the `app` folder, also bundled as `battle-rhythm.zip`).
iPads can't run a web app straight from the Files app, so it has to be opened **once** from a web
address. After that it lives on your Home Screen and works with no signal. Your tasks are stored
only on the iPad, never on the website.

## Step 1: Turn on GitHub Pages (one time)
In this repo on github.com: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch **main**, folder **/ (root)**, then **Save**. After a minute or two the app is live at
https://iireflect.github.io/Battlerythym/

## Step 2: Install it on the iPad
1. Open the link in **Safari** (it must be Safari).
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Battle Rhythm from the Home Screen icon once while you still have internet.
   From then on it works fully offline.

## Using it
- **+ Add task**: name it, choose how often it repeats (one time, daily, weekly, monthly, quarterly,
  annually) and its next due date. A weekly task due on a Friday repeats every Friday; a monthly task
  due on the 15th repeats on the 15th, and so on.
- **Tap the box** to check a task off. A recurring task stays checked until the next day, week
  (Sunday to Saturday), month, quarter or year begins, then unchecks itself and moves to its next due date.
  If its due date passes unchecked it shows as overdue for the rest of that period, and if the period ends
  without a check it is logged as "Missed".
- Every task shows **"Last done"** with the date and time. **Tap the task name** to edit it and to see
  its full history (every check, uncheck and miss).
- Use the chips at the top to filter by Daily, Weekly, Monthly and so on.

- **Calendar** (top right): switch between Day, Week, Month and Year. Use ‹ › to move and Today to jump back.
  Tap any day to open it, or tap a task to edit it. The filter chips (Daily, Weekly, etc.) work here too.
  Green means done, blue means still to do, and red means missed or overdue.
- **Times and reminders**: each task can have a time and a reminder (at due time, 15 min before, 1 day before, and so on).
  While the app is open, reminders pop up on screen. Turn on notifications in **Settings** to also get iPad notifications.
  iPad web apps can't wake up when they're closed, so for alerts that always fire, tap
  **Settings → Add all tasks to iPad Calendar** (or **Add to iPad Calendar** on one task). The iPad Calendar
  app then handles the alarms offline. Do this again after you add or change tasks.

- **Categories**: type a category on any task (e.g. Maintenance, Admin). The side menu lists your categories so you
  can view one at a time, or tap **All categories** to see everything. On the Overview, **By category** shows every
  category on one page.
- **Print / PDF**: tap **Print / PDF** (top of the Overview, in the side menu, or on each category's header), pick a
  category, then **Download PDF** (share sheet: Save to Files, Mail, Print) or **Print**. The list shows each task's
  recurrence, time, upcoming due dates, last completion, status, and a blank initials column.

## Backups (important)
Your data lives only on this iPad. If you delete the Home Screen app, the data goes with it.
Tap **Backup → Export backup** every so often and save the file to Files or iCloud Drive.
**Restore from backup** loads that file back in (on the same or a new iPad).

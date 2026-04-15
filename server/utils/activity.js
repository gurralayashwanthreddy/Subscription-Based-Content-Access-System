const DAY_IN_MS = 24 * 60 * 60 * 1000;

function normalizeActivityDate(input = new Date()) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function pruneActivityDates(dates = [], days = 30) {
  const cutoff = normalizeActivityDate(new Date(Date.now() - (days - 1) * DAY_IN_MS));
  const seen = new Set();

  return dates
    .map((date) => normalizeActivityDate(date))
    .filter((date) => date >= cutoff)
    .filter((date) => {
      const key = date.toISOString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a - b);
}

async function recordUserActivity(user) {
  if (!user) return null;

  const today = normalizeActivityDate();
  const history = Array.isArray(user.activityDates) ? [...user.activityDates] : [];
  history.push(today);
  user.activityDates = pruneActivityDates(history, 30);
  await user.save();
  return user.activityDates;
}

function countRecentActiveDays(dates = [], days = 30) {
  return pruneActivityDates(dates, days).length;
}

module.exports = {
  countRecentActiveDays,
  normalizeActivityDate,
  pruneActivityDates,
  recordUserActivity
};

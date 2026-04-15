function hasItem(items = [], itemId) {
  return items.includes(String(itemId));
}

function addItem(items = [], itemId) {
  const itemKey = String(itemId);
  return hasItem(items, itemKey) ? items : [...items, itemKey];
}

function summarizeCourseProgress(course, progress) {
  const tests = course.tests?.length ?? course.testsCount ?? 0;
  const videos = course.videos?.length ?? course.videosCount ?? 0;
  const assignments = course.assignments?.length ?? course.assignmentsCount ?? 0;
  const totalItems = tests + videos + assignments;
  const completedItems =
    (progress?.completedTests?.length || 0) +
    (progress?.completedVideos?.length || 0) +
    (progress?.completedAssignments?.length || 0);

  return {
    totalItems,
    completedItems,
    percent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  };
}

module.exports = {
  addItem,
  hasItem,
  summarizeCourseProgress
};

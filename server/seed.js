const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Course = require("./models/Course");
const Plan = require("./models/Plan");

const seedUsers = async () => {
  const usersCount = await User.countDocuments();
  const coursesCount = await Course.countDocuments();
  const plansCount = await Plan.countDocuments();
  if (usersCount > 0 || coursesCount > 0 || plansCount > 0) return;

  const passwordAdmin = await bcrypt.hash("Admin@123", 10);
  const passwordUser = await bcrypt.hash("User@123", 10);

  const courses = await Course.create([
    { title: "React Basics", type: "Free", description: "Learn React fundamentals.", enrolled: 320, testsCount: 6, videosCount: 12, assignmentsCount: 2 },
    { title: "HTML & CSS Fundamentals", type: "Free", description: "Build responsive layouts.", enrolled: 240, testsCount: 4, videosCount: 10, assignmentsCount: 1 },
    { title: "Advanced JavaScript", type: "Premium", description: "Master modern JavaScript.", enrolled: 210, testsCount: 8, videosCount: 15, assignmentsCount: 3 },
    { title: "Node.js Masterclass", type: "Premium", description: "Build APIs and backend apps.", enrolled: 150, testsCount: 7, videosCount: 14, assignmentsCount: 2 },
    { title: "Python for Beginners", type: "Pro", description: "Start coding with Python.", enrolled: 180, testsCount: 5, videosCount: 11, assignmentsCount: 2 }
  ]);

  await Plan.create([
    { name: "Basic Plan", price: "₹199 / Month", description: "Basic Courses only", active: false, allowedTypes: ["Free"] },
    { name: "Pro Plan", price: "₹499 / Month", description: "Basic & Pro Courses", active: true, allowedTypes: ["Free", "Pro"] },
    { name: "Premium Plan", price: "₹999 / Month", description: "All Courses access", active: false, allowedTypes: ["Free", "Pro", "Premium"] }
  ]);

  await User.create([
    {
      name: "Admin",
      email: "admin@example.com",
      password: passwordAdmin,
      role: "admin",
      plan: "Premium",
      status: "Active",
      enrolledCourses: courses.map((course) => course._id)
    },
    {
      name: "John Doe",
      email: "user@example.com",
      password: passwordUser,
      role: "user",
      plan: "Pro",
      status: "Active",
      enrolledCourses: [courses[0]._id, courses[4]._id]
    }
  ]);

  console.log("Seeded default admin, user, courses, and plans.");
};

module.exports = seedUsers;

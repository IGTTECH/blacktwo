function generateRandomActivity() {
    const activities = [
      "joined the course!",
      "received a certificate!",
    ];

    const names = [
      "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack",
      "Karen", "Liam", "Mia", "Noah", "Olivia", "Peter", "Quinn", "Ryan", "Sophia", "Tom",
      "Uma", "Victor", "Wendy", "Xavier", "Yara", "Zane",
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const randomNumber = Math.floor(Math.random() * 50) + 1; // Random number 1-50
    const randomDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(); // Random date within last 7 days

    let activityText = `<strong>${randomName}</strong> ${randomActivity}`;

    if (randomActivity === "received a certificate!") {
      activityText += ` (${randomNumber} certificates issued today)`;
    }

    return `<div class="activity-item">${activityText} - ${randomDate}</div>`;
  }

  function addActivity() {
    const activityFeed = document.getElementById("activity-feed");
    activityFeed.innerHTML = generateRandomActivity() + activityFeed.innerHTML;
  }

  // Add initial activities
  for (let i = 0; i < 10; i++) {
    addActivity();
  }

  // Add new activity every 2-5 seconds (adjust as needed)
  setInterval(addActivity, Math.floor(Math.random() * 3000) + 2000); // 2000-5000 milliseconds
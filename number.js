
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function updateStudentCount() {
      let currentCount = getRandomInt(800, 1200); // Start with a random large number
      const countElement = document.getElementById('studentCount');

      function incrementCount() {
        currentCount += getRandomInt(1, 5); // Increment by a small random number
        countElement.textContent = currentCount.toLocaleString(); // Format with commas

        // Schedule the next update
        setTimeout(incrementCount, getRandomInt(1000, 3000)); // Update every 1-3 seconds
      }

      incrementCount(); // Start the incrementing process
    }

    updateStudentCount(); // Initialize the counter


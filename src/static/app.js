document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to create initials from a name/email
  function initialsOf(text) {
    if (!text) return "";
    const parts = String(text).split(/[\s@._-]+/).filter(Boolean);
    if (parts.length === 0) return text.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Helper to render participants as HTML (handles strings or objects)
  function renderParticipants(participants, activityName) {
    if (!Array.isArray(participants) || participants.length === 0) {
      return `<li class="no-participants">No participants yet</li>`;
    }

    return participants
      .map((p) => {
        // p may be string (email/name) or object { name, email }
        const text = typeof p === "string" ? p : p.name || p.email || JSON.stringify(p);
        const badge = initialsOf(text);
        // each participant shows a badge, name/email, and a remove button to unregister
        return `<li><span class="participant-badge" aria-hidden="true">${badge}</span><span class="participant-name">${text}</span><button class="participant-remove" aria-label="Remove participant" data-email="${text}">✖</button></li>`;
      })
      .join("");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep default placeholder)
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          <ul class="participants-list" data-activity="${name}">
            ${renderParticipants(details.participants, name)}
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // keep the base "message" class for consistent styling
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so participants list updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click handler for remove buttons
  activitiesList.addEventListener("click", async (event) => {
    if (!event.target.matches(".participant-remove")) return;
    const btn = event.target;
    const email = btn.dataset.email;
    const ul = btn.closest(".participants-list");
    const activity = ul ? ul.dataset.activity : null;
    if (!activity || !email) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await resp.json();
      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        // Refresh activities to update participants list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (err) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", err);
    }
  });

  // Initialize app
  fetchActivities();
});

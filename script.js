const pollArea = document.getElementById("pollArea");
const urlParams = new URLSearchParams(window.location.search);
const pollId = urlParams.get("pollId");
const themeToggle = document.getElementById("toggleTheme");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

// Show create form if no pollId
if (!pollId) {
  showCreatePollForm();
} else {
  const pollData = JSON.parse(localStorage.getItem("poll_" + pollId));
  if (!pollData) {
    pollArea.innerHTML = "<p>Poll not found.</p>";
  } else if (pollData.expiry && new Date() > new Date(pollData.expiry)) {
    pollArea.innerHTML = "<p>This poll has expired.</p>";
  } else {
    showVotePoll(pollData);
  }
}

// Create Poll
function showCreatePollForm() {
  pollArea.innerHTML = `
    <div class="card">
      <h2>Create New Poll</h2>
      <input type="text" id="pollTitle" placeholder="Poll question" required />
      <textarea id="pollOptions" placeholder="One option per line" rows="5"></textarea>
      <input type="datetime-local" id="pollExpiry" />
      <button onclick="createPoll()">Create Poll</button>
    </div>
  `;
}

function createPoll() {
  const title = document.getElementById("pollTitle").value.trim();
  const options = document.getElementById("pollOptions").value.trim().split("\n").filter(Boolean);
  const expiry = document.getElementById("pollExpiry").value;

  if (!title || options.length < 2) {
    alert("Enter a title and at least 2 options.");
    return;
  }

  const id = "poll_" + Date.now();
  const poll = {
    id,
    title,
    options,
    votes: new Array(options.length).fill(0),
    expiry: expiry || null,
  };

  localStorage.setItem(id, JSON.stringify(poll));
  window.location.href = `?pollId=${id.replace("poll_", "")}`;
}

// Vote on Poll
function showVotePoll(poll) {
  const votedKey = "voted_" + poll.id;
  const hasVoted = localStorage.getItem(votedKey);

  let html = `<div class="card"><h2>${poll.title}</h2>`;

  if (!hasVoted) {
    poll.options.forEach((opt, i) => {
      html += `
        <div class="option">
          <input type="radio" name="vote" value="${i}" id="opt${i}">
          <label for="opt${i}">${opt}</label>
        </div>`;
    });
    html += `<button onclick="submitVote('${poll.id}')">Vote</button>`;
  } else {
    html += `<p>You already voted. Here are the results:</p>`;
  }

  html += `<canvas id="resultsChart"></canvas></div>`;
  pollArea.innerHTML = html;

  if (hasVoted) drawChart(poll);
}

function submitVote(id) {
  const selected = document.querySelector("input[name='vote']:checked");
  if (!selected) return alert("Select an option to vote.");

  const poll = JSON.parse(localStorage.getItem(id));
  poll.votes[parseInt(selected.value)]++;
  localStorage.setItem(id, JSON.stringify(poll));
  localStorage.setItem("voted_" + id, true);
  showVotePoll(poll);
}

function drawChart(poll) {
  const ctx = document.getElementById("resultsChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: poll.options,
      datasets: [{
        label: 'Votes',
        data: poll.votes,
        backgroundColor: "#4CAF50",
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

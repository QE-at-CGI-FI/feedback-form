const STORAGE_KEY = "vibe-feedback-entries";

const form = document.getElementById("feedback-form");
const stars = Array.from(document.querySelectorAll(".star"));
const ratingText = document.getElementById("rating-text");
const ideasInput = document.getElementById("ideas");
const feedbackList = document.getElementById("feedback-list");
const entryTemplate = document.getElementById("entry-template");
const avgRating = document.getElementById("avg-rating");
const entryCount = document.getElementById("entry-count");
const summaryMeta = document.getElementById("summary-meta");
const clearAllButton = document.getElementById("clear-all");

let selectedRating = 0;
let entries = loadEntries();

init();

function init() {
  bindStarEvents();
  form.addEventListener("submit", onSubmit);
  clearAllButton.addEventListener("click", onClearAll);
  render();
}

function bindStarEvents() {
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const value = Number(star.dataset.value);
      selectedRating = value;
      paintStars(value);
      ratingText.textContent = labelForRating(value);
    });

    star.addEventListener("mouseenter", () => {
      const value = Number(star.dataset.value);
      paintStars(value);
    });

    star.addEventListener("mouseleave", () => {
      paintStars(selectedRating);
    });
  });
}

function paintStars(rating) {
  stars.forEach((star) => {
    const value = Number(star.dataset.value);
    star.classList.toggle("active", value <= rating);
  });
}

function onSubmit(event) {
  event.preventDefault();

  const ideas = ideasInput.value.trim();

  if (selectedRating < 1 || selectedRating > 5) {
    ratingText.textContent = "Pick a star score before saving.";
    return;
  }

  if (!ideas) {
    ideasInput.focus();
    return;
  }

  const newEntry = {
    id: crypto.randomUUID(),
    rating: selectedRating,
    ideas,
    createdAt: new Date().toISOString(),
  };

  entries.unshift(newEntry);
  persistEntries();

  selectedRating = 0;
  paintStars(0);
  ratingText.textContent = "Saved. Add another if you want.";
  form.reset();

  render();
}

function onClearAll() {
  if (entries.length === 0) {
    return;
  }

  const confirmed = window.confirm("Clear all saved feedback entries?");
  if (!confirmed) {
    return;
  }

  entries = [];
  persistEntries();
  render();
}

function render() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const count = entries.length;
  const average =
    count === 0
      ? 0
      : entries.reduce((sum, entry) => sum + entry.rating, 0) / count;

  avgRating.textContent = average.toFixed(1);
  entryCount.textContent = String(count);

  if (count === 0) {
    summaryMeta.textContent = "No feedback yet.";
  } else {
    const best = entries.filter((entry) => entry.rating >= 4).length;
    summaryMeta.textContent = `${best} high-score session${best === 1 ? "" : "s"}.`;
  }
}

function renderList() {
  feedbackList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Your saved feedback will appear here.";
    feedbackList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const clone = entryTemplate.content.cloneNode(true);
    const entryRating = clone.querySelector(".entry-rating");
    const entryDate = clone.querySelector(".entry-date");
    const entryIdeas = clone.querySelector(".entry-ideas");

    entryRating.textContent = `${"★".repeat(entry.rating)} (${entry.rating}/5)`;
    entryDate.textContent = formatDate(entry.createdAt);
    entryIdeas.textContent = entry.ideas;

    feedbackList.appendChild(clone);
  });
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => {
      return (
        entry &&
        typeof entry.id === "string" &&
        typeof entry.rating === "number" &&
        typeof entry.ideas === "string" &&
        typeof entry.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function labelForRating(value) {
  const labels = {
    1: "1 star - rough session.",
    2: "2 stars - needed more structure.",
    3: "3 stars - decent progress.",
    4: "4 stars - strong session.",
    5: "5 stars - excellent vibe.",
  };

  return labels[value] || "No score selected yet.";
}

function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.getElementById("reviewForm");
if (form) {
  const submitBtn = document.getElementById("submitReviewBtn");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");
  const reviewList = document.getElementById("reviewList");
  const ratingFilters = document.getElementById("ratingFilters");
  const rsAverage = document.getElementById("rsAverage");
  const rsStars = document.getElementById("rsStars");
  const rsCount = document.getElementById("rsCount");
  const rsBars = document.getElementById("rsBars");

  const REVIEWS_COLLECTION = "reviews";
  const RATE_LIMIT_MS = 60 * 1000; // one submission per minute per browser

  let allReviews = [];
  let activeRatingFilter = "all";

  const escapeHTML = (str = "") =>
    str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const starString = (n) => "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const units = [
      ["year", 31536000],
      ["month", 2592000],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    for (const [label, secs] of units) {
      const val = Math.floor(seconds / secs);
      if (val >= 1) return `${val} ${label}${val > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  /* ---------- Submit a review ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";
    formSuccess.textContent = "";

    const honeypot = form.websiteField.value;
    const name = form.name.value.trim();
    const role = form.role.value;
    const comment = form.comment.value.trim();
    const ratingInput = form.querySelector('input[name="rating"]:checked');

    if (honeypot) return; // silently drop likely-bot submissions

    if (!name || !comment || !ratingInput) {
      formError.textContent = "Please add your name, a star rating, and a comment.";
      return;
    }

    const lastSubmit = Number(localStorage.getItem("learnup-last-review") || 0);
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      formError.textContent = "You just posted a review — thanks! Please wait a moment before posting another.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Posting…";

    try {
      await addDoc(collection(db, REVIEWS_COLLECTION), {
        name: name.slice(0, 60),
        role,
        rating: Number(ratingInput.value),
        comment: comment.slice(0, 600),
        createdAt: serverTimestamp(),
      });
      localStorage.setItem("learnup-last-review", String(Date.now()));
      form.reset();
      formSuccess.textContent = "Thanks! Your review is now visible to everyone below.";
    } catch (err) {
      formError.textContent = "Couldn't post your review — check your connection and try again.";
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post Review";
    }
  });

  /* ---------- Render summary (average, distribution) ---------- */
  const renderSummary = () => {
    const count = allReviews.length;
    if (!count) {
      rsAverage.textContent = "–";
      rsStars.textContent = "☆☆☆☆☆";
      rsCount.textContent = "No ratings yet — be the first";
      rsBars.innerHTML = "";
      return;
    }
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;
    rsAverage.textContent = avg.toFixed(1);
    rsStars.textContent = starString(Math.round(avg));
    rsCount.textContent = `${count} review${count > 1 ? "s" : ""}`;

    const dist = [5, 4, 3, 2, 1].map((star) => allReviews.filter((r) => r.rating === star).length);
    rsBars.innerHTML = dist
      .map((n, i) => {
        const star = 5 - i;
        const pct = count ? Math.round((n / count) * 100) : 0;
        return `
          <div class="rs-bar-row">
            <span>${star}★</span>
            <div class="rs-bar-track"><div class="rs-bar-fill" style="width:${pct}%"></div></div>
            <span>${n}</span>
          </div>`;
      })
      .join("");
  };

  /* ---------- Render review list ---------- */
  const renderList = () => {
    const filtered =
      activeRatingFilter === "all"
        ? allReviews
        : allReviews.filter((r) => String(r.rating) === activeRatingFilter);

    if (!filtered.length) {
      reviewList.innerHTML = `<p class="materials-status">No reviews in this category yet.</p>`;
      return;
    }

    reviewList.innerHTML = filtered
      .map((r) => {
        const when = r.createdAt ? timeAgo(r.createdAt) : "just now";
        return `
          <article class="review-card">
            <div class="review-card-top">
              <div class="review-avatar">${escapeHTML(r.name).slice(0, 1).toUpperCase()}</div>
              <div>
                <div class="review-name">${escapeHTML(r.name)} <span class="review-role">· ${escapeHTML(r.role || "Visitor")}</span></div>
                <div class="review-stars">${starString(r.rating)}</div>
              </div>
              <div class="review-time">${when}</div>
            </div>
            <p class="review-comment">${escapeHTML(r.comment)}</p>
          </article>`;
      })
      .join("");
  };

  ratingFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    ratingFilters.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeRatingFilter = btn.dataset.filterRating;
    renderList();
  });

  /* ---------- Live subscription ---------- */
  const q = query(collection(db, REVIEWS_COLLECTION), orderBy("createdAt", "desc"));
  onSnapshot(
    q,
    (snapshot) => {
      allReviews = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Anonymous",
          role: data.role || "Visitor",
          rating: data.rating || 0,
          comment: data.comment || "",
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
        };
      });
      renderSummary();
      renderList();
    },
    (err) => {
      reviewList.innerHTML = `<p class="materials-status">Reviews couldn't be loaded. Once firebase-config.js has your real project keys (see README), this list goes live.</p>`;
      console.error(err);
    }
  );
}
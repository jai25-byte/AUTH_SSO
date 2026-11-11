// ===== Dynamic Greeting =====
(function () {
  const greetingEl = document.querySelector(".greeting h1");
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeOfDay;
  if (hour < 12) timeOfDay = "morning";
  else if (hour < 17) timeOfDay = "afternoon";
  else timeOfDay = "evening";

  greetingEl.textContent = `Good ${timeOfDay}, Alex 👋`;
})();

// ===== Active nav highlight =====
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
  });
});

// ===== Search focus styling =====
const searchBox = document.querySelector(".search-box");
const searchInput = searchBox?.querySelector("input");
if (searchInput && searchBox) {
  searchInput.addEventListener("focus", () => {
    searchBox.style.borderColor = "#2563eb";
    searchBox.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
  });
  searchInput.addEventListener("blur", () => {
    searchBox.style.borderColor = "";
    searchBox.style.boxShadow = "";
  });
}


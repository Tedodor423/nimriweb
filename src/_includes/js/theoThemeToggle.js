/* dark mode button */
const dark_mode_text = ["theme: light", "theme: dark"];

function announceThemeChange(isDarkMode) {
    window.dispatchEvent(new CustomEvent("themechange", {
        detail: { darkMode: isDarkMode }
    }));
}

function toggleDarkMode() {
    var stored = localStorage.getItem("theme");
    var new_stored = stored == 1 ? 0 : 1;
    localStorage.setItem("theme", new_stored);
    document.documentElement.classList.toggle('dark-mode', new_stored == 1);
    
    // change text of all buttons with the class "dark-toggle"
    document.querySelectorAll(".dark-toggle").forEach(button => {
        button.innerText = dark_mode_text[new_stored];
    });

    announceThemeChange(new_stored == 1);
}
/* Set initial state of dark mode button */
document.addEventListener("DOMContentLoaded", function () {

    var stored = localStorage.getItem("theme");
    console.log("Stored theme mode:", stored);
    if (stored === null) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    stored = prefersDark ? 1 : 0;
    localStorage.setItem("theme", stored);
    }

    console.log("Stored theme mode:", stored);

    document.documentElement.classList.toggle("dark-mode", stored == 1);
    
    document.querySelectorAll(".dark-toggle").forEach(button => {
        button.innerText = dark_mode_text[stored == 1 ? 1 : 0];
    });

    announceThemeChange(stored == 1);
});

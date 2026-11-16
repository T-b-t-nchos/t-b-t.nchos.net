const root = document.documentElement;
const toggleLightDark = document.querySelector("#toggle-light-dark");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
    root.style.colorScheme = savedTheme;
}

if (toggleLightDark) {
    toggleLightDark.addEventListener("click", event => {
        event.preventDefault();

        const currentTheme = getComputedStyle(root).colorScheme;
        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        root.style.colorScheme = nextTheme;
        localStorage.setItem("theme", nextTheme);
    });
}

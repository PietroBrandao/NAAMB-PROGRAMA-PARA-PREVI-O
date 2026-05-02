function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");

    if (menu && overlay) {
        menu.classList.toggle("active");
        overlay.classList.toggle("active");

        if (menu.classList.contains("active")) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", (event) => {
        const menu = document.getElementById("sideMenu");

        if (
            event.key === "Escape" &&
            menu &&
            menu.classList.contains("active")
        ) {
            toggleMenu();
        }
    });
});
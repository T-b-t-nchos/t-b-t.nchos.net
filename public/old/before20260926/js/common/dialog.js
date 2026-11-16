const dialog = document.getElementById("modal");
const title = document.getElementById("modal-title");
const content = document.getElementById("modal-content");

const modalData = {
    "programming": "./dialogs/programming.html",
    "server": "./dialogs/server.html",
    "video": "./dialogs/video.html",
    "design": "./dialogs/design.html",
    "retro-and-game": "./dialogs/retro-and-game.html"
};

document.querySelectorAll(".open-dialog").forEach(el => {
    el.addEventListener("click", async () => {
        const key = el.id;
        const url = modalData[key];

        title.textContent = el.textContent.trim();

        if (!url) {
            content.textContent = "Nothing to show... sorry.";
            dialog.showModal();
            return;
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            const emojiRegex = /\p{Extended_Pictographic}/gu;

            content.innerHTML = html.replace(emojiRegex, match =>
                `<span class="noto-emoji">${match}</span>`
            );

        } catch (error) {
            console.error(error);
            content.textContent = "Failed to load dialog content.";
        }

        dialog.showModal();
    });
});

dialog.addEventListener("click", event => {
    if (event.target === dialog) {
        dialog.close();
    }
});

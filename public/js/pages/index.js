import "../core/light-dark.js"
import "../components/privacy-consent.js"
import "../components/particles.js"


/*Lists*/
    function createLinks() {
        const container = document.getElementById("links-list");

        if (!container || !window.linksData) {
            return;
        }

        container.innerHTML = "";

        window.linksData.forEach((category) => {
            const heading = document.createElement("h3");
            heading.textContent = `◇ ${category.category}`;

            const list = document.createElement("div");
            list.className = "list";

            category.items.forEach((link, index) => {
                const element = document.createElement("a");
                element.className = "list-item";
                element.href = link.url;
                element.setAttribute("aria-label", link.ariaLabel);

                element.innerHTML = `
                    <div class="list-index">${String(index + 1).padStart(2, "0")}</div>

                    <div class="list-content">
                    <h2>${link.title}</h2>
                    <p>${link.description}</p>
                    </div>

                    <span class="list-view">VIEW →</span>
                    `;

                list.appendChild(element);
            });

            container.appendChild(heading);
            container.appendChild(list);

            if (category !== window.linksData[window.linksData.length - 1]) {
                container.insertAdjacentHTML("beforeend", "<br><br>");
            }
        });
    }

function createWorks() {
    const container = document.getElementById("works-list");

    if (!container || !window.worksData) {
        return;
    }

    container.innerHTML = "";

    window.worksData.forEach((category) => {
        const heading = document.createElement("h3");
        heading.textContent = `◇ ${category.category}`;

        const list = document.createElement("div");
        list.className = "list";

        category.items.forEach((work) => {
            const element = document.createElement("a");
            element.className = "list-item";

            if (work.image) {
                element.classList.add("has-preview");
            }

            element.href = work.url;
            element.setAttribute("aria-label", work.ariaLabel);

            element.innerHTML = `
                <div class="list-index">${work.index}</div>

                <div class="list-content">
                <h2>${work.title}</h2>
                <p>${work.description}</p>
                <picture>
                ${
                    work.image_avif
                        ? `<source srcset="${work.image_avif}" type="image/avif" />`
                        : ""
                }
            ${
                work.image_webp
                    ? `<source srcset="${work.image_webp}" type="image/webp" />`
                    : ""
            }
            ${
                work.image
                    ? `<img class="list-item-preview" src="${work.image}" alt="Preview image of ${work.title}" aria-hidden="true" />`
                    : ""
            }
                </picture>
                </div>

                <span class="list-view">${work.viewText || "VIEW →"}</span>
                `;

            list.appendChild(element);
        });

        container.appendChild(heading);
        container.appendChild(list);

        if (category !== window.worksData[window.worksData.length - 1]) {
            container.insertAdjacentHTML("beforeend", "<br><br>");
        }
    });
}

function createHistory() {
    const container = document.getElementById("history-list");

    if (!container || !window.historyData) {
        return;
    }

    container.innerHTML = "";

    window.historyData.forEach((event) => {
        const article = document.createElement("article");
        article.className = "history-event";

        article.innerHTML = `
            <div class="history-content">
            <span class="history-date">
            <span>${event.date}</span>
            <span class="history-category">[${event.category}]</span>
            </span>
            <h2>${event.title}</h2>
            <p>${event.description}</p>
            </div>
            `;

        container.appendChild(article);
    });
}

createLinks();
createWorks();
createHistory();



/*Birthday Age Calculation*/
    const birthYear = 2011;
const birthMonth = 12;

const today = new Date();

let age = today.getFullYear() - birthYear;

if (today.getMonth() + 1 < birthMonth) {
    age--;
}

const ageElement = document.getElementById("age");
if (ageElement) {
    ageElement.textContent = age;
}

//hero-particles
//-------------------------------------------------------------------
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const settings = {
    minParticles: 64,
    maxParticles: 256,
    particleArea: 4096,
    minRadius: 1.1,
    maxRadius: 2.1,
    minSpeed: 0.08,
    maxSpeed: 0.28,
    linkDistance: 115,
    linkOpacity: 0.15,
    particleOpacity: 0.48,
    dprLimit: 2
};

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let animationFrame = 0;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function getParticleColor() {
    const element = document.createElement("div");

    element.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue("--particle")
        .trim();

    document.body.appendChild(element);

    const color = getComputedStyle(element).color;

    element.remove();

    const match = color.match(
        /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/
    );

    if (!match) {
        return {
            r: 20,
            g: 20,
            b: 20
        };
    }

    return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3])
    };
}

function resize() {
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, settings.dprLimit);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createParticle() {
    const angle = random(0, Math.PI * 2);
    const speed = random(settings.minSpeed, settings.maxSpeed);

    return {
        x: random(0, width),
        y: random(0, height),
        radius: random(settings.minRadius, settings.maxRadius),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: random(0.32, settings.particleOpacity)
    };
}

function getParticleCount() {
    const area = width * height;

    return Math.max(
        settings.minParticles,
        Math.min(
            settings.maxParticles,
            Math.round(area / settings.particleArea)
        )
    );
}

function rebuildParticles() {
    const count = getParticleCount();

    particles = Array.from(
        { length: count },
        createParticle
    );
}

function updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -10) {
        particle.x = width + 10;
    } else if (particle.x > width + 10) {
        particle.x = -10;
    }

    if (particle.y < -10) {
        particle.y = height + 10;
    } else if (particle.y > height + 10) {
        particle.y = -10;
    }
}

function drawLinks() {
    const color = getParticleColor();

    for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);

            if (distance >= settings.linkDistance) {
                continue;
            }

            const strength = 1 - distance / settings.linkDistance;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${strength * settings.linkOpacity})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
        }
    }
}

function drawParticles() {
    const color = getParticleColor();

    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha})`;
        ctx.fill();
    }
}

function render() {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
        updateParticle(particle);
    }

    drawLinks();
    drawParticles();

    animationFrame = requestAnimationFrame(render);
}

function fitCenterText() {
    const texts = [
        ...document.querySelectorAll(".fit-text")
    ];

    if (!texts.length) {
        return;
    }

    for (const element of texts) {
        element.style.transform = "translateX(-50%) scaleX(1)";
    }

    const targetWidth = Math.min(
        Math.max(...texts.map(element => element.getBoundingClientRect().width)),
        window.innerWidth * 0.8
    );

    for (const element of texts) {
        const width = element.getBoundingClientRect().width;

        if (!width) {
            continue;
        }

        element.style.transform = `translateX(-50%) scaleX(${targetWidth / width})`;
    }
}

async function init() {
    cancelAnimationFrame(animationFrame);

    resize();
    rebuildParticles();

    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    fitCenterText();
    render();
}

window.addEventListener("resize", init);

init();

//lists
//-------------------------------------------------------------------
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


//light-dark
//-------------------------------------------------------------------
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


//other
//-------------------------------------------------------------------
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

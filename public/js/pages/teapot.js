import "../core/light-dark.js"
import "../components/privacy-consent.js"


//418 particles
//-------------------------------------------------------------------

const canvas = document.getElementById("tea-particles");
const ctx = canvas.getContext("2d");

const settings = {
    minParticles: 330,
    maxParticles: 880,
    attraction: 0.003,
    damping: 0.85,
    linkDistance: 75,
    linkOpacity: 0.16,
    minRadius: 0.9,
    maxRadius: 2.0,
    particleOpacity: 0.58,
    dprLimit: 4,
    floatX: 10,
    floatY: 8,
    particleWander: 0.1,
    particleWanderSpeed: 0.005
};

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let animationFrame = 0;
let time = 0;

//utility
//-------------------------------------------------------------------

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function getParticleColor() {
    const element = document.createElement("div");

    element.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue("--particle").trim();

    document.body.appendChild(element);

    const color = getComputedStyle(element).color;
    element.remove();

    const match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);

    return match
        ? { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) }
        : { r: 128, g: 128, b: 128 };
}

//canvas
//-------------------------------------------------------------------

function resize() {
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, settings.dprLimit);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

//teapot geometry
//-------------------------------------------------------------------

function addEllipse(points, cx, cy, rx, ry, count, filled = false) {
    for (let i = 0; i < count; i++) {
        const angle = random(0, Math.PI * 2);
        const radius = filled ? Math.sqrt(Math.random()) : 1;

        points.push({
            x: cx + Math.cos(angle) * rx * radius,
            y: cy + Math.sin(angle) * ry * radius,
            steam: false
        });
    }
}

function addRing(points, cx, cy, rx, ry, thickness, count) {
    for (let i = 0; i < count; i++) {
        const angle = random(0, Math.PI * 2);
        const radius = 1 + random(-thickness, thickness);

        points.push({
            x: cx + Math.cos(angle) * rx * radius,
            y: cy + Math.sin(angle) * ry * radius,
            steam: false
        });
    }
}

function bezier(p0, p1, p2, p3, t) {
    const inverse = 1 - t;

    return {
        x: inverse ** 3 * p0.x +
        3 * inverse ** 2 * t * p1.x +
        3 * inverse * t ** 2 * p2.x +
        t ** 3 * p3.x,

        y: inverse ** 3 * p0.y +
        3 * inverse ** 2 * t * p1.y +
        3 * inverse * t ** 2 * p2.y +
        t ** 3 * p3.y
    };
}

function addBezier(points, p0, p1, p2, p3, thickness, count, steam = false) {
    for (let i = 0; i < count; i++) {
        const t = Math.random();
        const point = bezier(p0, p1, p2, p3, t);
        const next = bezier(p0, p1, p2, p3, Math.min(1, t + 0.01));
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.hypot(dx, dy) || 1;
        const offset = random(-thickness, thickness);

        points.push({
            x: point.x - dy / length * offset,
            y: point.y + dx / length * offset,
            steam
        });
    }
}

function createTeapotTargets(count) {
    const points = [];

    /* body */
        addEllipse(points, 0, 0.05, 0.24, 0.145, Math.round(count * 0.40), true);
    addRing(points, 0, 0.05, 0.24, 0.145, 0.035, Math.round(count * 0.13));

    /* lid */
        addEllipse(points, 0, -0.115, 0.18, 0.035, Math.round(count * 0.065), true);
    addRing(points, 0, -0.115, 0.18, 0.035, 0.15, Math.round(count * 0.035));

    /* lid knob */
        addEllipse(points, 0, -0.16, 0.038, 0.027, Math.round(count * 0.025), true);

    /* handle */
        addBezier(
            points,
            { x: 0.19, y: -0.04 },
            { x: 0.42, y: -0.18 },
            { x: 0.43, y: 0.28 },
            { x: 0.18, y: 0.19 },
            0.028,
            Math.round(count * 0.12)
        );

    addBezier(
        points,
        { x: 0.235, y: 0.01 },
        { x: 0.34, y: -0.08 },
        { x: 0.35, y: 0.17 },
        { x: 0.22, y: 0.13 },
        0.018,
        Math.round(count * 0.055)
    );

    /* spout */
        addBezier(
            points,
            { x: -0.19, y: -0.015 },
            { x: -0.34, y: -0.025 },
            { x: -0.42, y: -0.14 },
            { x: -0.50, y: -0.11 },
            0.035,
            Math.round(count * 0.075)
        );

    addBezier(
        points,
        { x: -0.20, y: -0.035 },
        { x: -0.34, y: -0.06 },
        { x: -0.43, y: -0.18 },
        { x: -0.50, y: -0.11 },
        0.018,
        Math.round(count * 0.035)
    );

    /* steam */
        addBezier(
            points,
            { x: -0.045, y: -0.19 },
            { x: -0.10, y: -0.29 },
            { x: 0.08, y: -0.36 },
            { x: 0.01, y: -0.52 },
            0.018,
            Math.round(count * 0.055),
            true
        );

    addBezier(
        points,
        { x: 0.035, y: -0.19 },
        { x: 0.12, y: -0.27 },
        { x: -0.02, y: -0.38 },
        { x: 0.06, y: -0.48 },
        0.016,
        Math.round(count * 0.055),
        true
    );

    /* fill remaining particles */
        while (points.length < count) {
            const angle = random(0, Math.PI * 2);
            const radius = Math.sqrt(Math.random());

            points.push({
                x: Math.cos(angle) * 0.24 * radius,
                y: 0.05 + Math.sin(angle) * 0.145 * radius,
                steam: false
            });
        }

    return points.slice(0, count);
}

//particles
//-------------------------------------------------------------------

function getParticleCount() {
    return Math.max(
        settings.minParticles,
        Math.min(
            settings.maxParticles,
            Math.round(width * height / 2600)
        )
    );
}

function createParticles() {
    const targets = createTeapotTargets(getParticleCount());

    particles = targets.map(target => {
        const angle = random(0, Math.PI * 2);

        return {
            x: random(0, width),
            y: random(0, height),
            vx: Math.cos(angle) * random(0.1, 0.3),
            vy: Math.sin(angle) * random(0.1, 0.3),
            radius: random(settings.minRadius, settings.maxRadius),
            alpha: random(0.36, settings.particleOpacity),
            targetX: target.x,
            targetY: target.y,
            steam: target.steam,
            phase: random(0, Math.PI * 2),
            wander: random(0.7, 1.3)
        };
    });
}

//animation
//-------------------------------------------------------------------

function updateParticle(particle) {
    const scale = Math.min(width, height) * 1.35;

    const bodyFloatX =
        Math.sin(time * 0.0011) * settings.floatX;

    const bodyFloatY =
        Math.cos(time * 0.0009) * settings.floatY;

    const centerX = width / 2 + bodyFloatX;
    const centerY = height / 2 + height * 0.08 + bodyFloatY;

    const wanderX =
        Math.sin(
            time * settings.particleWanderSpeed + particle.phase
        ) * settings.particleWander * particle.wander;

    const wanderY =
        Math.cos(
            time * settings.particleWanderSpeed * 0.83 + particle.phase
        ) * settings.particleWander * particle.wander;

    let targetX = centerX + particle.targetX * scale + wanderX;
    let targetY = centerY + particle.targetY * scale + wanderY;

    if (particle.steam) {
        targetX += Math.sin(time * 0.002 + particle.phase) * 5;
        targetY += Math.cos(time * 0.0015 + particle.phase) * 4;
    }

    const dx = targetX - particle.x;
    const dy = targetY - particle.y;

    particle.vx += dx * settings.attraction;
    particle.vy += dy * settings.attraction;
    particle.vx *= settings.damping;
    particle.vy *= settings.damping;

    particle.vx +=
        Math.sin(time * 0.003 + particle.phase) *
        0.018 *
        particle.wander;

    particle.vy +=
        Math.cos(time * 0.0027 + particle.phase) *
        0.018 *
        particle.wander;

    particle.x += particle.vx;
    particle.y += particle.vy;
}

//drawing
//-------------------------------------------------------------------

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
            ctx.strokeStyle =
                `rgba(${color.r}, ${color.g}, ${color.b}, ${strength * settings.linkOpacity})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
        }
    }
}

function drawParticles() {
    const color = getParticleColor();

    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);

        const alpha =
            particle.steam
            ? particle.alpha * 0.72
            : particle.alpha;

        ctx.fillStyle =
            `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

        ctx.fill();
    }
}

//render
//-------------------------------------------------------------------

function render() {
    ctx.clearRect(0, 0, width, height);
    time++;

    for (const particle of particles) {
        updateParticle(particle);
    }

    drawLinks();
    drawParticles();

    animationFrame = requestAnimationFrame(render);
}

//text
//-------------------------------------------------------------------

function fitCenterText() {
    const texts = [...document.querySelectorAll(".fit-text")];

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
        const textWidth = element.getBoundingClientRect().width;

        if (!textWidth) {
            continue;
        }

        element.style.transform =
            `translateX(-50%) scaleX(${targetWidth / textWidth})`;
    }
}


//init
//-------------------------------------------------------------------

async function init() {
    cancelAnimationFrame(animationFrame);
    resize();
    createParticles();

    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    fitCenterText();
    render();
}

window.addEventListener("resize", init);
init();


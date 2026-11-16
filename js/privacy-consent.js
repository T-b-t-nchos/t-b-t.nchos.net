(() => {
    "use strict";

    const GA4_ID = "G-XXXXXXXXXX";

    const STORAGE_KEY = "site-privacy-consent";
    const CONSENT_VERSION = 1;

    const dialog = document.getElementById("privacy-consent-dialog");

    const acceptButton = document.getElementById("privacy-accept");
    const rejectButton = document.getElementById("privacy-reject");
    const customizeButton = document.getElementById("privacy-customize");
    const saveButton = document.getElementById("privacy-save");

    const settings = document.getElementById("privacy-settings");
    const analyticsCheckbox = document.getElementById("privacy-analytics");
    const openSettingsButton = document.getElementById("privacy-open-settings");

    let consent = null;

    function loadConsent() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);

            if (
                parsed.version !== CONSENT_VERSION ||
                typeof parsed.analytics !== "boolean"
            ) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    function saveConsent(analytics) {
        consent = {
            version: CONSENT_VERSION,
            analytics,
            updatedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(consent)
            );
        } catch {
        }
    }

    function loadGA4() {
        if (window.__siteGA4Loaded) {
            return;
        }

        window.__siteGA4Loaded = true;

        window.dataLayer = window.dataLayer || [];

        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };

        window.gtag("consent", "default", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
        });

        window.gtag("consent", "update", {
            analytics_storage: "granted"
        });

        window.gtag("js", new Date());

        window.gtag("config", GA4_ID);

        const script = document.createElement("script");

        script.async = true;
        script.src =
            "https://www.googletagmanager.com/gtag/js?id=" +
            encodeURIComponent(GA4_ID);

        document.head.appendChild(script);
    }

    function openDialog() {
        if (!dialog.open) {
            dialog.showModal();
        }
    }

    function closeDialog() {
        if (dialog.open) {
            dialog.close();
        }
    }

    function updateSettings() {
        analyticsCheckbox.checked = consent?.analytics === true;
    }

    function applyConsent(analytics) {
        const wasGranted = consent?.analytics === true;

        saveConsent(analytics);

        if (analytics) {
            loadGA4();
        } else if (wasGranted) {
            window.location.reload();
            return;
        }

        closeDialog();
    }

    acceptButton.addEventListener("click", () => {
        applyConsent(true);
    });

    rejectButton.addEventListener("click", () => {
        applyConsent(false);
    });

    customizeButton.addEventListener("click", () => {
        const isHidden = settings.hidden;

        settings.hidden = !isHidden;

        customizeButton.setAttribute(
            "aria-expanded",
            String(isHidden)
        );

        if (isHidden) {
            requestAnimationFrame(() => {
                settings.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
            });
        }
    });

    saveButton.addEventListener("click", () => {
        applyConsent(analyticsCheckbox.checked);
    });

    openSettingsButton.addEventListener("click", (event) => {
        event.preventDefault();

        settings.hidden = false;

        customizeButton.setAttribute("aria-expanded", "true");

        updateSettings();
        openDialog();
    });

    consent = loadConsent();

    if (consent?.analytics === true) {
        loadGA4();
    }

    if (!consent) {
        openDialog();
    }

    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
    });
})();


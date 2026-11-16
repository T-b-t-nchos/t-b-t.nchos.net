(() => {
    "use strict";

    const GA4_ID = "G-XXXXXXXXXX";

    const CLOUDFLARE_BEACON_TOKEN = "d9b7ee70a35a42acb8ae9248e2b7f7a8";

    const STORAGE_KEY = "site-privacy-consent";
    const CONSENT_VERSION = 1;

    const dialog = document.getElementById("privacy-consent-dialog");

    const acceptButton = document.getElementById("privacy-accept");
    const rejectButton = document.getElementById("privacy-reject");
    const customizeButton = document.getElementById("privacy-customize");
    const saveButton = document.getElementById("privacy-save");

    const settings = document.getElementById("privacy-settings");

    const googleAnalyticsCheckbox = document.getElementById("privacy-google-analytics");
    const cloudflareAnalyticsCheckbox = document.getElementById("privacy-cloudflare-analytics");

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
                typeof parsed.googleAnalytics !== "boolean" ||
                typeof parsed.cloudflareAnalytics !== "boolean"
            ) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    function saveConsent(googleAnalytics, cloudflareAnalytics) {
        consent = {
            version: CONSENT_VERSION,
            googleAnalytics,
            cloudflareAnalytics,
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

    function loadCloudflareAnalytics() {
        if (window.__siteCloudflareAnalyticsLoaded) {
            return;
        }

        window.__siteCloudflareAnalyticsLoaded = true;

        const script = document.createElement("script");

        script.type = "module";
        script.src =
            "https://static.cloudflareinsights.com/beacon.min.js";

        script.dataset.cfBeacon = JSON.stringify({
            token: CLOUDFLARE_BEACON_TOKEN
        });

        document.head.appendChild(script);
    }

    function loadAnalytics() {
        if (consent?.googleAnalytics === true) {
            loadGA4();
        }

        if (consent?.cloudflareAnalytics === true) {
            loadCloudflareAnalytics();
        }
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
        googleAnalyticsCheckbox.checked =
            consent?.googleAnalytics === true;

        cloudflareAnalyticsCheckbox.checked =
            consent?.cloudflareAnalytics === true;
    }

    function applyConsent(googleAnalytics, cloudflareAnalytics) {
        const wasGoogleAnalyticsGranted =
            consent?.googleAnalytics === true;

        const wasCloudflareAnalyticsGranted =
            consent?.cloudflareAnalytics === true;

        saveConsent(googleAnalytics, cloudflareAnalytics);

        const revoked =
            (wasGoogleAnalyticsGranted && !googleAnalytics) ||
            (wasCloudflareAnalyticsGranted && !cloudflareAnalytics);

        if (revoked) {
            window.location.reload();
            return;
        }

        loadAnalytics();
        closeDialog();
    }

    acceptButton.addEventListener("click", () => {
        applyConsent(true, true);
    });

    rejectButton.addEventListener("click", () => {
        applyConsent(false, false);
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
        applyConsent(
            googleAnalyticsCheckbox.checked,
            cloudflareAnalyticsCheckbox.checked
        );
    });

    openSettingsButton.addEventListener("click", (event) => {
        event.preventDefault();

        settings.hidden = false;

        customizeButton.setAttribute("aria-expanded", "true");

        updateSettings();
        openDialog();
    });

    consent = loadConsent();

    if (consent) {
        loadAnalytics();
    } else {
        openDialog();
    }

    updateSettings();

    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
    });
})();

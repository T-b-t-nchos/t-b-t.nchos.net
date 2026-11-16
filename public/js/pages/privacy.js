import "../core/light-dark.js"


(() => {
    "use strict";

    const policies = [
        {
            element: document.getElementById("privacy-policy-content-ja"),
            file: "./privacy-policy.txt",
            error: "プライバシーポリシーを読み込めませんでした。"
        },
        {
            element: document.getElementById("privacy-policy-content-en"),
            file: "./privacy-policy-en.txt",
            error: "Failed to load the Privacy Policy."
        }
    ];

    async function loadPolicy(policy) {
        if (!policy.element) {
            return;
        }

        try {
            const response = await fetch(policy.file);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            policy.element.textContent = await response.text();
        } catch (error) {
            console.error("Privacy Policy loading error:", error);

            policy.element.textContent = policy.error;
        }
    }

    policies.forEach(loadPolicy);
})();


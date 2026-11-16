export async function onRequest(context) {
    const { request, env, params } = context;

    const errorNo = String(params.errorNo ?? "");

    /*
     * Load the generic error page template.
     */
    const templateUrl = new URL(
        "/src/pages/errors/template.html",
        request.url
    );

    const templateResponse = await env.ASSETS.fetch(
        new Request(templateUrl)
    );

    if (!templateResponse.ok) {
        return new Response("Internal Server Error", {
            status: 500,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }

    let html = await templateResponse.text();

    /*
     * Determine the HTTP status code to display.
     *
     * Invalid values such as:
     *   /errors/600
     *   /errors/999
     *   /errors/foo
     *
     * are treated as Bad Request (400).
     */
    let status;

    if (/^\d{3}$/.test(errorNo)) {
        const requestedStatus = Number(errorNo);

        if (requestedStatus >= 400 && requestedStatus <= 599) {
            status = requestedStatus;
        } else {
            status = 400;
        }
    } else {
        status = 400;
    }

    /*
     * 418 is a special page and should not use the generic template.
     */
    if (status === 418 && errorNo === "418") {
        const specialUrl = new URL(
            "/errors/418.html",
            request.url
        );

        const specialResponse = await env.ASSETS.fetch(
            new Request(specialUrl)
        );

        if (!specialResponse.ok) {
            return new Response("Internal Server Error", {
                status: 500,
                headers: {
                    "Content-Type": "text/plain; charset=UTF-8"
                }
            });
        }

        return new Response(specialResponse.body, {
            status: 418,
            headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "Cache-Control": "public, max-age=300"
            }
        });
    }

    /*
     * Split the error code for the visual layout.
     *
     * 400 -> 4 / 00
     * 403 -> 4 / 03
     * 404 -> 4 / 04
     * 500 -> 5 / 00
     */
    const errorCode = String(status);
    const errorFirst = errorCode.slice(0, 1);
    const errorRest = errorCode.slice(1);

    html = html
        .replaceAll("{{ERROR_CODE}}", errorCode)
        .replaceAll("{{ERROR_FIRST}}", errorFirst)
        .replaceAll("{{ERROR_REST}}", errorRest);

    return new Response(html, {
        status,
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "public, max-age=300"
        }
    });
}

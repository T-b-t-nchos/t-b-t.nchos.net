export async function onRequest(context) {
    const response = await context.env.ASSETS.fetch(
        new URL("/errors/418.html", context.request.url)
    );

    return new Response(response.body, {
        status: 418,
        headers: response.headers
    });
}

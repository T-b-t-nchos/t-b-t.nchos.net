const errorData = {
    "403": {
        title: "Forbidden",
        description: "You don't have permission to access this page."
    },
    "404": {
        title: "Page Not Found",
        description: "The requested page could not be found."
    },
    "418": {
        title: "I'm a teapot",
        description: "This server is a teapot and cannot brew coffee."
    },
    "500": {
        title: "Internal Server Error",
        description: "An internal server error occurred."
    },
    "503": {
        title: "Service Unavailable",
        description: "The service is temporarily unavailable."
    }
};

const errorCode = document.body.dataset.error;
const data = errorData[errorCode];

if (data) {
    document.title = `T-b-t-nchos/Nchos Website - ${errorCode} ${data.title}`;

    document.querySelector(".error-code").textContent = errorCode;
    document.querySelector(".error-title").textContent = data.title;
    document.querySelector(".error-description").textContent = data.description;
}

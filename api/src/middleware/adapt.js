const context = {
    error: (...args) => console.error(...args),
    log: (...args) => console.log(...args),
};

function adapt(handler) {
    return async (req, res) => {
        try {
            const requestObj = {
                json: async () => req.body,
                body: req.body,
                params: req.params,
                query: req.query,
                user: req.user,
                headers: req.headers,
                method: req.method,
            };
            const result = await handler(requestObj, context);
            if (result.status === 200 && result.jsonBody?.token && result.jsonBody?.user?.role === "agent") {
                res.cookie("token", result.jsonBody.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                });
            }
            res.status(result.status).json(result.jsonBody);
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Erreur serveur"});
        }
    };
}

module.exports = {adapt};

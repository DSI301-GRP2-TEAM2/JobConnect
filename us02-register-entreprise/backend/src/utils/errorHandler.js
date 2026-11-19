

const handleError = (err) => {
  if (err && err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return { status: 400, body: { error: "Validation failed", details } };
  }
  if (err && err.code === 11000) {
    return { status: 409, body: { error: "Un compte avec cet email existe déjà" } };
  }
  console.error(err);
  return { status: 500, body: { error: "Erreur serveur" } };
};

module.exports = { handleError };

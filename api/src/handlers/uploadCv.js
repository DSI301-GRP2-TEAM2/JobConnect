const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { connect } = require("../db");
const User = require("../models/User");
const { validateCvFile } = require("../validators");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cv-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const check = validateCvFile({
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    if (check.errors) {
      cb(new Error(check.errors[0]));
    } else {
      cb(null, true);
    }
  },
});

function uploadMiddleware(req, res, next) {
  const single = upload.single("cv");
  single(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ errors: ["Le fichier dépasse la taille maximale autorisée (5 Mo)"] });
      }
      return res.status(400).json({ errors: [err.message] });
    }
    next();
  });
}

async function uploadCvHandler(request, context) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return { status: 401, jsonBody: { error: "Non authentifié" } };
    }

    let fileInfo;

    if (request.file) {
      fileInfo = {
        originalname: request.file.originalname,
        path: `/uploads/${request.file.filename}`,
      };
    } else {
      let body;
      try {
        body = request.body || (await request.json?.());
      } catch {
        return { status: 400, jsonBody: { error: "Fichier ou corps manquant" } };
      }

      const filename = body?.filename || body?.name;
      if (!filename) {
        return { status: 400, jsonBody: { errors: ["Aucun fichier CV fourni"] } };
      }

      const check = validateCvFile({
        originalname: filename,
        mimetype: body.mimetype,
        size: body.size,
      });

      if (check.errors) {
        return { status: 400, jsonBody: { errors: check.errors } };
      }

      fileInfo = {
        originalname: filename,
        path: body.fileUrl || `/uploads/${Date.now()}-${filename}`,
      };
    }

    await connect();

    const user = await User.findByIdAndUpdate(
      userId,
      { cv: fileInfo.path },
      { new: true }
    ).select("-mdp");

    if (!user) {
      return { status: 404, jsonBody: { error: "Candidat introuvable" } };
    }

    return {
      status: 200,
      jsonBody: {
        message: "CV téléversé avec succès",
        cv: user.cv,
        user,
      },
    };
  } catch (err) {
    context?.error?.(err);
    return { status: 500, jsonBody: { error: "Erreur serveur" } };
  }
}

module.exports = {
  uploadMiddleware,
  uploadCvHandler,
};

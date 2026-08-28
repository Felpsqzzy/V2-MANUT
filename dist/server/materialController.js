"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
exports.registerMaterial = registerMaterial;
const multer_1 = __importDefault(require("multer"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${node_crypto_1.default.randomUUID()}${node_path_1.default.extname(file.originalname)}`)
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf'
        ];
        cb(null, allowed.includes(file.mimetype));
    }
});
async function registerMaterial(req, res) {
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    let fileType = 'document';
    if (file.mimetype.startsWith('image/'))
        fileType = 'image';
    else if (file.mimetype.startsWith('video/'))
        fileType = 'video';
    else if (file.mimetype === 'application/pdf')
        fileType = 'pdf';
    const materialData = {
        id: node_crypto_1.default.randomUUID(),
        title: String(req.body.title || file.originalname),
        description: String(req.body.description || ''),
        category: String(req.body.category || 'Geral'),
        fileUrl: `/uploads/${file.filename}`,
        fileType,
        fileMime: file.mimetype,
        fileSizeBytes: file.size
    };
    return res.status(201).json({ message: 'Material registrado com sucesso!', data: materialData });
}

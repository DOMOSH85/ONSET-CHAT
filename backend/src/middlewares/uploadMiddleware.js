const multer = require('multer');
const path = require('path');

const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.mov', '.avi', '.webm', '.mp3', '.wav', '.ogg'];
  if (allowedMimeTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported or mismatched file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload; 
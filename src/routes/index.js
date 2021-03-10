import multer from 'multer';
import cloudinary from 'cloudinary';

const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image') ||
      file.mimetype.startsWith('video')
    ) {
      cb(null, true);
    } else {
      cb(
        new Error('Not an image or video | Please upload only image and video'),
        false
      );
    }
  },
});

const router = (Router) => {
  Router.get('/', (req, res, next) => {
    return res.send({ message: 'Router Config' });
  });

  Router.post(
    '/upload-image',
    upload.single('file'),
    async (req, res, next) => {
      try {
        cloudinary.v2.config({
          cloud_name: process.env.CLOUDINARY_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          resource_type: 'image',
          folder: 'instatwo/images',
        });

        res.status(200).json({
          status: 'success',
          message: 'file uploaded in cloud',
          result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  Router.post(
    '/upload-video',
    upload.single('file'),
    async (req, res, next) => {
      try {
        cloudinary.v2.config({
          cloud_name: process.env.CLOUDINARY_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          resource_type: 'video',
          folder: 'instatwo/videos',
        });

        res.status(200).json({
          status: 'success',
          message: 'file uploaded in cloud',
          result,
        });
      } catch (error) {
        next(error);
      }
    }
  );
  return Router;
};
export default router;

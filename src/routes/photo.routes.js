import { Router } from "express";

import { uploadPhoto,
    getPublishedPhotos,
    getPhotoById,
    updatePhoto,
    deletePhoto,
  getUserPhotos,
  getMyPhotos, } from "../controllers/photo.controller.js";
    import { upload } from "../middlewares/multer.middlerware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getPublishedPhotos);
router.get("/:photoId", getPhotoById);
router.get("/user/:userId", getUserPhotos);
router.post("/", verifyJWT,upload.single("photoFile"), uploadPhoto);
router.put("/:photoId", verifyJWT,upload.single("photoFile"), updatePhoto);
router.delete("/:photoId", verifyJWT, deletePhoto);
router.get("/my-photos", verifyJWT, getMyPhotos);

export default router;


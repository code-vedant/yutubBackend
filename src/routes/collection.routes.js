import { Router } from 'express';
import {
  createCollection,
  getUserCollections,
  getCollectionById,
  addPhotoToCollection,
  removePhotoFromCollection,
  deleteCollection,
  updateCollection,
} from "../controllers/collection.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router
    .route("/:collectionId")
    .get(getCollectionById)
    
router.route("/user/:userId").get(getUserCollections);

router.use(verifyJWT); 

router.route("/").post(createCollection)

router
    .route("/:collectionId")
    .patch(updateCollection)
    .delete(deleteCollection);

router.route("/add/:videoId/:collectionId").patch(addPhotoToCollection);
router.route("/remove/:videoId/:collectionId").patch(removePhotoFromCollection);


export default router
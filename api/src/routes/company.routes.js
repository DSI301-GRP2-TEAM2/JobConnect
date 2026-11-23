const router = require('express').Router();
const {authMiddleware, requireRole} = require('../middleware/auth');
const {adapt} = require('../middleware/adapt');
const {listOffers, getOffer, updateDraft} = require('../handlers/companyOffres');

router.use(authMiddleware, requireRole('entreprise'));
router.get('/offres', adapt(listOffers));
router.get('/offres/:id', adapt(getOffer));
router.patch('/offres/:id', adapt(updateDraft));

module.exports = router;

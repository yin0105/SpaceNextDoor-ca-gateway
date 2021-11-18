const express = require('express');
const router = express.Router();
const route = {
    openDoor: require('./open-door'),
    statusDoor: require('./status-door'),
    list:{
        providers: require('./list/providers'),
        doors: require('./list/doors'),
        all: require('./list/all')
    },
    worker:{
        register: require('./worker/register')
    }
}

router.post('/open-door', (req, res, next) => {
    route.openDoor(req, res, next)
})
router.post('/status-door', (req, res, next) => {
    route.statusDoor(req, res, next)
})
router.post('/worker/register', (req, res, next) => {
    route.worker.register(req, res, next)
})
router.get('/list/providers', (req, res, next) => {
    route.list.providers(req, res, next)
})
router.get('/list/all', (req, res, next) => {
    route.list.all(req, res, next)
})
router.get('/list/doors/:providerId', (req, res, next) => {
    route.list.doors(req, res, next)
})


module.exports = router;
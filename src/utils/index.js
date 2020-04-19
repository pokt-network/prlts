function getRandomFromArray(array) {
    return array[Math.random() * array.length >> 0]
}

module.exports.getRandomFromArray = getRandomFromArray
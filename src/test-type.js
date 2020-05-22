function isTestType(testTypeStr1, testTypeStr2) {
    return testTypeStr1.toLowerCase() === testTypeStr2.toLowerCase()
}

module.exports = {
    DISPATCH: "dispatch",
    GATEWAY: "gateway",
    TRANSACTION: "transaction",
    getTestType: function(testTypeStr) {
        switch (testTypeStr.toLowerCase()) {
            case this.DISPATCH:
                return this.DISPATCH
            case this.GATEWAY:
                return this.GATEWAY
            case this.TRANSACTION:
                return this.TRANSACTION
            default:
                return this.DISPATCH
        }
    },
    isDispatchTest: function(testTypeStr) {
        isTestType(testTypeStr, this.DISPATCH)
    },
    isGatewayTest: function(testTypeStr) {
        isTestType(testTypeStr, this.GATEWAY)
    },
    isTransactionTest: function(testTypeStr) {
        isTestType(testTypeStr, this.TRANSACTION)
    }
}
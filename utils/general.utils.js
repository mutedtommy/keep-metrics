const moment = require('moment')
const web3Utils = require('web3-utils')

//dont export
moment.updateLocale("en", {
  relativeTime: {
    d: "1 day",
    dd: (number, withoutSuffix, key, isFuture) => {
      const weeks = Math.round(number / 7)
      if (number < 7) {
        return number + " days"
      } else {
        return weeks + " week" + (weeks === 1 ? "" : "s")
      }
    },
  },
})

const shortenAddress = (address) => {
  if (!address) {
    return ""
  }
  const firstFourCharacters = address.substr(2, 4)
  const lastFourCharacters = address.substr(
    address.length - 4,
    address.length - 1
  )

  return "0x"
    .concat(firstFourCharacters)
    .concat("...")
    .concat(lastFourCharacters)
}

const wait = (ms) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms)
  })
}

const formatDate = (dateMillis, format = "MM/DD/YYYY") => {
  const date = moment(dateMillis)

  return date.format(format)
}

const isEmptyObj = (obj) =>
  Object.keys(obj).length === 0 && obj.constructor === Object

const isSameEthAddress = (address1, address2) => {
  return (
    web3Utils.toChecksumAddress(address1) ===
    web3Utils.toChecksumAddress(address2)
  )
}

const getBufferFromHex = (hex) => {
  const validHex = toValidHex(hex).toLowerCase()
  return new Buffer(validHex, "hex")
}

// dont export
const toValidHex = (hex) => {
  hex = hex.substring(0, 2) === "0x" ? hex.substring(2) : hex
  if (hex === "") {
    return ""
  }
  return hex.length % 2 !== 0 ? `0${hex}` : hex
}

module.exports = {
  shortenAddress,
  wait,
  formatDate,
  isEmptyObj,
  isSameEthAddress,
  getBufferFromHex
}

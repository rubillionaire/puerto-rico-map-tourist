const colors = require('../constants/color.js')
const { dotPatternImageRect, EmojiImagesWithBackground } = require('../util/canvas.js')

// <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
// except as a base64 encoded image

module.exports = setIcon

function setIcon () {
  const imageSize = 180

  const iconMaker = EmojiImagesWithBackground({
    width: imageSize,
    height: imageSize,
    drawBackground: (opts) => {
      return dotPatternImageRect({
        ...opts,
        circle: false,
        color: colors.alternate,
        color2: colors.primary,
        density: 2,
      })
    },
    emojiSize: 80,
  })

  const icon = iconMaker('🇵🇷')
  const canvas = document.createElement('canvas')
  canvas.width = imageSize
  canvas.height = imageSize
  const context = canvas.getContext('2d')
  context.putImageData(icon, 0, 0)

  const base64png = canvas.toDataURL('image/png')

  const link = document.createElement('link')
  link.rel = 'apple-touch-icon'
  link.size = `${imageSize}x${imageSize}`
  link.href = base64png
  document.head.appendChild(link)
}

const colors = require('./color.js')

// <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
// except as a base64 encoded image

module.exports = 

function setIcon () {
  const imageSize = 180

  const iconMaker = EmojiImagesWithBackground({
    width: imageSize,
    height: imageSize,
    drawBackground: dotPatternImage,
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

function EmojiImagesWithBackground ({
  width,
  height,
  drawBackground,
  emojiSize=12,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.font = `${emojiSize}px Arial`
  return (emoji) => {
    context.clearRect(0, 0, width, height)
    drawBackground({ width, height, context, color: colors.primary })
    context.fillText(emoji, (width - (emojiSize + (width * 0.0)))/2, ((height - (emojiSize + (height * 0.1)))/2) + emojiSize)
    return context.getImageData(0, 0, width, height)
  }
}

function dotPatternImage ({
  context,
  width,
  height,
}) {
  context.clearRect(0, 0, width, height)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if ((x % 4 === 0 && y % 4 === 0) ||
          (x % 4 === 0 && y % 4 === 1) ||
          (x % 4 === 1 && y % 4 === 1) ||
          (x % 4 === 1 && y % 4 === 0)) {
        context.fillStyle = colors.alternate
        context.fillRect(x, y, 1, 1)  
      }
      else {
        context.fillStyle = colors.primary
        context.fillRect(x, y, 1, 1)  
      }
    }
  }
}



const colors = require('./color.js')

module.exports = {
  EmojiImagesWithBackground,
  dotPatternImageCircle,
  dotPatternImageRect,
  circleImage,
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
    context.fillText(emoji, (width - (emojiSize + (width * 0.1)))/2, ((height - (emojiSize + (height * 0.1)))/2) + emojiSize)
    return context.getImageData(0, 0, width, height)
  }
}

function distance (p1, p2) {
  return Math.sqrt(
    (Math.pow(p1.x-p2.x, 2)) +
    (Math.pow(p1.y-p2.y, 2))
  )
}

function dotPatternImage ({
  context,
  width,
  height,
  color=colors.alternate,
  circle=true,
}) {
  const radius = width / 2
  const center = { x: radius, y: radius }
  context.clearRect(0, 0, width, height)
  let circleGuard = () => true
  if (circle) circleGuard = ({ x, y }) => (distance({ x, y }, center) <= radius)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (circleGuard({ x, y }) &&
          (x % 2 === 0 && y % 2 === 0)) {
        context.fillStyle = color
        context.fillRect(x, y, 1, 1)  
      }
    }
  }
}

function dotPatternImageCircle (opts) {
  return dotPatternImage({ ...opts, circle: true })
}

function dotPatternImageRect (opts) {
  return dotPatternImage({ ...opts, circle: false })
}

function circleImage ({
  context,
  width,
  height,
  color=colors.alternate,
}) {
  const radius = width / 2
  const center = { x: radius, y: radius }
  context.clearRect(0, 0, width, height)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (distance({ x, y }, center) <= radius) {
        context.fillStyle = color
        context.fillRect(x, y, 1, 1)
      }
    }
  }
}
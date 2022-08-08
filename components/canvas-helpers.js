const colors = require('./color.js')

module.exports = {
  EmojiImagesWithBackground,
  dotPatternImageCircle,
  dotPatternImageRect,
  circleImage,
  dynamicPatternImage,
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
  color2=undefined,
  circle=true,
  density=1,
}) {
  const radius = width / 2
  const center = { x: radius, y: radius }
  context.clearRect(0, 0, width, height)
  let circleGuard = () => true
  if (circle) circleGuard = ({ x, y }) => (distance({ x, y }, center) <= radius)
  let densityGuard = ({ x, y }) => (x % 2 === 0 && y % 2 === 0)
  if (density === 2) {
    densityGuard = ({ x, y }) => (
      (x % 4 === 0 && y % 4 === 0) ||
      (x % 4 === 1 && y % 4 === 0) ||
      (x % 4 === 1 && y % 4 === 1) ||
      (x % 4 === 0 && y % 4 === 1)
    )
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (circleGuard({ x, y }) &&
          (densityGuard({ x, y }))) {
        // context.beginPath()
        context.fillStyle = color
        context.fillRect(x, y, 1, 1)
        // context.arc(x, y, 0.5, 0, Math.PI * 2, false)
        // context.fill()
      }
      else if (color2) {
        context.fillStyle = color2
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

function dynamicPatternImage (opts1) {
  return (opts2) => {
    return dotPatternImage({ ...opts2, ...opts1 })
  }
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
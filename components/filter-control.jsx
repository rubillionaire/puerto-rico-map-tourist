import React, {
  useState,
} from 'react'
const classname = require('classnames')
const CanvasBackground = require('./canvas-background.jsx')
const { dynamicPatternImage } = require('./canvas-helpers.js')
const color = require('./color.js')

module.exports = FilterControl

const background = {
  default: dynamicPatternImage({
    color: color.alternate,
    circle: false,
  }),
  active: dynamicPatternImage({
    color: color.primary,
    color2: color.alternate,
    circle: false,
  }),
}

function FilterControl ({ filterControlsAreShowing, onClick }) {
  return (
    <CanvasBackground
      className={classname({
        control: true,
        'state--active': filterControlsAreShowing,
      })}
      onClick={onClick}
      draw={background.default}>
      <span>🕵️</span>
    </CanvasBackground>
  )
}

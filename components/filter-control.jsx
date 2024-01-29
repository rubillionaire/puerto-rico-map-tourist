import React, {
  useState,
} from 'react'
import classname from 'classnames'
import CanvasBackground from './canvas-background.jsx'
import { dynamicPatternImage } from '../util/canvas.js'

const color = require('../constants/color.js')

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
      className={classname('control', {
        'state--active': filterControlsAreShowing,
      })}
      onClick={onClick}
      draw={background.default}>
      <span>🕵️</span>
    </CanvasBackground>
  )
}

export default FilterControl

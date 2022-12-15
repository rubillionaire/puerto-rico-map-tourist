import React, {
  useState,
} from 'react'
const classname = require('classnames')
const CanvasBackground = require('./canvas-background.jsx')
const {
  dotPatternImageRect,
  dynamicPatternImage,
} = require('../util/canvas.js')
const color = require('../constants/color.js')

module.exports = FilterPane

function FilterPane ({ poiEmojis, filteredEmoji, toggleFilteredEmoji, showing }) {
  return (
    <div className={classname({
      "filter-pane-wrapper": true,
      "filter-pane--showing": showing,
    })}>
      <CanvasBackground
        className={classname({
          "filter-pane": true,
        })}
        draw={dynamicPatternImage({
          color: color.alternate,
          circle: false,
        })}>
        <div className="filter-pane-controls">
          {poiEmojis.map((emoji) => {
            return (
              <CanvasBackground className={classname({
                  control: true,
                  'state--active': filteredEmoji.includes(emoji) || filteredEmoji.length === 0,
                })}
                key={`filter-pane-control-${emoji}`}
                draw={dynamicPatternImage({
                  color: color.alternate,
                  circle: false,
                })}
                onClick={() => {
                  toggleFilteredEmoji(emoji)
                }}>
                <span>{emoji}</span>
              </CanvasBackground>
            )
          })}
        </div>
      </CanvasBackground>
    </div>
  )
}

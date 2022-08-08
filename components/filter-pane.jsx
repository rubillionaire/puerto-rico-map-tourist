import React, {
  useState,
} from 'react'
const classname = require('classnames')
const CanvasBackground = require('./canvas-background.jsx')
const {
  dotPatternImageRect,
  dynamicPatternImage,
} = require('./canvas-helpers.js')
const color = require('./color.js')

module.exports = FilterPane

function FilterPane ({ poiEmojis, filteredEmoji, toggleFilteredEmoji }) {
  return (
    <div className="filter-pane-wrapper">
      <CanvasBackground
        className={classname({
          "filter-pane": true,
        })}
        draw={dynamicPatternImage({
          color: color.primary,
          circle: false,
        })}>
        <div className="filter-pane-controls">
          {poiEmojis.map((emoji) => {
            return (
              <CanvasBackground className={classname({
                  control: true,
                  'state--active': filteredEmoji.includes(emoji) || filteredEmoji.length === 0,
                })}
                draw={dotPatternImageRect}
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

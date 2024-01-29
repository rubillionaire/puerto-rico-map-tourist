import React from 'react'
import InfoPaneCard from './info-pane-card.jsx'
import CanvasBackground from './canvas-background.jsx'
import { dotPatternImageRect } from '../util/canvas.js'

const InfoPane = ({
  infoPaneState,
  swipeHandlers,
  handleOnClick,
  activePoi
}) => {
  return (
    <CanvasBackground
      key="info-pane"
      className={`info-pane state--${infoPaneState}`}
      draw={dotPatternImageRect}
      swipeHandlers={swipeHandlers}
      >
      <div
        key="info-pane__handle"
        className="info-pane__handle"
        onClick={handleOnClick}
        >
        <div className="info-pane__handle-pill"></div>
      </div>
      <div
        key="info-pane__content"
        className="info-pane__content">
        <InfoPaneCard poi={activePoi} />
      </div>
    </CanvasBackground>
  )
}

export default InfoPane

import React, {
  useState,
} from 'react'
const classname = require('classnames')
const CanvasBackground = require('./canvas-background.jsx')
const { dotPatternImageRect } = require('./canvas-helpers.js')

module.exports = Geolocation

function Geolocation ({
  enableHighAccuracy=true,
  maximumAge=0,
  timeout=Infinity,
  onCoordinatesChange=() => undefined,
  onStopWatching=() => undefined,
} = {}) {
  const [id, setId] = useState(-1)
  const [watching, setWatching] = useState(false)
  let coordinates = {
    longitude: 0,
    latitude: 0,
  }
  let firstReading = true

  function watch () {
    const _id = navigator.geolocation.watchPosition(
      watchSuccess,
      watchError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      }
    )
    setId(_id)
    setWatching(true)
  }

  function watchSuccess (position) {
    if (position.coords.longitude === coordinates.longitude &&
      position.coords.latitude === coordinates.latitude)
      return
    coordinates.latitude = position.coords.latitude
    coordinates.longitude = position.coords.longitude
    onCoordinatesChange({
      ...coordinates,
      firstReading,
    })
    firstReading = false
  }

  function watchError (error) {
    stopWatching()
  }

  function stopWatching () {
    navigator.geolocation.clearWatch(id)
    setWatching(false)
    firstReading = true
    onStopWatching()
  }

  return (
    <CanvasBackground
      className={classname({
        control: true,
        'state--watching': watching,
      })}
      onClick={function () {
        if (watching) {
          stopWatching()
        }
        else {
          watch()
        }
      }}
      draw={dotPatternImageRect}>
      <span>📍</span>
    </CanvasBackground>
  )
}
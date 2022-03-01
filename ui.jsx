/*

app
  - controls
    × zoom to pr
    × zoom to current location
    - search?
  - map
    × emit selected-feature
    × display current location
  - info pane
    × capture map:selected-feature to display info in pane

- consider visual language
  - how to do symbols for poi?
    - only one symbol style allowed
    - might have to do an inactive data layer where the symbols
    is the background with the emoji text rendered over it within
    the canvas
    - add another "active-poi" layer that gets added/removed on
    click like the geolocation, but this time its just the selected
    location
  - have the info pane match the visual theme
    - also use a dot pattern?

 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { render} from 'react-dom';
import { Map, Source, Layer } from 'react-map-gl'
import { useSwipeable } from 'react-swipeable'
const classname = require('classnames')

const config = require('./config.js')
const poi = require('./data.js').map(d => {
  return {
    ...d,
    'icon-active': `active-${d.icon}`,
    coordinates: d.coordinates.reverse(),
  }
})

const colors = {
  inactive: 'rgb(246, 0, 255)',
  active: 'rgb(254, 255, 0)',
}

const circleRadius = 12
const circleDiameter = circleRadius * 2

const poiToGeojson = (selectedId=-1) => {
  return {
    type: 'FeatureCollection',
    features: poi.map((d, i) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: d.coordinates,
        },
        properties: {
          ...d,
        },
        id: i,
      }
    }),
  }
}

const poiGeojson = poiToGeojson()

const emojis = poi
  .map(d => d.icon)
  .concat(['📍'])
  .reduce((accumulator, current) => {
    if (accumulator.indexOf(current) === -1) accumulator.push(current)
    return accumulator
  }, [])
const emojiImage = EmojiImages()
const emojiImageDotPattern = EmojiImagesWithBackground({
  width: circleDiameter,
  height: circleDiameter,
  drawBackground: dotPatternImage,
  emojiSize: 12,
})
const emojiImageCircleImage = EmojiImagesWithBackground({
  width: circleDiameter,
  height: circleDiameter,
  drawBackground: circleImage,
  emojiSize: 12,
})

function EmojiImages ({ width=16, height=16, fontSize=12 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.font = `${fontSize}px Arial`
  return (emoji) => {
    context.clearRect(0, 0, width, height)
    context.fillText(emoji, 0, fontSize)
    return context.getImageData(0, 0, width, height)
  }
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
    drawBackground({ width, height, context, color: colors.inactive })
    context.fillText(emoji, (width - (emojiSize + (width * 0.1)))/2, ((height - (emojiSize + (height * 0.1)))/2) + emojiSize)
    return context.getImageData(0, 0, width, height)
  }
}

function Canvas ({ draw, width, height }) {
  const canvas = useRef()

  useEffect(() => {
    console.log('canvas:effect')
    const context = canvas.current.getContext('2d')
    draw({ context, width, height })
  }, [width, height])

  return (
    <canvas ref={canvas} height={height} width={width}></canvas>
  )
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
  color=colors.active,
}) {
  const radius = width / 2
  const center = { x: radius, y: radius }
  context.clearRect(0, 0, width, height)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if ((distance({ x, y }, center) <= radius) &&
          (x % 2 === 0 && y % 2 === 0)) {
        context.fillStyle = color
        context.fillRect(x, y, 1, 1)  
      }
    }
  }
}

function circleImage ({
  context,
  width,
  height,
  color=colors.active,
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

function imageFactory ({ draw, width, height }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  draw({ context, width, height })
  return context.getImageData(0, 0, width, height)
}

function MapControl ({
  className,
  onClick,
  icon,
}) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  })

  const controlRef = useRef()

  useEffect(() => {
    console.log('geolocation:effect')
    const bbox = controlRef.current.getBoundingClientRect()
    setCanvasDimensions({
      width: bbox.width,
      height: bbox.height,
    })
  }, [controlRef])

  return (
    <div
      ref={controlRef}
      className={className}
      onClick={onClick}
      >
      <Canvas
        { ...canvasDimensions }
        draw={dotPatternImage} />
      <span>{icon}</span>
    </div>
  )
}

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
    console.log('geolocation:watch')
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
    console.log(`geolocation:success:`, id)
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
    console.log(`geolocation:error:${error.code}:${error.message}`)
    stopWatching()
  }

  function stopWatching () {
    console.log(`geolocation:stop-watching:`, id)
    navigator.geolocation.clearWatch(id)
    setWatching(false)
    firstReading = true
    onStopWatching()
  }

  return (
    <MapControl
      icon={'📍'}
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
      />
  )
}

// const poiCircleStyle = {
//   id: 'poi-circle',
//   type: 'circle',
//   source: 'poi',
//   paint: {
//     'circle-radius': circleRadius,
//     'circle-color': [
//       'case',
//         ['boolean', ['feature-state', 'selected'], false], colors.active,
//         colors.inactive,
//     ],
//   },
// }

const poiIconStyle = {
  id: 'poi-icon',
  type: 'symbol',
  source: 'poi',
  layout: {
    'icon-image': ['get', 'icon'],
    'icon-allow-overlap': true,
    'symbol-sort-key': 1,
  },
}

const poiIconActiveStyle = {
  id: 'poi-active-icon',
  type: 'symbol',
  source: 'poi-active',
  layout: {
    'icon-image': ['get', 'icon-active'],
    'symbol-sort-key': 2,
  },
}

const geolocationCircleStyle = {
  id: 'geolocation-circle',
  type: 'circle',
  source: 'geolocation',
  paint: {
    'circle-radius': circleRadius,
    'circle-color': colors.active,
  },
}

const geolocationIconStyle = {
  id: 'geolocation-icon',
  type: 'symbol',
  source: 'geolocation',
  layout: {
    'icon-image': '📍',
  },
}

const MAPBOX_TOKEN = config.mapboxToken

function Root () {
  const viewPuertoRico = {
    latitude: 18.252046,
    longitude: -66.478086,
    zoom: 7,
  }

  const [viewState, setViewState] = useState(viewPuertoRico)

  const [selectedFeature, setSelectedFeature] = useState(undefined)
  // [hiding, preview, full]
  const [infoPaneState, setInfoPaneState] = useState('hiding')
  const infoPaneStateMachine = {
    hiding: {
      selectFeature: () => setInfoPaneState('preview'),
    },
    preview: {
      selectFeature: () => setInfoPaneState('preview'),
      clickHandle: () => setInfoPaneState('full'),
      swipeUp: () => setInfoPaneState('full'),
      swipeDown: () => setInfoPaneState('hiding'),
    },
    full: {
      clickHandle: () => setInfoPaneState('hiding'),
      swipeUp: () => setInfoPaneState('full'),
      swipeDown: () => setInfoPaneState('preview'),
    }
  }
  const infoPaneSwipeHandlers = useSwipeable({
    onSwipedUp: () => infoPaneStateMachine[infoPaneState].swipeUp(),
    onSwipedDown: () => infoPaneStateMachine[infoPaneState].swipeDown(),
  })

  let selectedFeatureId = null
  let mapRef = useRef()

  const onPOIFeatureSelect = (selectedFeatureId) => {
    setSelectedFeature(selectedFeatureId)
    infoPaneStateMachine[infoPaneState].selectFeature() 
  }

  const mapLayerOnClick = useCallback(evt => {
    if (evt.features.length === 0) return
    const map = mapRef.current.getMap()
    selectedFeatureId = evt.features[0].id
    onPOIFeatureSelect(selectedFeatureId)
    const feature = poi[selectedFeatureId]
    const poiActiveData = {
      type: 'Feature',
      geometry: { 
        type: 'Point',
        coordinates: feature.coordinates,
      },
      properties: { ...feature },
      id: selectedFeatureId,
    }
    let source = map.getSource('poi-active')
    if (source) {
      source.setData(poiActiveData)
    }
    else {
      map.addSource('poi-active', {
        type: 'geojson',
        data: poiActiveData,
      })
      map.addLayer(poiIconActiveStyle)
    }
  }, [])

  const mapOnLoad = useCallback(evt => {
    console.log('map:onload')
    // create/add all image styles
    const map = mapRef.current.getMap()
    emojis.map(emoji => {
      map.addImage(emoji, emojiImageDotPattern(emoji))
      map.addImage(`active-${emoji}`, emojiImageCircleImage(emoji))
    })
  })

  return (
    <div className="app">
      <Map
        id="poiMap"
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        className="map"
        key="map"
        mapStyle="mapbox://styles/rubonics/cl06vwn7b000p16oeic6j56by"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={mapLayerOnClick}
        onLoad={mapOnLoad}
        interactiveLayerIds={['poi-icon']}
        >
        <Source id="poi" type="geojson" data={poiGeojson}>
          <Layer {...poiIconStyle} />
        </Source>
        <Layer {...geolocationCircleStyle} />
        <Layer {...geolocationIconStyle} />
      </Map>
      <div
        key="info-pane"
        className={classname({
          'info-pane': true,
          [`state--${infoPaneState}`]: true,
        })}
        {...infoPaneSwipeHandlers}
        >
        <div
          key="info-pane__handle"
          className="info-pane__handle"
          onClick={function () {
            infoPaneStateMachine[infoPaneState].clickHandle()
          }}
          >
          <div className="info-pane__handle-pill"></div>
        </div>
        <div
          key="info-pane__content"
          className="info-pane__content">
          { selectedFeature !== undefined
              ? (<div key="info-pane__content-wrapper">
                    <p key="info-pane__content-name">{poi[selectedFeature].icon} <strong>{poi[selectedFeature].name}</strong></p>
                    <p key="info-pane__content-operating">{poi[selectedFeature].operating}</p>
                    <ul key="info-pane__content-links">
                      { poi[selectedFeature].link.map((link, i) => {
                        return (
                          <li key={`info-pane__content-link-${i}`}>
                            <a href={link} target="_blank">
                              {textForLink(link)}
                            </a>
                          </li>
                        )
                      }) }
                    </ul>
                  </div>)
              : <p>no selected feature</p> }
        </div>
      </div>
      <div
        key="controls"
        className="controls">
        <MapControl
          icon={'🇵🇷'}
          className={"control"}
          onClick={function () {
            setViewState(viewPuertoRico)
            setInfoPaneState('hiding')
          }}
        />
        <Geolocation
          onCoordinatesChange={(coords) => {
            const map = mapRef.current.getMap()
            if (coords.firstReading) {
              {/* set map state for first reading */}
              map.addSource('geolocation', {
                type: 'geojson',
                data: {
                  type: 'Point',
                  coordinates: [coords.longitude, coords.latitude],
                }
              })
              setViewState({
                ...coords,
                zoom: 12,
              })
            }
            else {
              map.getSource('geolocation')
                .setData({
                  type: 'Point',
                  coordinates: [coords.longitude, coords.latitude],
                })
            }
          }}
          onStopWatching={() => {
            const map = mapRef.current.getMap()
            map.removeLayer('geolocation-icon')
            map.removeLayer('geolocation-circle')
            map.removeSource('geolocation')
          }}
        />
      </div>
    </div>
  )
}

const rootEl = document.createElement('div')
rootEl.id = 'root'
document.body.appendChild(rootEl)

render(<Root />, rootEl)

function textForLink (link) {
  if (link.indexOf('instagram.com') > -1) return 'instagram'
  if (link.indexOf('facebook.com') > -1) return 'facebook'
  if (link.indexOf('google.com') > -1) return 'google'
  return 'homepage'
}

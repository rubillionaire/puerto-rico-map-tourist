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

const colors = require('./components/color.js')
const {
  EmojiImagesWithBackground,
  dotPatternImageCircle,
  dotPatternImageRect,
  circleImage,
} = require('./components/canvas-helpers.js')

const CanvasBackground = require('./components/canvas-background.jsx')
const Geolocation = require('./components/geolocation.jsx')
const FilterControl = require('./components/filter-control.jsx')
const FilterPane = require('./components/filter-pane.jsx')
const InfoPaneCard = require('./components/info-pane-card.jsx')
const appleTouchIcon = require('./components/apple-touch-icon.js')()

const circleRadius = 13
const circleDiameter = circleRadius * 2

const poiToGeojson = () => {
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

const poiEmojis = poi
  .map(d => d.icon)
  .reduce((accumulator, current) => {
    if (accumulator.indexOf(current) === -1) accumulator.push(current)
    return accumulator
  }, [])

const emojiImageDotPattern = EmojiImagesWithBackground({
  width: circleDiameter,
  height: circleDiameter,
  drawBackground: dotPatternImageCircle,
  emojiSize: 12,
})
const emojiImageCircleImage = EmojiImagesWithBackground({
  width: circleDiameter,
  height: circleDiameter,
  drawBackground: circleImage,
  emojiSize: 12,
})

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
    'circle-color': colors.alternate,
  },
}

const geolocationEmoji = '📍'
const geolocationIconStyle = {
  id: 'geolocation-icon',
  type: 'symbol',
  source: 'geolocation',
  layout: {
    'icon-image': geolocationEmoji,
  },
}

const emojis = poiEmojis.concat([geolocationEmoji])

const MAPBOX_TOKEN = config.mapboxToken

function findParentNodeWithClass (node, className) {
  if (node.classList.contains(className)) return node
  return findParentNodeWithClass(node.parentNode, className)
}

function Root () {
  const viewPuertoRico = {
    latitude: 18.252046,
    longitude: -66.478086,
    zoom: 7,
  }

  const [viewState, setViewState] = useState(viewPuertoRico)
  const [filterControlsAreShowing, setFilterControlsAreShowing] = useState(false)
  const [filteredEmoji, _setFilteredEmoji] = useState([])
  const toggleFilteredEmoji = (pressedEmoji) => {
    const index = filteredEmoji.indexOf(pressedEmoji)
    if (index === -1) {
      _setFilteredEmoji(filteredEmoji.concat([pressedEmoji]))
    }
    else {
      _setFilteredEmoji(filteredEmoji.slice(0, index).concat(filteredEmoji.slice(index + 1, filteredEmoji.length)))
    }
  }

  const [selectedFeature, setSelectedFeature] = useState(undefined)
  // [hiding, preview, full]
  const [infoPaneState, setInfoPaneState] = useState('hiding')
  const infoPaneStateMachine = {
    hiding: {
      selectFeature: () => setInfoPaneState('preview'),
      swipeUp: () => setInfoPaneState('hiding'),
      swipeDown: () => setInfoPaneState('hiding'),
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
    onSwiping: (swipeEventData) => {
      swipeEventData.event.preventDefault()
      const target = findParentNodeWithClass(swipeEventData.event.target, 'info-pane')
      target.style.setProperty('--info-pane-top--swipe-deltaY', `${swipeEventData.deltaY}px`)
    },
    onSwipedUp: (swipeEventData) => {
      swipeEventData.event.preventDefault()
      const target = findParentNodeWithClass(swipeEventData.event.target, 'info-pane')
      target.style.setProperty('--info-pane-top--swipe-deltaY', `0px`)
      infoPaneStateMachine[infoPaneState].swipeUp()
    },
    onSwipedDown: (swipeEventData) => {
      swipeEventData.event.preventDefault()
      const target = findParentNodeWithClass(swipeEventData.event.target, 'info-pane')
      target.style.setProperty('--info-pane-top--swipe-deltaY', `0px`)
      infoPaneStateMachine[infoPaneState].swipeDown()
    },
  })

  let mapRef = useRef()

  const onPOIFeatureSelect = (selectedFeatureId) => {
    setSelectedFeature(selectedFeatureId)
    infoPaneStateMachine[infoPaneState].selectFeature() 
  }

  const mapLayerOnClick = useCallback(event => {
    if (event.features.length === 0) {
      return
    }
    const selectedFeatureId = event.features[0].id
    onPOIFeatureSelect(selectedFeatureId)
    
    const map = mapRef.current.getMap()

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
    setFilterControlsAreShowing(false)
  }, [])

  const mapOnLoad = useCallback(evt => {
    // create/add all image styles
    const map = mapRef.current.getMap()
    emojis.map(emoji => {
      map.addImage(emoji, emojiImageDotPattern(emoji))
      map.addImage(`active-${emoji}`, emojiImageCircleImage(emoji))
    })
  })

  useEffect(() => {
    // when the filteredEmoji changes, so should our map filter
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return
    if (filteredEmoji.length === 0) return map.setFilter('poi-icon', null)
    const matchRules = filteredEmoji.map((emoji) => {
      return ['==', ['get', 'icon'], emoji]
    })
    map.setFilter('poi-icon', ['any'].concat(matchRules))
    // deselect active icon
    let source = map.getSource('poi-active')
    if (source && (!filteredEmoji.includes(source._data.properties.icon))) {
      map.removeLayer('poi-active-icon')
      map.removeSource('poi-active')
    }
  })

  const activePoi = typeof selectedFeature === 'number'
    ? poi[selectedFeature]
    : null

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
      <CanvasBackground
        key="info-pane"
        className={classname({
          'info-pane': true,
          [`state--${infoPaneState}`]: true,
        })}
        draw={dotPatternImageRect}
        swipeHandlers={infoPaneSwipeHandlers}
        >
        <div
          key="info-pane__handle"
          className="info-pane__handle"
          onClick={function (event) {
            infoPaneStateMachine[infoPaneState].clickHandle()
          }}
          >
          <div className="info-pane__handle-pill"></div>
        </div>
        <div
          key="info-pane__content"
          className="info-pane__content">
          <InfoPaneCard poi={activePoi} />
        </div>
      </CanvasBackground>
      <div
        key="controls"
        className="controls">
        <CanvasBackground
          className={"control"}
          onClick={function () {
            setViewState(viewPuertoRico)
            setInfoPaneState('hiding')
          }}
          draw={dotPatternImageRect}>
          <span>🇵🇷</span>
        </CanvasBackground>
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
        <FilterControl {...{
          filterControlsAreShowing,
          onClick: () => {
            if (!filterControlsAreShowing) setInfoPaneState('hiding')
            setFilterControlsAreShowing(!filterControlsAreShowing)
          },
        }} />
      </div>
      <FilterPane {...{ poiEmojis, filteredEmoji, toggleFilteredEmoji, showing: filterControlsAreShowing }} />
    </div>
  )
}

const rootEl = document.createElement('div')
rootEl.id = 'root'
document.body.appendChild(rootEl)

render(<Root />, rootEl)

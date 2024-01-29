import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { render} from 'react-dom';
import { useSwipeable } from 'react-swipeable'
import { poi, poiGeojson, poiEmojis } from './data.js'
import Map, { geolocationEmoji, circleDiameter } from './components/map.jsx'
import InfoPane from './components/info-pane.jsx'
import CanvasBackground from './components/canvas-background.jsx'
import Geolocation from './components/geolocation.jsx'
import FilterControl from './components/filter-control.jsx'
import FilterPane from './components/filter-pane.jsx'
import setAppleTouchIcon from './components/apple-touch-icon.js'
import {
  EmojiImagesWithBackground,
  dotPatternImageCircle,
  dotPatternImageRect,
  circleImage,
} from './util/canvas.js'

const config = require('./config.js')
const colors = require('./constants/color.js')

const emojis = poiEmojis.concat([geolocationEmoji])

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

const poiIconActiveStyle = {
  id: 'poi-active-icon',
  type: 'symbol',
  source: 'poi-active',
  layout: {
    'icon-image': ['get', 'icon-active'],
    'symbol-sort-key': 2,
  },
}

setAppleTouchIcon()

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

  const [selectedFeature, setSelectedFeature] = useState(null)
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
      target.classList.add('state--swiping')
    },
    onSwiped: (swipeEventData) => {
      swipeEventData.event.preventDefault()
      const target = findParentNodeWithClass(swipeEventData.event.target, 'info-pane')
      target.classList.remove('state--swiping')
      target.classList.remove('state--swiping')
      if (swipeEventData.deltaY > 20) {
        infoPaneStateMachine[infoPaneState].swipeDown()
      }
      else if (swipeEventData.deltaY < -20) {
        infoPaneStateMachine[infoPaneState].swipeUp()
      }
      target.style.setProperty('--info-pane-top--swipe-deltaY', `0px`)
    }
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
  }, [filteredEmoji])

  const activePoi = typeof selectedFeature === 'number'
    ? poi[selectedFeature]
    : null

  return (
    <div className="app">
      <Map
        mapRef={mapRef}
        viewState={viewState}
        setViewState={setViewState}
        mapboxToken={config.mapboxToken}
        layerOnClick={mapLayerOnClick}
        onLoad={mapOnLoad}
      />
      <InfoPane
        infoPaneState={infoPaneState}
        swipeHandlers={infoPaneSwipeHandlers}
        handleOnClick={(event) => {
          infoPaneStateMachine[infoPaneState].clickHandle()
        }}
        activePoi={activePoi}
      />
      <nav
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
        <FilterPane {...{ poiEmojis, filteredEmoji, toggleFilteredEmoji, showing: filterControlsAreShowing }} />
      </nav>
    </div>
  )
}

const rootEl = document.createElement('div')
rootEl.id = 'root'
document.body.appendChild(rootEl)

render(<Root />, rootEl)

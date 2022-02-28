/*

app
  - controls
    × zoom to pr
    - zoom to current location
  - map
    × emit selected-feature
    - display current location
  - info pane
    × capture map:selected-feature to display info in pane

 */

import * as React from 'react'
import { useState, useCallback, useRef } from 'react'
import { render} from 'react-dom';
import { Map, Source, Layer } from 'react-map-gl'
import { useSwipeable } from 'react-swipeable'
const classname = require('classnames')

const config = require('./config.js')
const poi = require('./data.js')

const poiToGeojson = (selectedId=-1) => {
  return {
    type: 'FeatureCollection',
    features: poi.map((d, i) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: d.coordinates.reverse(),
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
  .reduce((accumulator, current) => {
    if (accumulator.indexOf(current) === -1) accumulator.push(current)
    return accumulator
  }, [])
const emojiImage = EmojiImages()

function EmojiImages ({ width=16, height=16, fontSize=12 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px Arial`
  return (emoji) => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillText(emoji, 0, fontSize)
    return ctx.getImageData(0, 0, width, height)
  }
}

function Geolocation ({
  enableHighAccuracy=true,
  maximumAge=0,
  timeout=Infinity,
  onCoordinatesChange=() => undefined,
  onStopWatching=() => undefined,
} = {}) {
  let id
  const [watching, setWatching] = useState(false)
  let coordinates = {
    longitude: 0,
    latitude: 0,
  }
  let firstReading = true

  function watch () {
    console.log('geolocation:watch')
    console.log(enableHighAccuracy)
    console.log(maximumAge)
    console.log(timeout)
    id = navigator.geolocation.watchPosition(
      watchSuccess,
      watchError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      }
    )
    setWatching(true)
  }

  function watchSuccess (position) {
    console.log(`geolocation:success`)
    setWatching(true)
    if (position.coords.longitude === coordinates.longitude &&
      position.coords.latitude === coordinates.latitude)
      return
    coordinates = position.coords
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
    console.log(`geolocation:stop-watching`)
    navigator.geolocation.clearWatch(id)
    setWatching(false)
    firstReading = true
    onStopWatching()
  }

  return (
    <div
      key="control--location"
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
      >📍</div>
  )
}


const circleStyle = {
  id: 'poi-circle',
  type: 'circle',
  source: 'poi',
  paint: {
    'circle-radius': 12,
    'circle-color': [
      'case',
        ['boolean', ['feature-state', 'selected'], false], 'blue',
        'red',
    ],
  },
}

const iconStyle = {
  id: 'poi-icon',
  type: 'symbol',
  source: 'poi',
  layout: {
    'icon-image': ['get', 'icon'],
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
    if (selectedFeatureId) {
      map.setFeatureState(
        {source: 'poi', id: selectedFeatureId},
        {selected: false}
      )
    }
    selectedFeatureId = evt.features[0].id
    map.setFeatureState(
      {source: 'poi', id: selectedFeatureId},
      {selected: true}
    )
    onPOIFeatureSelect(selectedFeatureId)
  }, [])

  const mapOnLoad = useCallback(evt => {
    const map = mapRef.current.getMap()
    emojis.map(emoji => {
      map.addImage(emoji, emojiImage(emoji))  
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
        mapStyle="mapbox://styles/rubonics/cj7t99nx410b22sqebek9vqo6"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={mapLayerOnClick}
        onLoad={mapOnLoad}
        interactiveLayerIds={['poi-circle']}
        >
        <Source id="poi" type="geojson" data={poiGeojson}>
          <Layer {...circleStyle} />
          <Layer {...iconStyle} />
        </Source>
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
                    <p key="info-pane__content-name">{data[selectedFeature].icon} <strong>{data[selectedFeature].name}</strong></p>
                    <p key="info-pane__content-operating">{data[selectedFeature].operating}</p>
                    <ul key="info-pane__content-links">
                      { data[selectedFeature].link.map((link, i) => {
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
        <div
          key="control--overview"
          className="control"
          onClick={function () {
            setViewState(viewPuertoRico)
            setInfoPaneState('hiding')
          }}
          >🇵🇷</div>
          <Geolocation
            onCoordinatesChange={(coords) => {
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

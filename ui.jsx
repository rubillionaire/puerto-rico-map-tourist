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
import {useState, useCallback, useRef} from 'react'
import {render} from 'react-dom';
import {Map, Marker, Source, Layer, MapProvider, useMap} from 'react-map-gl'
import { useSwipeable } from 'react-swipeable'
const classname = require('classnames')

const data = require('./data.js')

const toGeojson = (selectedId=-1) => {
  return {
    type: 'FeatureCollection',
    features: data.map((d, i) => {
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

const geojson = toGeojson()

const emojis = data
  .map(d => d.icon)
  .reduce((accumulator, current) => {
    if (accumulator.indexOf(current) === -1) accumulator.push(current)
    return accumulator
  }, [])
const emojiImage = EmojiImages()

function EmojiImages ({ width=16, height=16, fontSize=12 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px Arial`
  return (emoji) => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillText(emoji, 0, fontSize)
    return ctx.getImageData(0, 0, width, height)
  }
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

const MAPBOX_TOKEN = 'pk.eyJ1IjoicnVib25pY3MiLCJhIjoicmlqRkZQUSJ9.VGSxALM4Gful6RHFSWDYmQ'

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
      <MapProvider>
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
          <Source id="poi" type="geojson" data={geojson}>
            <Layer {...circleStyle} />
            <Layer {...iconStyle} />
          </Source>
        </Map>
      </MapProvider>
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

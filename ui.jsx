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

const layerStyle = {
  id: 'poi',
  type: 'circle',
  paint: {
    'circle-radius': 10,
    'circle-color': [
      'case',
        ['boolean', ['feature-state', 'selected'], false], 'blue',
        'red',
    ],
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
          interactiveLayerIds={['poi']}
          >
          <Source id="poi" type="geojson" data={geojson}>
            <Layer {...layerStyle} />
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

import React from 'react'
import { Map as MapboxMap, Source, Layer } from 'react-map-gl'
import {
  EmojiImagesWithBackground,
  dotPatternImageCircle,
  dotPatternImageRect,
  circleImage,
} from '../util/canvas.js'
import { poiGeojson, poiEmojis } from '../data.js'

const colors = require('../constants/color.js')

export const circleRadius = 13
export const circleDiameter = circleRadius * 2

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

const geolocationCircleStyle = {
  id: 'geolocation-circle',
  type: 'circle',
  source: 'geolocation',
  paint: {
    'circle-radius': circleRadius,
    'circle-color': colors.alternate,
  },
}

export const geolocationEmoji = '📍'

const geolocationIconStyle = {
  id: 'geolocation-icon',
  type: 'symbol',
  source: 'geolocation',
  layout: {
    'icon-image': geolocationEmoji,
  },
}

const Map = ({ mapRef, mapboxToken, layerOnClick, onLoad, viewState, setViewState }) => {
  return (
    <MapboxMap
      id="poiMap"
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      className="map"
      key="map"
      mapStyle="mapbox://styles/rubonics/cl06vwn7b000p16oeic6j56by"
      mapboxAccessToken={mapboxToken}
      onClick={layerOnClick}
      onLoad={onLoad}
      interactiveLayerIds={['poi-icon']}
      >
      <Source id="poi" type="geojson" data={poiGeojson}>
        <Layer {...poiIconStyle} />
      </Source>
      <Layer {...geolocationCircleStyle} />
      <Layer {...geolocationIconStyle} />
    </MapboxMap>
  )
}

export default Map

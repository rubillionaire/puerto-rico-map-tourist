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

import * as React from 'react';
import {render} from 'react-dom';
import Map, {Marker} from 'react-map-gl'
import { useSwipeable } from 'react-swipeable';
const classname = require('classnames')

const data = require('./data.js')

const MAPBOX_TOKEN = 'pk.eyJ1IjoicnVib25pY3MiLCJhIjoicmlqRkZQUSJ9.VGSxALM4Gful6RHFSWDYmQ'

function Root () {
  const viewPuertoRico = {
    latitude: 18.252046,
    longitude: -66.478086,
    zoom: 7,
  }

  const [viewState, setViewState] = React.useState(viewPuertoRico)

  const [selectedFeature, setSelectedFeature] = React.useState(undefined)
  // [hiding, preview, full]
  const [infoPaneState, setInfoPaneState] = React.useState('hiding')
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

  return (
    <div className="app">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        className="map"
        key="map"
        mapStyle="mapbox://styles/rubonics/cj7t99nx410b22sqebek9vqo6"
        mapboxAccessToken={MAPBOX_TOKEN}>
        { data.map((d, i) => {
          return (
            <Marker
              key={`marker-${i}`}
              longitude={d.coordinates[1]}
              latitude={d.coordinates[0]}
              color={selectedFeature === i ? "red" : "blue"}
              onClick={() => {
                setInfoPaneState('preview')
                setSelectedFeature(i)
              }}
             />
          )
        }) }
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

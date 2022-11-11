import React from 'react'

module.exports = InfoPaneCard

function InfoPaneCard ({ poi }) {
  if (!poi) return null
  let infoPaneDescription = poi.description
    ? <hgroup>
        <h6>description</h6>
        <div dangerouslySetInnerHTML={{__html: poi.description }} ></div>
      </hgroup>
    : null
  let infoPaneOperating = poi.operating
    ? <hgroup>
        <h6>hours</h6>
        <p key="info-pane__content-operating">{poi.operating}</p>
      </hgroup>
    : null
  let infoPaneAddress = poi.address
    ? <hgroup>
         <h6>address</h6>
         <p key="info-pane__content-address">{poi.address}</p>
       </hgroup>
    : null
  let infoPaneLinks = Array.isArray(poi.link) && poi.link.length > 0
    ? <ul key="info-pane__content-links">
        <h6>links</h6>
        { poi.link.map((link, i) => {
          return (
            <li key={`info-pane__content-link-${i}`}>
              <a href={link} target="_blank">
                {textForLink(link)}
              </a>
            </li>
          )
        }) }
      </ul>
    : null
  return (
    <div key="info-pane__content-wrapper">
      <h1 key="info-pane__content-name">{poi.icon}&nbsp;&nbsp;{poi.name}</h1>
      {infoPaneDescription}
      {infoPaneOperating}
      {infoPaneAddress}
      {infoPaneLinks}
    </div>)
}

function textForLink (link) {
  if (link.indexOf('instagram.com') > -1) return 'instagram'
  if (link.indexOf('facebook.com') > -1) return 'facebook'
  if (link.indexOf('google.com') > -1) return 'google'
  if (link.indexOf('alltrails.com') > -1) return 'all trails'
  return 'homepage'
}

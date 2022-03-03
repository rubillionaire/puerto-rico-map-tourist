import React, {
  useRef,
  useEffect,
} from 'react'

module.exports = Canvas

function Canvas ({ draw, width, height }) {
  const canvas = useRef()

  useEffect(() => {
    const context = canvas.current.getContext('2d')
    draw({ context, width, height })
  }, [width, height])

  return (
    <canvas ref={canvas} height={height} width={width}></canvas>
  )
}
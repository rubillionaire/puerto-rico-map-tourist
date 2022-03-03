import React, {
  useRef,
  useEffect,
  useState,
} from 'react'
const Canvas = require('./canvas.jsx')

module.exports = CanvasBackground

function CanvasBackground ({
  className,
  onClick,
  icon,
  swipeHandlers,
  redrawDependencies=[],
  draw=dotPatternImage,
  ...props
}) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  })

  const controlRef = useRef()

  const refPassthrough = (el) => {
    if (swipeHandlers) swipeHandlers.ref(el)
    controlRef.current = el
  }

  useEffect(() => {
    const bbox = controlRef.current.getBoundingClientRect()
    setCanvasDimensions({
      width: bbox.width,
      height: bbox.height,
    })
  }, [controlRef].concat(redrawDependencies))

  return (
    <div
      ref={refPassthrough}
      className={className}
      onClick={onClick}
      >
      <Canvas
        { ...canvasDimensions }
        draw={draw} />
      {props.children}
    </div>
  )
}
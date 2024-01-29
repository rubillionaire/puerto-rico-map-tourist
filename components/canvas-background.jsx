import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react'
const Canvas = require('./canvas.jsx')
const { dotPatternImage } = require('../util/canvas')

function CanvasBackground ({
  className,
  onClick,
  icon,
  swipeHandlers,
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

  const updateCanvasDimensions = useCallback(() => {
    if (!controlRef.current) return
    const bbox = controlRef.current.getBoundingClientRect()
    setCanvasDimensions({
      width: bbox.width,
      height: bbox.height,
    })
  })

  useEffect(() => {
    updateCanvasDimensions()
    window.addEventListener('resize', updateCanvasDimensions)    
    return () => {
      window.removeEventListener('resize', updateCanvasDimensions)
    }
  }, [controlRef.current])

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

export default CanvasBackground

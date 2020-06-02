import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useSpring } from 'react-spring'
import { Image } from 'react-konva'
import useImage from 'use-image'

let cache = {}

const URLImage = ({ data, onClick, idx }, ref) => {
  const { x, y, slug } = data
  const cardRef = useRef(null)
  const [{ scale }, set] = useSpring(() => ({ scale: 1, visibility: 'visible' }))
  const [image] = useImage(data.img)
  const [width, setWidth] = useState(400)
  const [height, setHeight] = useState(400)

  const setDimensions = () => {
    const maxSide = 400
    let ratio = 0
    let width = image ? image.width : maxSide
    let height = image ? image.height : maxSide

    if (width > maxSide) {
      ratio = maxSide / width
      width = maxSide
      height = height * ratio
    }

    cache[`${idx}`] = { width, height}

    setWidth(width)
    setHeight(height)
  }

  useImperativeHandle(ref, () => ({
    // Returns the starting style of the card. It accounts for the scale
    // applied to it when it's called.
    getStyle: winWidth => {
      const s = scale.get()
      const { width, height, x, y } = cardRef.current.getClientRect()

      return {
        width: width / s,
        height: height / s,
        x: x - (winWidth - width) / 2,
        y: y - (height / s - height) / 2,
        scale: s
      }
    },
    set,
    slug
  }))

  useEffect(() => {
    if (image !== undefined) {
      setDimensions()
    }
  }, [image])

  return (
    <Image
      ref={cardRef}
      x={x}
      y={y}
      width={width}
      height={height}
      image={image}
      onClick={onClick}
      onMouseEnter={() => {
        document.body.style.cursor = "pointer";
      }}
      onMouseLeave={() => {
        document.body.style.cursor = "default";
      }}
    />
  )
}

export default forwardRef(URLImage)

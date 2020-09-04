import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useSpring } from 'react-spring'
import { Image } from 'react-konva'
import useImage from 'use-image'

let cache = {}

const URLImage = ({ data, onClick, idx }, ref) => {
  const { y, slug, prevHeight } = data
  const cardRef = useRef(null)
  const [{ scale }, set] = useSpring(() => ({ scale: 1, visibility: 'visible' }))
  const [image] = useImage(data.img)
  const [width, setWidth] = useState(300)
  const [height, setHeight] = useState(300)
  const [x, setX] = useState(window.innerWidth / 2)

  const setDimensions = () => {
    const maxSide = 200
    const gap = 80
    let ratio = 0
    let width = image ? image.width : maxSide
    let height = image ? image.height : maxSide
    let newX = (window.innerWidth - (maxSide * 4)) / 2
    let newY = 0

    if (width > maxSide) {
      ratio = maxSide / width
      width = maxSide
      height = height * ratio
    }

    cache[`${idx}`] = { width, height}

    // if (idx % 3 !== 0) {
    //   newY = (prevHeight * ratio) + (gap * (idx % 3))
    //   setY(newY)
    //   console.log(idx, newY, cache[idx - 1])
    // }

    switch (idx) {
      case 0:
      case 1:
      case 2:
      case 3:
        newX = ((window.innerWidth - (maxSide * 5 + gap * 4)) / 2)
        setX(newX)
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        newX = ((window.innerWidth - (maxSide * 5 + gap * 4)) / 2) + ((maxSide + gap) * 1)
        setX(newX)
        break;
      case 8:
      case 9:
      case 10:
      case 11:
        newX = ((window.innerWidth - (maxSide * 5 + gap * 4)) / 2) + ((maxSide + gap) * 2)
        setX(newX)
        break;
      case 12:
      case 13:
      case 14:
      case 15:
        newX = ((window.innerWidth - (maxSide * 5 + gap * 4)) / 2) + ((maxSide + gap) * 3)
        setX(newX)
        break;
      case 16:
      case 17:
      case 18:
        newX = ((window.innerWidth - (maxSide * 5 + gap * 4)) / 2) + ((maxSide + gap) * 4)
        setX(newX)
        break;
      default:

    }

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

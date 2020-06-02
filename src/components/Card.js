import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { a, useSpring } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import data from './data'

const Card = ({ index, onClick }, ref) => {
  const { img, title, category, slug } = data[index]
  const cardRef = useRef(null)
  const [{ scale, visibility }, set] = useSpring(() => ({ scale: 1, visibility: 'visible' }))

  // Handles the scale of the card when the mouse presses the card.
  const bind = useDrag(({ down }) => set({ scale: down ? 0.92 : 1 }))

  // This hook will add convenience functions to the card ref when,accessed
  //from the Page component. This will let us write `cardRef.getStyle()`
  useImperativeHandle(ref, () => ({
    // Returns the starting style of the card. It accounts for the scale
    // applied to it when it's called.
    getStyle: winWidth => {
      const s = scale.get()
      const { width, height, x, y } = cardRef.current.getBoundingClientRect()

      return {
        width: width / s,
        height: height / s,
        // Since the animated container is itself contained in a flex wrapper
        // that centers its element, the x position should take its natural
        // position into account (winWidth - width) / 2 to measure how much it
        // should travel.
        x: x - (winWidth - width) / 2,
        y: y - (height / s - height) / 2,
        scale: s
      }
    },
    set,
    slug
  }))

  return (
    <a.div
      ref={cardRef}
      {...bind()}
      onClick={() => onClick(index)}
      style={{ visibility, backgroundImage: `url(${img})`, scale }}
    >
      <div className="title">
        <h3>{category}</h3>
        <h2>{title}</h2>
      </div>
    </a.div>
  )
}

export default forwardRef(Card)

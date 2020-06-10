import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { useSpring, a, config } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import { CSSTransition } from 'react-transition-group'
import { useWindowWidth } from '@react-hook/window-size'
import { useStore } from '../index'
import data from './data'

// Limit at which the exit transition triggers on drag
const DRAG_LIMIT = 100
// The scale which will be applied when exiting on drag
const DRAG_MINIMUM_SCALE = 0.9

// start is the initial state
// end is the entered state
const startBase = { scale: 1, opacity: 0, scroll: 0, fh: 350 }
const endBase = { x: 0, y: 0, scale: 1, opacity: 1, fh: 500 }
const defaultStart = { width: 375, x: 0, y: 0, height: 350, /*position: 'relative',*/ visibility: 'hidden' }

function Page({ index, getOpenedCard, in: inProp, ...props }) {
  const { img: cover, title, content } = data[index]
  const coverRef = useRef()
  const ref = useRef(null) // Our main dom Ref
  const isDragging = useRef(false)
  const transitionOver = useRef(false)
  const touchEnded = useRef(false)
  const transitioningFromDrag = useRef(false)
  const endResolve = useRef()
  const [endPromise] = useState(
    () =>
      new Promise(resolve => {
        endResolve.current = resolve
      })
  )

  const [invertClose, setInvertClose] = useState(false)

  const winWidth = useWindowWidth()
  const maxWidth = Math.min(winWidth, winWidth)

  const endNav = useStore(state => state.endNav)

  // Navigate fn
  const navigate = useStore(state => state.navigate)

  // Our main animation spring that will animate everything
  const [spring, set] = useSpring(() => ({ ...defaultStart, ...startBase }))
  const { fh, opacity, position, ...style } = spring

  // Handles page responsive mode
  useEffect(() => void transitionOver.current && set({ width: maxWidth }), [maxWidth, set])

  const execTrans = useCallback(
    done => {
      let anim

      const startStyle = getOpenedCard(index).getStyle(winWidth)

      // If the page is entering the tree, we want to hide
      // the card thumbnail, and show our page
      if (inProp) {
        anim = {
          // now that we know the current exact position of the card ref
          // we set it as the base style of our page, and right when the
          // animation starts we toggle the visibility between the card ref
          // and the page, so that only the page is now visible.
          from: startStyle,
          to: { ...endBase, width: maxWidth, height: window.innerHeight, visibility: 'visible' },
          onStart: ({ key }) => {
            if (key === 'width') {
              getOpenedCard(index).set({ visibility: 'hidden' })
              set({ visibility: 'visible' })
            }
          }
        }
      }
      // When the page is exiting, we need to store the current
      // scroll position, hide the overflow of our page so that we can perform
      // border-radius and height animation.
      // We do this declaratively since we don't want any flicker to happen
      // and dealing with React lifecycle is becoming a headache
      else {
        const scroll = window.scrollY

        // If we're transitioning from drag, we need to account for the scrollY
        // when the user releases his finger.
        if (transitioningFromDrag.current) startStyle.y += scroll
        else {
          ref.current.classList.add('drag') // adds overflow:hidden and box-shadow
          ref.current.scrollTo(0, scroll)
          window.scrollTo(0, 0)
        }

        console.log(ref.current)
        anim = {
          from: { scroll },
          to: { ...startStyle, ...startBase },
          // We reset the onStart function
          onStart: () => {},
          // When exitining, we want also the page to scroll back to 0, hence the `onFrame` fn.
          onFrame: ({ scroll }) => document.documentElement.scrollTo(0, scroll)
        }
      }

      // Let's start the animation!
      set({
        to: async next => {
          // First let's wait for our main animation to complete
          // so that we can do some cleanup
          await next(anim)

          // When the page is exiting we need to show the card thumb back and
          // and hide our page.
          if (!inProp) {
            if (transitioningFromDrag.current) await endPromise
            getOpenedCard(index).set({ visibility: 'visible' })
            await next({ visibility: 'hidden' })
          } else transitionOver.current = true

          // Tells our store that the navigation is over (this will
          // also unlock the body scroll)
          endNav()

          // tells our CSSTransition component that the animation
          // is over and that it can unmount in the case it was
          // an exiting animation.
          done()
        }
      })
    },
    [inProp, set, getOpenedCard, index, endNav, endPromise, winWidth, maxWidth]
  )

  // This will be called by the CSSTransition component
  // to handle its animation. Because for some weird reason
  // the cover of the Page isn't in cache, we need to wait
  // for it to load before actually executing the transition
  // animation
  const animListener = useCallback(
    (_, done) => {
      // For some reason, the cover image, even though would be already
      // loaded from the list page, might not be in cache in Safari. If
      // we would start the animation right away, there could be a white
      // flash.

      // If this is an exiting transition, we obiously don't need
      // to wait for the cover to load
      if (!inProp) return execTrans(done)

      // Create an image
      const img = new Image()
      // Set its source to the source of the page cover
      img.src = `${cover}`
      // If the image is in cache execute the transition
      if (img.complete) return execTrans(done)
      // If not, wait for the image to load and execute the transition
      img.onload = () => execTrans(done)
    },
    [inProp, cover, execTrans]
  )

  // Utility function that adds or remove the drag class to our page
  // ref depending on whether isDragging is true or not.
  const setDragging = flag => {
    isDragging.current = flag
    ref.current.classList[flag ? 'add' : 'remove']('drag')
  }

  // Binding from react-use-gesture
  const bind = useGesture(
    {
      // Here is what happens on drag
      onDrag: ({ movement: [, y], delta: [, dy], down, memo = window.scrollY }) => {
        // This is a tricky bit: when the page is transitioning from drag
        // we "wait" until the user releases its finger / mouse (ie `down === false`)
        // then if the window scrollY is already set to 0, that's fine we can directly
        // resolve the promise that will then trigger the transition to complete.
        // If the window scrollY is *not* equal to zero, then we set the touchEnd flag
        // to true, so that our onScroll listener can resolve the promise on its own.
        if (transitioningFromDrag.current) {
          if (!down) window.scrollY === 0 ? endResolve.current() : (touchEnded.current = true)
          return
        }

        // When the page is exiting, or when the scroll is strictly positive
        // or when we're dragging upwards, we don't want anything to happen.
        if (!inProp || y - memo <= 0 || (!isDragging.current && dy <= 0)) return memo

        // We set dragging to true and add the drag class
        if (!isDragging.current) setDragging(true)

        // ...we calculate the progress
        const progress = (y - memo) / DRAG_LIMIT

        // When the progress is greater than 1, we trigger the drag transition
        // and navigate back to the list page
        if (progress > 1) {
          transitioningFromDrag.current = true
          navigate('', ref.current)
        }
        // Otherwise, while the mouse / finger is pressed, we set the scale and
        // border radius according to the progress
        else if (down)
          set({
            scale: 1 - progress * (1 - DRAG_MINIMUM_SCALE),
            immediate: true
          })
        // If the button is released, we reset the page style, and once that's done
        // we unset isDragging.
        else
          set({
            to: async next => {
              await next({ scale: 1, config: config.stiff })
              setDragging(false)
            }
          })

        // memo holds the scroll y value when the drag gesture has started
        return memo
      },
      // Here is our scroll handler
      onScroll: ({ xy: [, y] }) => {
        // So when we're transitioning from drag, we just need to wait
        // for the scroll to come back to 0 and resolve the promise
        // so that the transition can complete.
        if (transitioningFromDrag.current) {
          if (y >= 0 && touchEnded.current) endResolve.current()
          return
        }

        if (transitionOver.current) set({ position: y > 0 ? 'relative' : 'fixed' })

        // This just sets the close icon to black when we're passed the cover.
        setInvertClose(y >= (coverRef.current.offsetHeight - 20 - 18))

        // When we're still dragging the cover and we're scrolling positively
        // we cancel the drag and reset our page style.
        if (!transitioningFromDrag.current && y >= 0 && isDragging.current) {
          setDragging(false)
          set({ scale: 1, immediate: true })
        }
      }
    },
    { domTarget: window }
  )

  useEffect(bind, [bind])

  return (
    <CSSTransition in={inProp} addEndListener={animListener} unmountOnExit {...props}>
      <div className="article-wrapper">
        <a.div className="overlay" style={{ opacity }} />
        <a.article ref={ref} style={{ ...style }}>
          <div className={`close-wrap ${invertClose ? 'invert' : ''}`} onClick={() => navigate('', ref.current)}>
            <div className='close-inner'>
              <div className='close-icon'></div>
              <div className='close-progress'>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="48" stroke="black" strokeWidth="4"></circle>
                </svg>
              </div>
            </div>
          </div>
          <a.div>
            <a.figure>
              <img src={cover} ref={coverRef} alt='cover to the article' />
              <div className="title--wrap">
                <div className='title--main'>
                  <h2>{title}</h2>
                </div>
              </div>
            </a.figure>
            <a.div className='article--content'>
              { content.map((item, itemIdx) => {
                  const type = Object.keys(item)[0]

                  if (type === 'text') {
                    return <p key={`content-${title}-${itemIdx}`} dangerouslySetInnerHTML={{ __html: item[type] }}></p>
                  } else if (type === 'quote') {
                    return <div className='article--content-quote' key={`content-${title}-${itemIdx}`}><p dangerouslySetInnerHTML={{ __html: item[type] }}></p></div>
                  } else if (type === 'image') {
                    return (
                      <div className='article--content-img' key={`content-${title}-${itemIdx}`}>
                        <img src={item[type].src} alt='content related' />
                        <span className='article--content-img-label'>{item[type].label}</span>
                      </div>
                    )
                  } else if (type === 'block') {
                    const { image, text } = item[type]

                    return (
                      <div className='article--content-block' key={`content-${title}-${itemIdx}`}>
                        <div className='article--content-block-img'>
                          <img src={image.src} alt='content related'/>
                          <span className='article--content-block-img-label'>{image.label}</span>
                        </div>
                        <p dangerouslySetInnerHTML={{ __html: text }}></p>
                      </div>
                    )
                  }

                  return null
                })
              }
            </a.div>
          </a.div>
        </a.article>
      </div>
    </CSSTransition>
  )
}

export default memo(Page)

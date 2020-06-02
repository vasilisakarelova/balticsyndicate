import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TransitionGroup } from 'react-transition-group'
import { useStore } from '../index'
import data from './data'
import Card from './Card'
import Page from './Page'

export default function List({ index }) {
  const navStatus = useStore(state => state.status)
  const navigate = useStore(state => state.navigate)
  const mainRef = useRef(null)
  const scroll = useRef(0)
  const [cardNodes] = useState(() => new Map())
  const idle = index === -1 && navStatus === 'idle'
  const [stageScale, setStageScale] = useState(1)
  const [stageX, setStageX] = useState(0)
  const [stageY, setStageY] = useState(0)
  const [centerGroupX] = useState((window.innerWidth - 1900) / 2)
  const width = window.innerWidth
  const height = window.innerHeight
  const stage = useRef()
  const layer = useRef()

  const fitStageIntoParentContainer = () => {
    stage.current.width(window.innerWidth)
    stage.current.height(window.innerHeight)
  }

  const addCardNode = useCallback((node, i) => node && cardNodes.set(i, node), [cardNodes])

  const getOpenedCard = useCallback(i => cardNodes.get(i), [cardNodes])

  const onCardClick = useCallback(
    i => {
      // We store the current window scrollY so that we can freeze the list
      // container later.
      scroll.current = window.scrollY
      console.log(i, cardNodes.get(i).slug)
      navigate(i, mainRef.current)
    },
    [navigate]
  )

  useEffect(() => {
    if (idle) {
      mainRef.current.classList.remove('frozen')
      mainRef.current.style.width = ''
      window.scrollTo(0, scroll.current)
    } else {
      mainRef.current.style.width = mainRef.current.offsetWidth + 'px'
      mainRef.current.classList.add('frozen')
      mainRef.current.scrollTop = scroll.current
      window.scrollTo(0, 0)
    }
  }, [idle])

  useEffect(() => {
    window.addEventListener('resize', fitStageIntoParentContainer)
  }, [])

  return (
    <>
      <main ref={mainRef}>
        <header>
          <h3>Friday, August 16th</h3>
          <h1>Today</h1>
        </header>
        <div className="list">
          {data.map((_, i) => (
            <Card ref={n => addCardNode(n, i)} key={i} index={i} onClick={onCardClick} />
          ))}
        </div>
      </main>
      <TransitionGroup appear component={null}>
        {index > -1 && <Page index={index} getOpenedCard={getOpenedCard} />}
      </TransitionGroup>
    </>
  )
}

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TransitionGroup } from 'react-transition-group'
import { Layer, Stage, Rect, Group } from 'react-konva'
import { useStore } from '../index'
import data from './data'
import Page from './Page'
import URLImage from './URLImage'

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
  const stage = useRef()
  const layer = useRef()

  const fitStageIntoParentContainer = () => {
    stage.current.width(window.innerWidth)
    stage.current.height(window.innerHeight)
  }

  const addCardNode = useCallback((node, i) => node && cardNodes.set(i, node), [cardNodes])

  const getOpenedCard = useCallback(i => cardNodes.get(i), [cardNodes])

  const onCardClick = useCallback(
    item => {
      scroll.current = window.scrollY
      navigate(item.currentTarget.index, mainRef.current)
    },
    [navigate]
  )

  const handleWheel = (ev) => {
    ev.evt.preventDefault()

    const scaleBy = 1.01;
    const stage = ev.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };

    let newScale = 1
    if (ev.evt.deltaY > 0) {
      newScale = oldScale * scaleBy
    } else {
      newScale = ((oldScale / scaleBy) <= 0.7) ? 0.7 : oldScale / scaleBy
    }

    setStageScale(newScale)
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale)
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale)
  }

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
      <main ref={mainRef} id='container'>
        <Stage
          ref={stage}
          container={'container'}
          width={window.innerWidth}
          height={window.innerHeight}
          onWheel={handleWheel}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
        >
          <Layer ref={layer} >
            <Group
              draggable={true}
              x={0}
              y={0}
              dragBoundFunc={(pos) => {
                const layerHeight = layer.current.getClientRect().height
                const layerWidth = layer.current.getClientRect().width
                const stageHeight = stage.current.attrs.height
                const stageWidth = stage.current.attrs.width
                const bound = 100
                const bottomBoundReached = (-(layerHeight - stageHeight + bound)) > pos.y
                const topBoundReached = pos.y > bound
                const leftBoundReached = Math.abs(centerGroupX) + bound < pos.x
                const rightBoundReached = (centerGroupX - bound) > pos.x
                // (layerWidth - stageWidth + centerGroupX + bound) < Math.abs(pos.x)

                let newY = bottomBoundReached ? (-(layerHeight - stageHeight + bound)) : topBoundReached ? bound : pos.y
                let newX = leftBoundReached ? Math.abs(centerGroupX) + bound : rightBoundReached ? (centerGroupX - bound) : pos.x

                return {
                  x: newX,
                  y: newY,
                }
              }}
            >
              {data.map((_, i) => (
                <URLImage ref={n => addCardNode(n, i)} key={i} idx={i} data={_} onClick={onCardClick} />
              ))}
            </Group>
          </Layer>
        </Stage>
      </main>
      <TransitionGroup appear component={null}>
        {index > -1 && <Page index={index} getOpenedCard={getOpenedCard} />}
      </TransitionGroup>
    </>
  )
}

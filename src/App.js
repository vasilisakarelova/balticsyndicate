import React, { useState, useEffect, useRef } from 'react'
import { Layer, Stage, Rect, Group, Image } from 'react-konva'

import URLImage from './components/URLImage'

import history from './assets/01_history.jpg'
import workers from './assets/02_workers.jpg'
import depo from './assets/03_depo.jpg'
import soviet from './assets/IMG_20200520_224602_209.jpg'
import pirotskij from './assets/02 -fedor-apollonovich-pirotskij-1.jpg'

const List = () => {
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

  useEffect(() => {
    window.addEventListener('resize', fitStageIntoParentContainer)
  }, [])

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
      // newScale = oldScale / scaleBy
      console.log(newScale)
    }

    setStageScale(newScale)
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale)
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale)
  }

  return (
    <Stage
      ref={stage}
      container={'root'}
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
            const layerWidth = layer.current.getClientRect().width
            const layerHeight = layer.current.getClientRect().height
            const stageWidth = stage.current.attrs.width
            const stageHeight = stage.current.attrs.height
            const bound = 100
            const bottomBoundReached = (-(layerHeight - stageHeight + bound)) > pos.y
            const topBoundReached = pos.y > bound
            const leftBoundReached = Math.abs(centerGroupX) + bound < pos.x
            const rightBoundReached = (centerGroupX - bound) > pos.x

            let newY = bottomBoundReached ? (-(layerHeight - stageHeight + bound)) : topBoundReached ? bound : pos.y
            let newX = leftBoundReached ? Math.abs(centerGroupX) + bound : rightBoundReached ? (centerGroupX - bound) : pos.x

            // back.current.setAbsolutePosition({x: 0, y: 0})

            return {
              x: newX,
              y: newY,
            }
          }}
        >

            {/*<Rect
              ref={back}
              fill={'red'}
              width={window.innerWidth}
              height={window.innerHeight}
            />*/}

            <URLImage
              x={centerGroupX}
              y={0}
              src={history}
              idx={0}
            />

            <URLImage
              x={centerGroupX}
              y={327.39018087855294}
              src={pirotskij}
              idx={1}
            />

            <URLImage
              x={centerGroupX}
              y={925.4446555867241}
              src={depo}
              idx={2}
            />

            <URLImage
              x={centerGroupX + 500}
              y={50}
              src={workers}
              idx={3}
            />

            <URLImage
              x={centerGroupX + 500}
              y={683.3333333333333}
              src={soviet}
              idx={4}
            />

            <URLImage
              x={centerGroupX + 500}
              y={1250.3703703703702}
              src={history}
              idx={5}
            />

            <URLImage
              x={centerGroupX + 1000}
              y={20}
              src={depo}
              idx={6}
            />

            <URLImage
              x={centerGroupX + 1000}
              y={393.828125}
              src={history}
              idx={7}
            />

            <URLImage
              x={centerGroupX + 1000}
              y={721.2183058785529}
              src={workers}
              idx={8}
            />

            <URLImage
              x={centerGroupX + 1500}
              y={70}
              src={pirotskij}
              idx={9}
            />

            <URLImage
              x={centerGroupX + 1500}
              y={703.3333333333333}
              src={soviet}
              idx={9}
            />
        </Group>
      </Layer>
    </Stage>
  )
}

export default List

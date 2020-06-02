import React from 'react'
import ReactDOM from 'react-dom'
import { Match, navigate } from '@reach/router'
import create from 'zustand'
import List from './components/List'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import './index.css'

// We just use a store to augment the router navigation function so that it
// handles transition status and disable the body scroll during the transition
// (ie animation).
const [useStore] = create(set => ({
  status: 'idle',
  navigate: (address, domEl) => {
    set({ status: 'transitioning' })
    if (domEl) disableBodyScroll(domEl)
    navigate(`/${address}`)
  },
  endNav: () => {
    set({ status: 'idle' })
    clearAllBodyScrollLocks()
  }
}))

export { useStore }

function App() {
  // The List component is always displayed and is passed the opened page index
  // converted as number for conveniences
  return <Match path="/:index">{({ match }) => <List index={match ? ~~match.index : -1} />}</Match>
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)

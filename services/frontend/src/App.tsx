import { useState } from 'react'

const stateToOnOff = (state: boolean) => (state ? 'on' : 'off')

function App() {
  const [ledState, toggleLedState] = useState<boolean>(false)

  const ledSwitchHandler = async () => {
    await fetch(`http://localhost:3000/${stateToOnOff(ledState)}`)
    toggleLedState((prev) => !prev)
  }

  return (
    <div>
      <h1>HELLO WORLD</h1>
      <p>LED STATE: {stateToOnOff(ledState)}</p>
      <button onClick={ledSwitchHandler}>Switch led state</button>
    </div>
  )
}

export default App

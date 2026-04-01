import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { increment, decrement, reset, incrementBy, selectCount } from './counterSlice'

export default function Counter() {
  const count = useSelector(selectCount)
  const dispatch = useDispatch()
  const [customValue, setCustomValue] = useState(10)

  return (
    <div className="counter-box">
      <p className="label">Feature Slice: actions + reducer + selector no mesmo módulo</p>

      <div className="count-display">{count}</div>

      <div className="buttons">
        <button onClick={() => dispatch(increment())}>+ Incrementar</button>
        <button onClick={() => dispatch(decrement())}>− Decrementar</button>
        <button className="danger" onClick={() => dispatch(reset())}>Reset</button>
      </div>

      <div className="payload-section">
        <p className="label">Com payload — dispatch(incrementBy({customValue}))</p>
        <div className="payload-controls">
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(Number(e.target.value))}
          />
          <button onClick={() => dispatch(incrementBy(customValue))}>
            Incrementar por {customValue}
          </button>
        </div>
      </div>
    </div>
  )
}

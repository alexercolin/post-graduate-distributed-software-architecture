import { useSelector, useDispatch } from 'react-redux'
import { increment, decrement, reset } from '../actions/counterActions'

// VIEW
// Lê o estado da Store via useSelector.
// Dispara actions via useDispatch — nunca altera o estado diretamente.
export default function Counter() {
  const count = useSelector((state) => state.counter.count)
  const dispatch = useDispatch()

  return (
    <div className="counter-box">
      <p className="label">Fluxo: Action → Dispatcher → Reducer → Store → View</p>

      <div className="count-display">{count}</div>

      <div className="buttons">
        <button onClick={() => dispatch(increment())}>+ Incrementar</button>
        <button onClick={() => dispatch(decrement())}>− Decrementar</button>
        <button className="danger" onClick={() => dispatch(reset())}>Reset</button>
      </div>
    </div>
  )
}

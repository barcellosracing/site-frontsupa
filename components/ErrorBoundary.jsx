import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error }
  }
  componentDidCatch(error, info){
    if (typeof console !== 'undefined') console.error('ErrorBoundary caught', error, info)
  }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding:20}}>
          <h2>Ocorreu um erro na aplicação</h2>
          <p>{String(this.state.error)}</p>
          <p>Tente recarregar a página. Se o problema persistir, entre em contato.</p>
        </div>
      )
    }
    return this.props.children
  }
}
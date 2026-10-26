import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state={fallo:false};
  static getDerivedStateFromError(){return {fallo:true};}
  componentDidCatch(error){console.error({nombre:error.name});}
  render(){return this.state.fallo?<main className="errorGlobal" role="alert"><h1>Algo no pudo cargarse.</h1><p>Tus datos guardados siguen a salvo. Inténtalo de nuevo o vuelve al inicio.</p><button onClick={()=>window.location.reload()}>Reintentar</button><a href="/">Volver al inicio</a></main>:this.props.children;}
}

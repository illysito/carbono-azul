import './styles/style.css'

// import worldHome from './features/threeWorld'
import entryIndex from './features/pages/index/entryIndex'
import WorldHome from './features/threeJS/homeWorld'
import indexWorld from './features/threeJS/indexWorld'

console.log('Archivo de Filosofía Occidental `26')

function runHomeFunctions() {
  new WorldHome()
}

function runIndexFunctions() {
  indexWorld()
  entryIndex()
}

// worldHome()
if (document.body.classList.contains('body__home')) runHomeFunctions()
if (document.body.classList.contains('body__index')) runIndexFunctions()

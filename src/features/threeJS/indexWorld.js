import gsap from 'gsap'
import * as THREE from 'three'

import frag from './shaders/frag_Index'
import vert from './shaders/vertex'

async function indexWorld() {
  function githubToJsDelivr(permalink) {
    return permalink
      .replace('github.com', 'cdn.jsdelivr.net/gh')
      .replace('/blob/', '@')
  }

  const canvas = document.querySelector('#index-canvas')
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  console.log(w, h)

  // SCENE
  const scene = new THREE.Scene()

  // CAMERA
  const fov = 45
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000)
  camera.position.z = h / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))

  // RENDERER
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace

  // TEXTURES
  const loader = new THREE.TextureLoader()

  const textures = await Promise.all([
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/e6eb83d70319d4acade595b42259e4250da883b9/imgs/Heraclito%20-%20BLACK%20-%20drawing.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/5cb8901193d1a421b5e85aae4ca6b209d6bf1c02/imgs/Socrates%20-%20BLACK%20-%20drawing.webp'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/cfc63737d76b75936ca21759e213b59e4c8103ba/imgs/Plato%20-%20BLACK%20-%20drawing.webp'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/cfc63737d76b75936ca21759e213b59e4c8103ba/imgs/Aristoteles%20-%20BLACK%20-%20drawing.webp'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/e6eb83d70319d4acade595b42259e4250da883b9/imgs/Heraclito%20-%20BLACK%20-%20drawing.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/a7b6e031a25e331694c5c2661b8363de8ffdd726/imgs/Aristoteles%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/329eefd9e96007df1f05a2730de1fdcb2adf9a1b/imgs/Plato%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/a7b6e031a25e331694c5c2661b8363de8ffdd726/imgs/Aristoteles%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/e6eb83d70319d4acade595b42259e4250da883b9/imgs/Heraclito%20-%20BLACK%20-%20drawing.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/a7b6e031a25e331694c5c2661b8363de8ffdd726/imgs/Aristoteles%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/329eefd9e96007df1f05a2730de1fdcb2adf9a1b/imgs/Plato%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/a7b6e031a25e331694c5c2661b8363de8ffdd726/imgs/Aristoteles%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/329eefd9e96007df1f05a2730de1fdcb2adf9a1b/imgs/Heraclito%20-%20BLACK.jpg'
      )
    ),
    loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/carbono-azul/blob/a7b6e031a25e331694c5c2661b8363de8ffdd726/imgs/Aristoteles%20-%20BLACK.jpg'
      )
    ),
  ])

  // SHADER MATERIAL
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      u_time: { value: 0 },
      u_image_1: { value: textures[0] },
      u_resolution: { value: new THREE.Vector2(w, h) },
      u_noiseFactor: { value: 0 },
    },
  })

  // PLANE
  const geometry = new THREE.PlaneGeometry(w, h)
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // RENDER LOOP
  let currentTextureIndex = 0
  let noiseFactor = { value: 0 }
  function animate(time) {
    material.uniforms.u_time.value = time * 0.001

    material.uniforms.u_image_1.value = textures[currentTextureIndex]
    material.uniforms.u_noiseFactor.value = noiseFactor.value

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)

  const indexEntryWrappers = [
    ...document.querySelectorAll('.index-entry-wrapper'),
  ]

  indexEntryWrappers.forEach((w, index) => {
    w.addEventListener('mouseenter', () => {
      currentTextureIndex = index
      gsap
        .timeline()
        .to(noiseFactor, {
          value: 0.012,
          duration: 0.32,
          ease: 'power3.out',
        })
        .to(noiseFactor, {
          value: 0,
          duration: 0.72,
          ease: 'power2.out',
        })
    })
    w.addEventListener('click', () => {
      // currentTextureIndex = index
      gsap
        .timeline()
        .to(noiseFactor, {
          value: 0.2,
          duration: 0.12,
          ease: 'power3.out',
        })
        .to(noiseFactor, {
          value: 0,
          duration: 0.92,
          ease: 'power3.out',
        })
    })
  })
}

export default indexWorld

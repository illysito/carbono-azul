import * as THREE from 'three'

function world() {
  const canvas = document.getElementById('carbon-canva')
  // Scene
  const scene = new THREE.Scene()

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 3

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Background
  const loader = new THREE.TextureLoader()

  loader.load(
    'https://cdn.jsdelivr.net/gh/illysito/carbono-azul@a753d015c883d1243055b04b0365bd263c18c9ab/imgs/Carbono-Azul-Texture-3.jpg',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      // texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false

      const distance = 2 // distance from camera
      const fov = camera.fov * (Math.PI / 180)
      const height = 2 * Math.tan(fov / 2) * distance
      const width = height * camera.aspect

      const planeGeometry = new THREE.PlaneGeometry(width, height)
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        // alphaTest: 0.1,
      })

      const plane = new THREE.Mesh(planeGeometry, planeMaterial)

      // move it behind your sphere
      let planeScale = 1.6
      plane.position.z = 0
      plane.scale.set(planeScale, planeScale, planeScale)
      scene.add(plane)
    }
  )

  // Light
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(4, 4, 4)
  scene.add(light)

  // Sphere
  const geometry = new THREE.TorusGeometry(0.6, 0.12, 64, 64)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    // emissie: new Color(0x00ff00),
    // emissive: new Color(0x5511f6),
    emissive: 0xffffff,
    emissiveIntensity: 0.02,
    transmission: 1.0,
    thickness: 0.32,
    ior: 1.5,
    roughness: 0.013,
    metalness: 0.0,
    reflectivity: 0.24,
    attenuationColor: 0xdff3ff,
    attenuationDistance: 1.5,
    dispersion: 2.2,
    // transparent: true,
    // wireframe: true,
  })
  const sphere = new THREE.Mesh(geometry, material)
  let sphereScale = 0.48
  sphere.position.z = 2
  sphere.scale.set(sphereScale, sphereScale, sphereScale)
  scene.add(sphere)

  // Loop
  function animate() {
    requestAnimationFrame(animate)
    sphere.rotation.y += 0.01
    sphere.rotation.x += 0.012
    sphere.rotation.z += 0.08
    renderer.render(scene, camera)
  }
  animate()

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

export default world

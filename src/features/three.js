import gsap from 'gsap'
import * as THREE from 'three'

function world() {
  const canvas = document.getElementById('carbon-canva')
  // Scene
  const scene = new THREE.Scene()

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 9

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))

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
      let planeScale = 1.6 * 3
      plane.position.z = 0
      plane.scale.set(planeScale, planeScale, planeScale)
      scene.add(plane)
    }
  )

  // Shader
  function addWobbleToMaterial(material, options = {}) {
    const settings = {
      amplitude: options.amplitude ?? 0.08, // how far vertices move
      frequency: options.frequency ?? 21.5, // number of waves across surface
      speed: options.speed ?? 0.1, // animation speed
      ...options,
    }

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uAmplitude = { value: settings.amplitude }
      shader.uniforms.uFrequency = { value: settings.frequency }
      shader.uniforms.uSpeed = { value: settings.speed }

      material.userData.shader = shader

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `
          #include <common>
  
          uniform float uTime;
          uniform float uAmplitude;
          uniform float uFrequency;
          uniform float uSpeed;
          `
        )
        .replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
  
          float t = uTime * uSpeed * 0.1;
  
          float n =
            sin(position.x * 6.6 + t * 0.1) *
            cos(position.y * 0.5 + t * 0.9) *
            sin(position.z * 1.4 + t * 0.3);
  
          transformed += normal * n * uAmplitude * 1.2;
          `
        )
    }

    return material
  }

  // Light
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(1, 1, 20)
  scene.add(light)

  // Molecule
  const sphereGeo = new THREE.TorusGeometry(0.6, 0.052, 24, 48, Math.PI * 1.96)
  // const cylinderGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 16)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    // emissie: new Color(0x00ff00),
    // emissive: new Color(0x5511f6),
    emissive: 0xffffff,
    emissiveIntensity: 0.02,
    transmission: 1.0,
    thickness: 0.42,
    ior: 1.2,
    roughness: 0.0,
    metalness: 0.0,
    reflectivity: 0.24,
    // attenuationColor: 0xddeeff,
    // attenuationColor: 0xffeeee,
    attenuationColor: 0xedefff,
    attenuationDistance: 1.5,
    dispersion: 2.2,
    // transparent: true,
    // wireframe: true,
    // side: THREE.DoubleSide,
  })
  // const oxygenMaterial = new THREE.MeshPhysicalMaterial({
  //   color: 0xffffff,
  //   // emissie: new Color(0x00ff00),
  //   // emissive: new Color(0x5511f6),
  //   emissive: 0xffffff,
  //   emissiveIntensity: 0.02,
  //   transmission: 1.0,
  //   thickness: 0.42,
  //   ior: 1.1,
  //   roughness: 0.013,
  //   metalness: 0.0,
  //   reflectivity: 0.24,
  //   // attenuationColor: 0xaaeeff,
  //   attenuationColor: 0xffeeaa,
  //   attenuationDistance: 1.5,
  //   dispersion: 1.8,
  //   // transparent: true,
  //   // wireframe: true,
  // })
  const sphere = new THREE.Mesh(sphereGeo, material)
  // const o1 = new THREE.Mesh(sphereGeo, material)
  // const o2 = new THREE.Mesh(sphereGeo, oxygenMaterial)
  // const c1 = new THREE.Mesh(cylinderGeo, material)
  // const c2 = new THREE.Mesh(cylinderGeo, material)
  // const c3 = new THREE.Mesh(cylinderGeo, material)
  // const c4 = new THREE.Mesh(cylinderGeo, material)

  addWobbleToMaterial(material, {
    amplitude: 0.08,
    frequency: 10.0,
    speed: 0.01,
  })

  let sphereScale = 0.78
  sphere.scale.set(sphereScale, sphereScale, sphereScale)
  // o1.scale.set(sphereScale * 0.72, sphereScale * 0.72, sphereScale * 0.72)
  // o2.scale.set(sphereScale * 0.72, sphereScale * 0.72, sphereScale * 0.72)
  // o1.position.x = -0.62
  // o2.position.x = 0.62

  // c1.rotation.z = Math.PI / 2
  // c1.position.x = -0.28
  // c1.position.y = 0.04
  // c2.rotation.z = Math.PI / 2
  // c2.position.x = -0.28
  // c2.position.y = -0.04

  // c3.rotation.z = Math.PI / 2
  // c3.position.x = 0.28
  // c3.position.y = 0.04
  // c4.rotation.z = Math.PI / 2
  // c4.position.x = 0.28
  // c4.position.y = -0.04

  const group = new THREE.Group()

  group.add(sphere)
  // group.add(o1)
  // group.add(o2)
  // group.add(c1)
  // group.add(c2)
  // group.add(c3)
  // group.add(c4)

  scene.add(group)

  group.position.z = 2
  group.scale.set(2.8, 2.8, 2.8)
  // scene.add(sphere)

  // Loop
  let counter = 0

  let mouseX = 0
  let mouseY = 0

  let targetX = 0
  let targetY = 0

  let currentX = 0
  let currentY = 0

  let animationId = null
  let isVisible = false

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  const clock = new THREE.Clock()
  function animate() {
    const elapsedTime = clock.getElapsedTime()
    if (material.userData.shader) {
      material.userData.shader.uniforms.uTime.value = elapsedTime * 0.01
    }
    currentX = lerp(currentX, targetX, 0.012)
    currentY = lerp(currentY, targetY, 0.012)

    counter += 0.4
    group.rotation.y += 0.0001
    group.rotation.x += 0.003
    group.rotation.z += 0.032
    group.position.x = 0.32 * Math.sin(counter * 0.01) + currentX
    group.position.y = 0.28 * Math.cos(counter * 0.012) - currentY
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }
  animate()

  function startRendering() {
    if (animationId !== null) return
    animationId = requestAnimationFrame(animate)
  }

  function stopRendering() {
    if (animationId === null) return
    cancelAnimationFrame(animationId)
    animationId = null
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting

      if (isVisible) {
        startRendering()
      } else {
        stopRendering()
      }
    },
    {
      threshold: 0.05,
    }
  )

  observer.observe(canvas)

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY

    targetX = gsap.utils.mapRange(0, window.innerWidth, -0.52, 0.52, mouseX)

    targetY = gsap.utils.mapRange(0, window.innerHeight, -0.48, 0.48, mouseY)
  })

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

export default world

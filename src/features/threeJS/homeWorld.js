import gsap from 'gsap'
import * as THREE from 'three'

import frag from './shaders/frag_Home'
import vert from './shaders/vertex'

const canvas = document.getElementById('three-canvas')
const wrapper = document.querySelector('.canvas')
const dpr = Math.min(window.devicePixelRatio || 1, 2)

function githubToJsDelivr(permalink) {
  return permalink
    .replace('github.com', 'cdn.jsdelivr.net/gh')
    .replace('/blob/', '@')
}

export default class WorldHome {
  constructor() {
    this.lastTime = performance.now()
    this.frameCount = 0

    this.time = 0
    this.scrollValue = 0
    this.mouseX = 0
    this.mouseY = 0
    this.targetMouseX = 0
    this.targetMouseY = 0
    this.lerpFactor = 0.05
    this.isScrolling = false
    this.isResizing = false

    // sizes
    this.w = canvas.clientWidth
    this.h = canvas.clientHeight

    // scene
    this.scene = new THREE.Scene()

    // camera
    this.fov = 45
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.w / this.h,
      100,
      2000
    )
    this.camera.position.z = 600
    this.updateCamera()

    // images
    this.domImageWrappers = [
      ...document.querySelectorAll('.content-img-wrapper'),
    ]
    this.domImageWrappers.forEach((w) => {
      gsap.set(w, {
        opacity: 0,
      })
    })

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.w, this.h)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setClearColor(0x000000, 0)

    this.resize()
    this.init()
  }

  lerp(start, end, t) {
    return start + (end - start) * t
  }

  async init() {
    // await this.loadTextures()
    // await this.addImages()
    // await this.addPlane()
    // this.setupObserver()
    // this.setImagePositions()
    // this.addObjects()
    this.render()
    this.resize()
    // this.gsap()

    setTimeout(async () => {
      await this.addImages()
      // this.setupObserver()
      this.setImagePositions()
      this.resize()
      this.setupListeners()
    }, 1000) // tweak: 300–1500ms depending on feel
  }

  //#region OBSERVER
  setupObserver() {
    this.io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = entry.target.__threeItem
          item.isVisible = entry.isIntersecting
          item.mesh.visible = entry.isIntersecting

          // optional: if it just became visible, you can force a one-time rect update
          if (entry.isIntersecting) {
            item.needsRect = true
            const dly = 0.2 * Math.random()
            // IMAGE LIQUID REVEAL
            gsap.to(item.mesh.material.uniforms.u_scroll, {
              delay: 0.2 + dly,
              value: 2.0,
              duration: 1.2,
              ease: 'power2.inOut',
            })
          }
        }
      },
      {
        root: null,
        rootMargin: '20px', // pre-activate before it appears
        threshold: 0,
      }
    )

    this.imageStore.forEach((item) => {
      item.img.__threeItem = item
      this.io.observe(item.img)
    })
  }
  //#endregion

  setupListeners() {
    let scrollTimeout
    let resizeTimeout
    // window.addEventListener('resize', this.resize.bind(this))
    window.addEventListener('resize', () => {
      this.resize()
      this.isResizing = true

      clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        this.isResizing = false
        // run heavy resize logic once
      }, 100) // adjust if needed
    })

    window.addEventListener(
      'scroll',
      () => {
        this.isScrolling = true

        clearTimeout(scrollTimeout)

        this.scrollValue = window.scrollY * 0.0005

        scrollTimeout = setTimeout(() => {
          this.isScrolling = false
        }, 100) // 100ms after last scroll event = stopped
      },
      { passive: true }
    )

    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = e.clientX / window.innerWidth
      this.targetMouseY = e.clientY / window.innerHeight
    })

    this.domImageWrappers.forEach((w, index) => {
      const item = this.imageStore[index]

      w.addEventListener('mouseenter', () => {
        // gsap.killTweensOf(item, 'noiseFactor')

        gsap
          .timeline()
          .to(item, {
            noiseFactor: 0.2,
            duration: 0.26,
            ease: 'power3.out',
          })
          .to(item, {
            noiseFactor: 0,
            duration: 1.2,
            ease: 'power3.out',
          })
      })

      // w.addEventListener('mouseleave', () => {
      //   gsap.killTweensOf(item, 'warpFactor')

      //   gsap.to(item, {
      //     warpFactor: 0,
      //     duration: 1.2,
      //     ease: 'power2.inOut',
      //   })
      // })
    })
  }

  resize() {
    this.w = wrapper.clientWidth
    this.h = wrapper.clientHeight
    this.renderer.setPixelRatio(dpr)
    const pr = this.renderer.getPixelRatio()

    // update canvas resolutions (only need it for the big one, the others are always squares)
    if (this.mainMesh) {
      this.mainMesh.material.uniforms.u_resolution.value.set(
        this.w * pr,
        this.h * pr
      )
      this.mainMesh.scale.set(this.w, this.h, 1)
    }

    if (this.imageStore) {
      this.imageStore.forEach((item) => {
        const rect = item.img.getBoundingClientRect()
        item.mesh.material.uniforms.u_resolution.value.set(
          rect.width * pr,
          rect.height * pr
        )
        // console.log('res:', item.mesh.material.uniforms.u_resolution.value)

        item.mesh.scale.set(rect.width, rect.height, 1)
        // if (index === 0) {
        //   item.mesh.scale.x *= 1.05
        //   item.mesh.scale.y *= 1.05
        // }
      })
    }

    this.renderer.setSize(this.w, this.h)
    this.camera.aspect = this.w / this.h
    this.updateCamera()
    this.camera.updateProjectionMatrix()
  }

  // LOOP!

  render() {
    this.time += 0.5
    const time = performance.now() * 0.001

    // FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastTime >= 1000) {
      console.log('FPS:', this.frameCount)
      this.frameCount = 0
      this.lastTime = now
    }

    this.mouseX = this.lerp(this.mouseX, this.targetMouseX, this.lerpFactor)
    this.mouseY = this.lerp(this.mouseY, this.targetMouseY, this.lerpFactor)

    // time for main canvas
    if (this.imageStore) {
      this.imageStore.forEach((img) => {
        img.mesh.position.x = img.baseX + (this.mouseX - 0.5) * 20
        // img.mesh.position.y = img.baseY + (this.mouseY - 0.5) * 20

        // img.mesh.material.uniforms.u_time.value = 0.002 * this.time
        img.mesh.material.uniforms.u_time.value = time
        img.mesh.material.uniforms.u_noiseFactor.value = img.noiseFactor
        // img.mesh.position.x += 0.01
      })
    }
    // time for image canvas
    if ((this.isScrolling || this.isResizing) && this.imageStore) {
      this.setImagePositions()
    }
    // render & loop
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.render.bind(this))
  }

  updateCamera() {
    this.fov =
      (2 * Math.atan(window.innerHeight / 2 / this.camera.position.z) * 180) /
      Math.PI
    this.camera.fov = this.fov
    // console.log(this.camera.fov)
  }

  // main plane
  async loadMainTextures() {
    const loader = new THREE.TextureLoader()
    const perlin = await loader.loadAsync(
      // githubToJsDelivr(
      //   'https://github.com/illysito/peso/blob/0294519c879b1beb194295665bea435293f643fa/imgs/perlinSquare.jpg'
      // )
      githubToJsDelivr(
        'https://github.com/illysito/peso/blob/59ffea901601114acb6e3a6daaea6ff12c9721c5/imgs/displacementSquare4.jpg'
      )
    )

    return perlin
  }

  // images
  async loadTextures() {
    const loader = new THREE.TextureLoader()
    const perlin = await loader.loadAsync(
      githubToJsDelivr(
        'https://github.com/illysito/peso/blob/0294519c879b1beb194295665bea435293f643fa/imgs/perlinSquare.jpg'
      )
    )

    const texturesFront = await Promise.all([
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
          'https://github.com/illysito/carbono-azul/blob/5cb8901193d1a421b5e85aae4ca6b209d6bf1c02/imgs/Socrates%20-%20BLACK%20-%20drawing.webp'
        )
      ),
    ])

    // const texturesBack = await Promise.all([
    //   // Pau
    //   // loader.loadAsync(
    //   //   githubToJsDelivr(
    //   //     'https://github.com/illysito/amorenelaire/blob/14313651f9b1110aa4ec9d46ead45adea22942d9/textures/AmorenelAirePaulaPRUEBA-13.jpg'
    //   //   )
    //   // ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/004bdb4558f4ae27e31914534170fab3c14034f2/textures/AmorenelAireHERO3.jpg'
    //     )
    //   ),

    //   // Zoa x Diego
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Z%26D_preview-12.webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Z%26D_preview-3.webp'
    //     )
    //   ),
    //   // Amanda x Paula
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-39.webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-80.webp'
    //     )
    //   ),
    //   // Conchi x Adrian
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-1059.webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-574.webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-574.webp'
    //     )
    //   ),
    //   // Miri x Joan
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
    //     )
    //   ),
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-80.webp'
    //     )
    //   ),
    //   // Conchi x Adrian
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-1059.webp'
    //     )
    //   ),
    //   // Footer
    //   loader.loadAsync(
    //     githubToJsDelivr(
    //       'https://github.com/illysito/amorenelaire/blob/5317c1c44dd6a16c268cb3c01682b6a72b9f425e/textures/Footer.jpg'
    //     )
    //   ),
    // ])

    return { perlin, texturesFront }
  }

  async addImages() {
    const { perlin, texturesFront } = await this.loadTextures()

    //#region
    // const parameters = [
    //   {
    //     amp: 0,
    //     freq: 6,
    //     offset: 0.052,
    //     offsetFactor: 0.8,
    //     needsSwitch: true,
    //     edgeIsDown: false,
    //     needsDistortion: false,
    //   },
    //   {
    //     amp: 14,
    //     freq: 3,
    //     offset: 0.052,
    //     offsetFactor: 0.8,
    //     needsSwitch: true,
    //     edgeIsDown: false,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 3,
    //     freq: 3,
    //     offset: 0.06,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 1.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2,
    //     freq: 3,
    //     offset: 1.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 3,
    //     freq: 3,
    //     offset: 1.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   {
    //     amp: 2.5,
    //     freq: 3,
    //     offset: 4.14,
    //     offsetFactor: 2.52,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    //   // Footer
    //   {
    //     amp: 5.5,
    //     freq: 6,
    //     offset: 0.9,
    //     offsetFactor: 1,
    //     needsSwitch: true,
    //     edgeIsDown: true,
    //     needsDistortion: true,
    //   },
    // ]
    //#endregion

    this.imageStore = this.domImageWrappers.map((img, index) => {
      const actualImg = img.querySelector('img')
      const imageResolution = new THREE.Vector2(
        actualImg.naturalWidth,
        actualImg.naturalHeight
      )
      // console.log('image RES:', imageResolution.x, imageResolution.y)

      let bounds = img.getBoundingClientRect()

      // let seed = Math.random() * 20

      // create a mesh for each image
      // let geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 1, 1)
      let geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
      let material = new THREE.ShaderMaterial({
        fragmentShader: frag,
        vertexShader: vert,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
          u_imgResolution: {
            value: new THREE.Vector2(imageResolution.x, imageResolution.y),
          },
          u_noiseFactor: { value: 0 },
          u_image_1: { value: texturesFront[index] },
          u_displacement: { value: perlin },
        },
      })
      // material.transparent = true
      let mesh = new THREE.Mesh(geometry, material)

      this.scene.add(mesh)

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,

        noiseFactor: 0.0,

        baseX: 0.0,
        baseY: 0.0,
        mouseX: 0.0,
        mouseY: 0.0,
        targetMouseX: 0.0,
        targetMouseY: 0.0,

        seed: Math.random(),

        isVisible: true,
      }
    })

    this.renderer.compile(this.scene, this.camera)
    this.renderer.render(this.scene, this.camera)
  }

  setImagePositions() {
    // console.log(this.imageStore)
    this.imageStore.forEach((item) => {
      if (!item.isVisible) return
      const rect = item.img.getBoundingClientRect()

      // item.mesh.position.x = rect.left - this.w / 2 + rect.width / 2 // operating with img width and screen width shift coord system from DOM to three.js
      item.mesh.position.y = -rect.top + this.h / 2 - rect.height / 2

      item.baseX = rect.left - this.w / 2 + rect.width / 2
      item.baseY = -rect.top + this.h / 2 - rect.height / 2
    })
  }
}

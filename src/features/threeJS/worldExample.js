import gsap from 'gsap'
import * as THREE from 'three'

import frag from './shaders/homeFrag'
import vert from './shaders/vertexShader'

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

    // window.addEventListener('mousemove', (e) => {
    //   this.targetMouseX = e.clientX / window.innerWidth
    //   this.targetMouseY = e.clientY / window.innerHeight
    // })

    this.domImageWrappers.forEach((w, index) => {
      const item = this.imageStore[index]

      w.addEventListener('mousemove', (e) => {
        const rect = w.getBoundingClientRect()

        item.targetMouseX = (e.clientX - rect.left) / rect.width
        item.targetMouseY = 1.0 - (e.clientY - rect.top) / rect.height
      })

      w.addEventListener('mouseenter', () => {
        gsap.killTweensOf(item, 'warpFactor')

        gsap.to(item, {
          warpFactor: 0.108,
          duration: 1.2,
          ease: 'power2.inOut',
          onComplete: () => {
            // If they're still hovering, slowly consume the image
            gsap.to(item, {
              delay: 2.4,
              warpFactor: 1,
              duration: 1.2,
              ease: 'power3.inOut',
            })
          },
        })
      })

      w.addEventListener('mouseleave', () => {
        gsap.killTweensOf(item, 'warpFactor')

        gsap.to(item, {
          warpFactor: 0,
          duration: 1.2,
          ease: 'power2.inOut',
        })
      })
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

    // FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastTime >= 1000) {
      console.log('FPS:', this.frameCount)
      this.frameCount = 0
      this.lastTime = now
    }

    // time for main canvas
    if (this.imageStore) {
      this.imageStore.forEach((img) => {
        img.mouseX = this.lerp(img.mouseX, img.targetMouseX, this.lerpFactor)
        img.mouseY = this.lerp(img.mouseY, img.targetMouseY, this.lerpFactor)

        img.mesh.material.uniforms.u_time.value = 0.002 * this.time
        // img.mesh.material.uniforms.u_scroll.value = this.scrollValue
        img.mesh.material.uniforms.u_mouseX.value = img.mouseX
        img.mesh.material.uniforms.u_mouseY.value = img.mouseY
        img.mesh.material.uniforms.u_warpFactor.value = img.warpFactor

        // img.mesh.position.x -= 0.1 * (2 - 4 * this.targetMouseX)

        const isFooter = img === this.imageStore[this.imageStore.length - 1]

        if (isFooter) {
          const rect = img.img.getBoundingClientRect()

          const progress = THREE.MathUtils.clamp(
            (this.h - rect.top) / rect.height,
            0,
            1
          )

          img.mesh.material.uniforms.u_scroll.value = progress
        } else {
          img.mesh.material.uniforms.u_scroll.value = this.scrollValue
        }
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
      // Pau
      // loader.loadAsync(
      //   githubToJsDelivr(
      //     'https://github.com/illysito/amorenelaire/blob/14313651f9b1110aa4ec9d46ead45adea22942d9/textures/AmorenelAirePaulaPRUEBA-12.jpg'
      //   )
      // ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/004bdb4558f4ae27e31914534170fab3c14034f2/textures/AmorenelAireHERO3.jpg'
        )
      ),
      // Zoa x Diego
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Z%26D_preview-48.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Z%26D_preview-10.webp'
        )
      ),
      // Amanda x Paula
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-30.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-30.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Boda%20Amanda%20%26%20Paula%20-25.webp'
        )
      ),
      // Conchi x Adrian
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Adria%CC%81n%20%26%20Conchi-1011.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Adria%CC%81n%20%26%20Conchi-1129.webp'
        )
      ),
      // Miri x Joan
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/BODA_M%26J-590.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Boda%20Amanda%20%26%20Paula%20-25.webp'
        )
      ),
      // Conchi x Adrian
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/04a272803d184b7b7db65fda964d26b2c89a2af4/textures/Adria%CC%81n%20%26%20Conchi-1011.webp'
        )
      ),
      // Footer
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/5317c1c44dd6a16c268cb3c01682b6a72b9f425e/textures/Footer.jpg'
        )
      ),
    ])

    const texturesBack = await Promise.all([
      // Pau
      // loader.loadAsync(
      //   githubToJsDelivr(
      //     'https://github.com/illysito/amorenelaire/blob/14313651f9b1110aa4ec9d46ead45adea22942d9/textures/AmorenelAirePaulaPRUEBA-13.jpg'
      //   )
      // ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/004bdb4558f4ae27e31914534170fab3c14034f2/textures/AmorenelAireHERO3.jpg'
        )
      ),

      // Zoa x Diego
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Z%26D_preview-12.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Z%26D_preview-3.webp'
        )
      ),
      // Amanda x Paula
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-39.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-80.webp'
        )
      ),
      // Conchi x Adrian
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-1059.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-574.webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-574.webp'
        )
      ),
      // Miri x Joan
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/BODA_M%26J-473%20(1).webp'
        )
      ),
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Boda%20Amanda%20%26%20Paula%20-80.webp'
        )
      ),
      // Conchi x Adrian
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/9e43d2cbf191e1bad96c1e22e30f890dd6e1768e/textures/Adria%CC%81n%20%26%20Conchi-1059.webp'
        )
      ),
      // Footer
      loader.loadAsync(
        githubToJsDelivr(
          'https://github.com/illysito/amorenelaire/blob/5317c1c44dd6a16c268cb3c01682b6a72b9f425e/textures/Footer.jpg'
        )
      ),
    ])

    return { perlin, texturesBack, texturesFront }
  }

  async addImages() {
    const { perlin, texturesBack, texturesFront } = await this.loadTextures()

    const parameters = [
      {
        amp: 18,
        freq: 6,
        offset: 0.052,
        offsetFactor: 0.8,
        needsSwitch: true,
        edgeIsDown: true,
        needsDistortion: true,
      },
      {
        amp: 2,
        freq: 3,
        offset: 2.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 3,
        freq: 3,
        offset: 2.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 1.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2,
        freq: 3,
        offset: 1.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 3,
        freq: 3,
        offset: 1.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      {
        amp: 2.5,
        freq: 3,
        offset: 4.14,
        offsetFactor: 2.52,
        needsSwitch: false,
        edgeIsDown: false,
        needsDistortion: false,
      },
      // Footer
      {
        amp: 5.5,
        freq: 6,
        offset: 0.9,
        offsetFactor: 1,
        needsSwitch: true,
        edgeIsDown: false,
        needsDistortion: true,
      },
    ]

    this.imageStore = this.domImageWrappers.map((img, index) => {
      const actualImg = img.querySelector('img')
      const imageResolution = new THREE.Vector2(
        actualImg.naturalWidth,
        actualImg.naturalHeight
      )
      // console.log('image RES:', imageResolution.x, imageResolution.y)

      let bounds = img.getBoundingClientRect()

      let seed = Math.random() * 20

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
          u_seed: { value: seed },
          u_offset: { value: parameters[index].offset },
          u_offsetFactor: { value: parameters[index].offsetFactor },
          u_amp: { value: parameters[index].amp },
          u_freq: { value: parameters[index].freq },
          u_edgeIsDown: { value: parameters[index].edgeIsDown },
          u_needsDistortion: { value: parameters[index].needsDistortion },
          u_needsSwitch: { value: parameters[index].needsSwitch },
          u_warpFactor: { value: 0.0 },
          u_scroll: { value: 0.0 },
          u_mouseX: { value: 0.0 },
          u_mouseY: { value: 0.0 },
          u_image_1: { value: texturesFront[index] },
          u_image_2: { value: texturesBack[index] },
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

        mouseX: 0.5,
        mouseY: 0.5,
        targetMouseX: 0.5,
        targetMouseY: 0.5,

        warpFactor: 0.0,

        isVisible: true,
      }
    })

    this.renderer.compile(this.scene, this.camera)
    this.renderer.render(this.scene, this.camera)
  }
}

import gsap from 'gsap'

function entryIndex() {
  const indexSection = document.querySelector('.index__section')
  const indexEntryWrappers = [
    ...document.querySelectorAll('.index-entry-wrapper'),
  ]
  const imgWrapper = document.querySelector('.picture-wrapper')
  const img = document.querySelector('.index-img')
  const canvas = document.querySelector('.index-canva')
  const actualImg = [img, canvas]
  const imgWidth = imgWrapper.getBoundingClientRect().width
  const imgHeight = imgWrapper.getBoundingClientRect().height

  const BLACK = '#121212'
  const LIMEY = '#fcffeb'

  indexSection.addEventListener('mouseenter', () => {
    gsap.to(imgWrapper, {
      opacity: 1,
      duration: 0.4,
    })
  })
  indexSection.addEventListener('mouseleave', () => {
    gsap.to(imgWrapper, {
      opacity: 0,
      duration: 0.24,
    })
  })

  indexEntryWrappers.forEach((w) => {
    const bg = w.firstElementChild
    const h = w.lastElementChild
    const prevLine = w.previousElementSibling
    const nextLine = w.nextElementSibling

    // mouse IN
    w.addEventListener('mouseenter', () => {
      gsap.to(bg, {
        yPercent: 100,
        duration: 0.52,
        ease: 'power2.out',
      })
      gsap.to(h, {
        color: LIMEY,
      })
      if (nextLine) {
        gsap.to(nextLine, {
          width: '100%',
          duration: 0.62,
          ease: 'power2.out',
        })
      }
      if (prevLine) {
        gsap.to(prevLine, {
          width: '100%',
          duration: 0.62,
          ease: 'power2.out',
        })
      }
    })

    // mouse OUT
    w.addEventListener('mouseleave', () => {
      gsap.to(bg, {
        yPercent: 0,
        duration: 0.8,
        ease: 'power2.inOut',
      })
      gsap.to(h, {
        color: BLACK,
      })
      if (nextLine) {
        gsap.to(nextLine, {
          width: '96%',
          duration: 0.62,
          ease: 'power2.out',
        })
      }
      if (prevLine) {
        gsap.to(prevLine, {
          width: '96%',
          duration: 0.62,
          ease: 'power2.out',
        })
      }
    })
  })

  let currentMouseX = 0
  let currentMouseY = 0
  let targetX = 0
  let targetY = 0
  let lerpFactor = 0.08

  function lerp(a, b, c) {
    return a + (b - a) * c
  }

  function loop() {
    currentMouseX = lerp(currentMouseX, targetX, lerpFactor)
    currentMouseY = lerp(currentMouseY, targetY, lerpFactor)

    gsap.to(imgWrapper, {
      x: currentMouseX - imgWidth / 2,
      y: currentMouseY - imgHeight / 2,
    })

    gsap.to(actualImg, {
      x: 60 * (currentMouseX / window.innerWidth - 0.6),
      y: 60 * (currentMouseY / window.innerHeight - 0.6),
    })

    requestAnimationFrame(loop)
  }
  loop()

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX
    targetY = e.clientY
  })
}

export default entryIndex

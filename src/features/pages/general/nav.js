import gsap from 'gsap'

function nav() {
  const navItems = [...document.querySelectorAll('.nav-link')]

  if (navItems.length > 0) {
    navItems.forEach((item) => {
      const txt = item.firstElementChild
      const line = item.lastElementChild

      gsap.set(line, {
        scaleX: 0,
        transformOrigin: 'left center',
      })

      item.addEventListener('mouseenter', () => {
        gsap.killTweensOf(line)

        gsap.set(line, {
          transformOrigin: 'left center',
        })
        gsap.to(line, {
          scaleX: 1,
          duration: 0.4,
          ease: 'expo.inOut',
          overwrite: 'auto',
        })
        gsap.to(txt, {
          fontVariationSettings: '"wght" 450',
          duration: 0.2,
          ease: 'none',
        })
      })

      item.addEventListener('mouseleave', () => {
        gsap.killTweensOf(line)

        gsap.set(line, {
          transformOrigin: 'right center',
        })
        gsap.to(line, {
          scaleX: 0,
          duration: 0.4,
          ease: 'expo.inOut',
        })
        gsap.to(txt, {
          fontVariationSettings: '"wght" 350',
          duration: 0.2,
          ease: 'none',
        })
      })
    })
  }
}

export default nav

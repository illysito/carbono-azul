import gsap from 'gsap'

function programmeAccordion() {
  const button = document.querySelector('.cross-container')
  const programmeSection = document.querySelector('.programme__section')

  let isOpen = true
  let autoHeight = 0

  autoHeight = programmeSection.getBoundingClientRect().height
  console.log(autoHeight)

  // gsap.set(programmeSection, {
  //   height: 0,
  //   opacity: 0,
  // })

  button.addEventListener('click', () => {
    if (!isOpen) {
      gsap.to(programmeSection, {
        height: autoHeight,
        duration: 1.2,
        opacity: 1,
        ease: 'power2.in',
      })
      gsap.to(button, {
        rotate: 45,
        duration: 0.6,
      })
    } else {
      gsap.to(programmeSection, {
        height: 0,
        duration: 1.2,
        opacity: 0,
        ease: 'expo.out',
      })
      gsap.to(button, {
        rotate: 0,
        duration: 0.6,
      })
    }
    isOpen = !isOpen
  })
}

export default programmeAccordion

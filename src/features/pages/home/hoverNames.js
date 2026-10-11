// import gsap from 'gsap'

function hoverNames() {
  const images = [...document.querySelectorAll('.content-img-wrapper')]
  const authorName = document.querySelector('.author-hero')
  const names = [
    '_presocráticos',
    '_sócrates & sofistas',
    '_platón',
    '_aristóteles',
    '_escuelas helenísticas',
    '_neoplatonismo',
    '_filosofía medieval',
    '_renacimiento & humanismo',
    '_racionalismo',
    '_empirismo',
    '_ilustración',
    '_kant',
    '_hegel',
  ]

  let currentName = ''
  authorName.textContent = currentName

  images.forEach((i, index) => {
    i.addEventListener('mouseenter', () => {
      currentName = names[index]
      authorName.textContent = currentName
    })
  })
}

export default hoverNames

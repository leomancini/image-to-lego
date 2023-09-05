const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

async function render() {
  const request = await fetch('http://localhost:3000')
  const response = await request.json()

  let viewer = document.querySelector('.viewer')

  response.bricks.map((data, index) => {
    let brick = document.createElement('div')
    brick.className = 'brick'
    brick.style.width = `${urlParams.get('zoom') || 10}px`
    brick.style.height = `${urlParams.get('zoom') || 10}px`

    if (urlParams.get('colors') === 'original') {
      brick.style.backgroundColor = `#${data.originalColor}`
    } else {
      brick.style.backgroundColor = `#${data.nearestLegoColor.match.hex}`
    }

    viewer.append(brick)

    let rowBreak = document.createElement('div')
    rowBreak.className = 'rowBreak'

    if ((index+1) % Math.ceil(response.counts.columns) === 0) {
      viewer.append(rowBreak)
    }
  })
}

render()
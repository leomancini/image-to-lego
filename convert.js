import express from 'express'
import cors from 'cors'
import Jimp from 'jimp'
import fs from 'fs/promises'
import nearestLegoColor from 'nearest-color'

const convertRGBtoHEX = (rgb) => {
  // From https://stackoverflow.com/a/3627747
  return `${rgb.match(/^(\d+),\s*(\d+),\s*(\d+)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
}

const getImageData = async (config) => {
  const image = await Jimp.read(`input/${config.filename}`)

  return {
    data: image,
    width: image.bitmap.width,
    height: image.bitmap.height 
  }
}

const getLegoColorData = async () => {
  let file = await fs.readFile('data/LegoColors.json')
  let data = JSON.parse(file)

  return data.colors
}

const convertToBricks = async (image) => {
  const legoColorData = await getLegoColorData()
  const legoColorsAvailableThisYear = legoColorData.filter((color) => color.available.end === config.year)
  const legoColorsCodes = {};

  legoColorsAvailableThisYear.map((legoColor) => {
    legoColorsCodes[legoColor.id] = legoColor.hex
  })

  const getNearestLegoColor = nearestLegoColor.from(legoColorsCodes)

  const bricks = []

  for (let y = 0; y < image.height; y++) {
    if(y % config.scale == 0) {
      for (let x = 0; x < image.width; x++) {
        if(x % config.scale == 0) {
          let pixel = Jimp.intToRGBA(image.data.getPixelColor(x, y))
          let hex = convertRGBtoHEX(`${pixel.r},${pixel.g},${pixel.b}`)
          let nearestLegoColor = getNearestLegoColor(hex)

          bricks.push({
            originalColor: hex.toUpperCase(),
            nearestLegoColor: {
              match: legoColorsAvailableThisYear.find((color) => color.hex === nearestLegoColor.value),
              distance: nearestLegoColor.distance
            }
          })
        }
      }
    }
  }

  return bricks
}

const countColors = (bricks) => {
  return bricks.map((brick) => {
    return brick.nearestLegoColor.match.name
  }).reduce(function (value1, value2) {
    return (value1[value2] ? ++value1[value2] : (value1[value2] = 1), value1);
  }, {})
}
let config = {
  filename: '2.png',
  year: '2023',
  scale: 20
}

const image = await getImageData(config)
const bricks = await convertToBricks(image)
const colors = countColors(bricks)

const app = express()
const port = 3000

app.use(cors())

app.get('/', (req, res) => {
  res.send({
    counts: {
      columns: Math.ceil(image.width / config.scale),
      rows: Math.ceil(image.height / config.scale),
      bricks: Math.ceil((image.width / config.scale) * (image.height / config.scale)),
      colors
    },
    bricks
  })
})

app.listen(port, () => {
  console.log(`Running on port ${port}`)
})
